import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  private createGoogleClient(): { client: OAuth2Client; clientId: string } {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new ServiceUnavailableException({ code: 'GOOGLE_AUTH_NOT_CONFIGURED', message: 'Google sign-in is not configured yet.' });
    return { client: new OAuth2Client(clientId, clientSecret, this.config.getOrThrow<string>('WEB_ORIGIN')), clientId };
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
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email }, { expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email } };
  }

  async currentUser(userId: string): Promise<{ id: string; email: string; hasProfile: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: { select: { id: true } } } });
    if (!user) throw new UnauthorizedException({ code: 'INVALID_SESSION', message: 'Sign in again to continue.' });
    return { id: user.id, email: user.email, hasProfile: Boolean(user.profile) };
  }
}
