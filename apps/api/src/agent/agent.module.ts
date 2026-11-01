import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FixtureWebAgent } from './fixture-web-agent.adapter';
import { TinyFishWebAgent } from './tinyfish-web-agent.adapter';
import { WEB_AGENT_PORT } from './web-agent.port';

@Module({
  providers: [FixtureWebAgent, TinyFishWebAgent, {
    provide: WEB_AGENT_PORT,
    inject: [ConfigService, FixtureWebAgent, TinyFishWebAgent],
    useFactory: (config: ConfigService, fixture: FixtureWebAgent, live: TinyFishWebAgent) => config.get('AGENT_MODE', 'fixture') === 'live' ? live : fixture,
  }],
  exports: [WEB_AGENT_PORT],
})
export class AgentModule {}
