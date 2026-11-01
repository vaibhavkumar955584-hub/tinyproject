import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FixtureWebAgent } from './fixture-web-agent.adapter';
import { TinyFishController } from './tinyfish.controller';
import { TinyFishWebhookController } from './tinyfish-webhook.controller';
import { TinyFishService } from './tinyfish.service';
import { TinyFishWebAgent } from './tinyfish-web-agent.adapter';
import { GepnicAdapter } from './portals/gepnic.adapter';
import { CircuitBreakerService } from './portals/circuit-breaker.service';
import { WEB_AGENT_PORT } from './web-agent.port';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [
    FixtureWebAgent,
    TinyFishWebAgent,
    TinyFishService,
    GepnicAdapter,
    CircuitBreakerService,
    {
      provide: WEB_AGENT_PORT,
      inject: [ConfigService, FixtureWebAgent, TinyFishWebAgent],
      useFactory: (config: ConfigService, fixture: FixtureWebAgent, live: TinyFishWebAgent) =>
        config.get('AGENT_MODE', 'fixture') === 'live' ? live : fixture,
    },
  ],
  controllers: [TinyFishController, TinyFishWebhookController],
  exports: [WEB_AGENT_PORT, TinyFishService, GepnicAdapter, CircuitBreakerService],
})
export class AgentModule {}
