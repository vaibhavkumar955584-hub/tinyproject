import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { profileInputSchema } from '@tenderguard/shared';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.profiles.get(request.user.sub);
  }

  @Put()
  save(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.profiles.save(request.user.sub, profileInputSchema.parse(body));
  }
}
