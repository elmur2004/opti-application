import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { UploadsController } from './uploads.controller';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = (extname(file.originalname) || '').toLowerCase().slice(0, 8);
          const id = randomBytes(12).toString('hex');
          cb(null, `${id}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PNG, JPG, WEBP, GIF images are allowed'), false);
        }
      },
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
