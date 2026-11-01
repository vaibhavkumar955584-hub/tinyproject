import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET') }), inject: [ConfigService] })],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard, AuthService, JwtModule],
})
export class AuthModule {}
