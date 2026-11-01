import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const normalizedEmail = email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) throw new ConflictException({ code: 'EMAIL_IN_USE', message: 'An account with this email already exists.' });
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({ data: { email: normalizedEmail, passwordHash } });
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email }, { expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email } };
  }

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const valid = user ? await argon2.verify(user.passwordHash, password) : false;
    if (!user || !valid) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email }, { expiresIn: '7d' });
    return { token, user: { id: user.id, email: user.email } };
  }

  async currentUser(userId: string): Promise<{ id: string; email: string; hasProfile: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: { select: { id: true } } } });
    if (!user) throw new UnauthorizedException({ code: 'INVALID_SESSION', message: 'Sign in again to continue.' });
    return { id: user.id, email: user.email, hasProfile: Boolean(user.profile) };
  }
}
