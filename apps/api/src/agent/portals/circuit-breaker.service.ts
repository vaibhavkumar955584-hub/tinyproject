import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_CONSECUTIVE_FAILURES = 3;
const CIRCUIT_OPEN_DURATION_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isAvailable(portalId: string): Promise<boolean> {
    try {
      const record = await this.prisma.portalHealth.findUnique({ where: { portalId } });
      if (!record) return true;

      if (record.circuitOpenUntil && record.circuitOpenUntil.getTime() > Date.now()) {
        this.logger.debug(`Circuit is OPEN for portal ${portalId} until ${record.circuitOpenUntil.toISOString()}`);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  async recordSuccess(portalId: string, latencyMs: number): Promise<void> {
    try {
      const existing = await this.prisma.portalHealth.findUnique({ where: { portalId } });
      const currentAvg = existing?.avgLatencyMs || latencyMs;
      const newAvg = Math.round((currentAvg * 4 + latencyMs) / 5);

      await this.prisma.portalHealth.upsert({
        where: { portalId },
        create: {
          portalId,
          successCount: 1,
          failureCount: 0,
          consecutiveFailures: 0,
          lastSuccessAt: new Date(),
          avgLatencyMs: latencyMs,
          circuitOpenUntil: null,
        },
        update: {
          successCount: { increment: 1 },
          consecutiveFailures: 0,
          lastSuccessAt: new Date(),
          avgLatencyMs: newAvg,
          circuitOpenUntil: null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to record health success for ${portalId}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  async recordFailure(portalId: string, error: string): Promise<void> {
    try {
      const existing = await this.prisma.portalHealth.findUnique({ where: { portalId } });
      const consecutive = (existing?.consecutiveFailures ?? 0) + 1;
      const shouldTrip = consecutive >= MAX_CONSECUTIVE_FAILURES;
      const circuitOpenUntil = shouldTrip ? new Date(Date.now() + CIRCUIT_OPEN_DURATION_MS) : null;

      if (shouldTrip) {
        this.logger.warn(`Circuit breaker TRIPPED for portal ${portalId} after ${consecutive} failures. Pausing for 5 min.`);
      }

      await this.prisma.portalHealth.upsert({
        where: { portalId },
        create: {
          portalId,
          successCount: 0,
          failureCount: 1,
          consecutiveFailures: 1,
          lastFailureAt: new Date(),
          lastError: error.slice(0, 200),
          circuitOpenUntil,
        },
        update: {
          failureCount: { increment: 1 },
          consecutiveFailures: consecutive,
          lastFailureAt: new Date(),
          lastError: error.slice(0, 200),
          circuitOpenUntil,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to record health failure for ${portalId}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  async getHealthMap(): Promise<Record<string, { status: 'healthy' | 'degraded' | 'unavailable'; latencyMs: number; lastError?: string }>> {
    try {
      const records = await this.prisma.portalHealth.findMany();
      const map: Record<string, { status: 'healthy' | 'degraded' | 'unavailable'; latencyMs: number; lastError?: string }> = {};

      for (const r of records) {
        const isOpen = r.circuitOpenUntil && r.circuitOpenUntil.getTime() > Date.now();
        const status = isOpen ? 'unavailable' : r.consecutiveFailures > 0 ? 'degraded' : 'healthy';
        map[r.portalId] = {
          status,
          latencyMs: r.avgLatencyMs,
          ...(r.lastError ? { lastError: r.lastError } : {}),
        };
      }
      return map;
    } catch {
      return {};
    }
  }
}
