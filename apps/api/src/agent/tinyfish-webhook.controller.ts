import { Body, Controller, Headers, HttpCode, Logger, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhooks')
export class TinyFishWebhookController {
  private readonly logger = new Logger(TinyFishWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('tinyfish')
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-tinyfish-signature') signature?: string,
  ) {
    this.logger.log(`Received TinyFish webhook notification for run: ${payload?.run_id ?? payload?.id}`);

    const runId = payload?.run_id ?? payload?.id;
    if (!runId) return { received: true };

    const status = payload?.status ?? 'COMPLETED';
    const result = payload?.result ?? null;
    const error = payload?.error ?? null;

    try {
      await this.prisma.tinyFishRun.update({
        where: { runId },
        data: {
          status,
          resultJson: result ?? undefined,
          errorJson: error ?? undefined,
          finishedAt: new Date(),
        },
      });
    } catch {
      // Run may not have been tracked yet or was created outside
    }

    return { received: true, runId };
  }
}

