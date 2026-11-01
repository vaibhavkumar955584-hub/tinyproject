import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageService } from './image.service';
import { ImagesController } from './images.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ImagesController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImagesModule {}

