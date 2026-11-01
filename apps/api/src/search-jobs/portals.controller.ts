import { Controller, Get } from '@nestjs/common';
import { PORTAL_REGISTRY } from '../agent/portals/registry';
import { CircuitBreakerService } from '../agent/portals/circuit-breaker.service';

@Controller('portals')
export class PortalsController {
  constructor(private readonly circuit: CircuitBreakerService) {}

  @Get()
  async listPortals() {
    const healthMap = await this.circuit.getHealthMap();
    return PORTAL_REGISTRY.map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      domains: p.domains,
      states: p.states,
      sectors: p.sectors,
      priority: p.priority,
      enabled: p.enabled,
      health: healthMap[p.id]?.status ?? 'healthy',
      latencyMs: healthMap[p.id]?.latencyMs ?? 0,
      lastError: healthMap[p.id]?.lastError,
    }));
  }
}
