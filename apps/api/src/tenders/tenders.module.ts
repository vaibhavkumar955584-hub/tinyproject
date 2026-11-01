import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ImagesModule } from '../images/images.module';
import { TendersController } from './tenders.controller';
import { TendersService } from './tenders.service';

@Module({ imports: [AuthModule, ImagesModule], controllers: [TendersController], providers: [TendersService], exports: [TendersService] })
export class TendersModule {}
