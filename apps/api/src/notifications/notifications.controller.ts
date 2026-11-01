import { Body, Controller, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { NotificationsService } from './notifications.service';

const linkSchema = z.object({ chatId: z.string().regex(/^-?\d{5,20}$/) });

@Controller('telegram')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('link')
  link(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException({ code: 'INVALID_CHAT_ID', message: 'Provide your numeric Telegram chat ID after starting the configured bot.' });
    return this.notifications.linkTelegram(request.user.sub, parsed.data.chatId);
  }
}
