import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async notifyAlert(alertId: string): Promise<void> {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId }, include: { user: true, tender: true } });
    if (!alert) return;
    const changes = `${alert.changeType}: ${JSON.stringify(alert.beforeJson)} → ${JSON.stringify(alert.afterJson)}`;
    let delivered = false;
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (token && alert.user.telegramChatId) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: alert.user.telegramChatId, text: `TenderGuard update: ${alert.tender.title}\n${changes}\nVerify the official tender document before acting.` }),
          signal: AbortSignal.timeout(10_000),
        });
        delivered = response.ok || delivered;
        if (!response.ok) this.logger.warn(`Telegram alert delivery failed (${response.status}).`);
      } catch (error) { this.logger.warn(`Telegram alert delivery failed: ${error instanceof Error ? error.message : 'unknown error'}`); }
    }
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      try {
        const transport = nodemailer.createTransport({ host, port: this.config.get<number>('SMTP_PORT', 1025), secure: false, ...(this.config.get<string>('SMTP_USER') ? { auth: { user: this.config.get<string>('SMTP_USER'), pass: this.config.get<string>('SMTP_PASSWORD') } } : {}) });
        await transport.sendMail({ from: this.config.get<string>('SMTP_FROM', 'dev@tenderguard.local'), to: alert.user.email, subject: `TenderGuard: ${alert.changeType.toLowerCase()} update`, text: `${alert.tender.title}\n\n${changes}\n\nDecision support, not legal advice. Verify against the official tender document.` });
        delivered = true;
      } catch (error) { this.logger.warn(`Email alert delivery failed: ${error instanceof Error ? error.message : 'unknown error'}`); }
    }
    if (delivered) await this.prisma.alert.update({ where: { id: alert.id }, data: { sentAt: new Date() } });
  }

  async linkTelegram(userId: string, chatId: string): Promise<{ linked: true }> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('Telegram linking requires TELEGRAM_BOT_TOKEN.');
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: 'TenderGuard alerts are connected. You will receive updates for tenders you watch.' }),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json() as { ok?: boolean; description?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.description || 'Telegram could not message this chat. Start your bot conversation and retry.');
    await this.prisma.user.update({ where: { id: userId }, data: { telegramChatId: chatId } });
    return { linked: true };
  }
}
