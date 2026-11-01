import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { loginInputSchema, registerInputSchema } from '@tenderguard/shared';
import { AuthenticatedRequest, AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const input = registerInputSchema.parse(body);
    const result = await this.auth.register(input.email, input.password);
    response.cookie('access_token', result.token, cookieOptions);
    return { user: result.user };
  }

  @Post('login')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const input = loginInputSchema.parse(body);
    const result = await this.auth.login(input.email, input.password);
    response.cookie('access_token', result.token, cookieOptions);
    return { user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', { ...cookieOptions, maxAge: undefined });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.currentUser(request.user.sub);
  }
}
