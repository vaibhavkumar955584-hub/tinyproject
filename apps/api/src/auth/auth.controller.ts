import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest, AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const csrfCookieOptions = { ...cookieOptions, maxAge: 5 * 60 * 1000 };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('google/csrf')
  googleCsrf(@Res({ passthrough: true }) response: Response) {
    const csrfToken = randomBytes(32).toString('hex');
    response.cookie('google_auth_csrf', csrfToken, csrfCookieOptions);
    return { csrfToken };
  }

  @Post('google')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async google(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const input = body as { code?: unknown; csrfToken?: unknown } | null;
    const cookieToken = request.cookies?.google_auth_csrf;
    if (request.header('x-requested-with') !== 'XmlHttpRequest' || typeof input?.csrfToken !== 'string' || typeof cookieToken !== 'string' || input.csrfToken !== cookieToken) {
      throw new BadRequestException({ code: 'INVALID_CSRF_TOKEN', message: 'Google sign-in could not be verified. Please try again.' });
    }
    if (typeof input.code !== 'string' || input.code.length > 2_000) {
      throw new BadRequestException({ code: 'INVALID_GOOGLE_CODE', message: 'Google sign-in returned an invalid authorization code.' });
    }
    const result = await this.auth.signInWithGoogleCode(input.code);
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
