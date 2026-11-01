import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { WatchesService } from './watches.service';

const createWatchSchema = z.object({ tenderId: z.string().min(1), intervalHours: z.coerce.number().int().min(1).max(48).default(6) });
const updateWatchSchema = z.object({ active: z.boolean() });

@Controller('watches')
@UseGuards(AuthGuard)
export class WatchesController {
  constructor(private readonly watches: WatchesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) { return this.watches.list(request.user.sub); }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const input = createWatchSchema.parse(body);
    return this.watches.create(request.user.sub, input.tenderId, input.intervalHours);
  }

  @Patch(':id')
  update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) {
    return this.watches.update(request.user.sub, id, updateWatchSchema.parse(body).active);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.watches.remove(request.user.sub, id); }
}
