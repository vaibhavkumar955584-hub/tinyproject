import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { TendersService } from './tenders.service';

@Controller('tenders')
@UseGuards(AuthGuard)
export class TendersController {
  constructor(private readonly tenders: TendersService) {}

  @Get(':id')
  detail(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.tenders.detail(request.user.sub, id);
  }

  @Get(':id/verdict')
  verdict(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.tenders.detail(request.user.sub, id).then((tender) => tender.verdict);
  }
}
