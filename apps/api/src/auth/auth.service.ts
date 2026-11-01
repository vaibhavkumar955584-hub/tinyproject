import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'node:crypto';

const COOKIE_NAME = 'tg_session';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const expectedKey = parts[2];
    if (!salt || !expectedKey) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(expectedKey, 'hex'));
    } catch {
      return false;
    }
  }
  return false;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) { }

  private cookieOptions() {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const cookieMode = this.config.get<string>('COOKIE_MODE') === 'cross-site';
    return {
      httpOnly: true,
      secure: isProd || cookieMode,
      sameSite: (cookieMode ? 'none' : 'lax') as 'lax' | 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  private createGoogleClient(): { client: OAuth2Client; clientId: string } {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new ServiceUnavailableException({ code: 'GOOGLE_AUTH_NOT_CONFIGURED', message: 'Google sign-in is not configured yet.' });
    return { client: new OAuth2Client(clientId, clientSecret, this.config.getOrThrow<string>('WEB_ORIGINS')), clientId };
  }

  async register(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const existing = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) throw new UnauthorizedException({ code: 'AUTH_INVALID', message: 'An account with this email already exists.' });
    const passwordHash = hashPassword(password);
    const user = await this.prisma.user.create({ data: { email: email.toLowerCase(), passwordHash } });
    return this.issueSession(user);
  }

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash) throw new UnauthorizedException({ code: 'AUTH_INVALID', message: 'Invalid email or password.' });
    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException({ code: 'AUTH_INVALID', message: 'Invalid email or password.' });
    return this.issueSession(user);
  }

  private async issueSession(user: { id: string; email: string }): Promise<{ token: string; user: { id: string; email: string } }> {
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email }, { expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email } };
  }

  async signInWithGoogleCode(code: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const { client, clientId } = this.createGoogleClient();
    let payload;
    try {
      const { tokens } = await client.getToken(code);
      if (!tokens.id_token) throw new Error('Google did not return an ID token.');
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_GOOGLE_CREDENTIAL', message: 'Google could not verify this sign-in. Please try again.' });
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException({ code: 'UNVERIFIED_GOOGLE_ACCOUNT', message: 'Use a Google account with a verified email address.' });
    }

    const email = payload.email.toLowerCase();
    const existingGoogleUser = await this.prisma.user.findUnique({ where: { googleSubject: payload.sub } });
    const existingEmailUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingGoogleUser && existingEmailUser && existingGoogleUser.id !== existingEmailUser.id) {
      throw new UnauthorizedException({ code: 'GOOGLE_ACCOUNT_CONFLICT', message: 'This Google account email is already linked to another workspace.' });
    }
    if (!existingGoogleUser && existingEmailUser?.googleSubject && existingEmailUser.googleSubject !== payload.sub) {
      throw new UnauthorizedException({ code: 'GOOGLE_ACCOUNT_CONFLICT', message: 'This workspace is linked to a different Google account.' });
    }
    const user = existingGoogleUser
      ? await this.prisma.user.update({ where: { id: existingGoogleUser.id }, data: { email } })
      : existingEmailUser
        ? await this.prisma.user.update({ where: { id: existingEmailUser.id }, data: { googleSubject: payload.sub } })
        : await this.prisma.user.create({ data: { email, googleSubject: payload.sub } });
    return this.issueSession(user);
  }

  async currentUser(userId: string): Promise<{ id: string; email: string; hasProfile: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: { select: { id: true } } } });
    if (!user) throw new UnauthorizedException({ code: 'INVALID_SESSION', message: 'Sign in again to continue.' });
    return { id: user.id, email: user.email, hasProfile: Boolean(user.profile) };
  }

  getCookieName(): string {
    return COOKIE_NAME;
  }

  getCookieOptions(): Record<string, unknown> {
    return this.cookieOptions();
  }
}
