import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ImageService } from './image.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly images: ImageService) {}

  @Get(':type/:filename')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async serveImage(
    @Param('type') type: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const file = await this.images.getFileStream(type, filename);
    if (!file) {
      throw new NotFoundException({ code: 'IMAGE_NOT_FOUND', message: 'Requested tender image not found.' });
    }

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Length', file.buffer.length);
    res.send(file.buffer);
  }
}

