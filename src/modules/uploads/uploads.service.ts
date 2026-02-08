import { PrismaService } from 'src/core/prisma.service';
import { Prisma } from '@prisma/client';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async processAndUploadFile(file: Express.Multer.File, tx?: Prisma.TransactionClient) {
    if (file.mimetype === 'image/svg+xml') {
      file.buffer = this.sanitizeSvg(file.buffer);
    }
    return this.uploadFile(file, tx);
  }

  public sanitizeSvg(buffer: Buffer): Buffer {
    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
    const svgString = buffer.toString('utf-8');
    const sanitizedString = purify.sanitize(svgString);
    return Buffer.from(sanitizedString, 'utf-8');
  }

  async uploadFile(file: Express.Multer.File, tx?: Prisma.TransactionClient) {
    if (!file) throw new BadRequestException('Файл не предоставлен');

    const uploadFolder = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadFolder, uniqueFileName);

    try {
      await fs.promises.writeFile(filePath, file.buffer);

      const db = tx || this.prisma;
      const media = await db.media.create({
        data: {
          url: `/uploads/${uniqueFileName}`,
          fileName: uniqueFileName,
          mimeType: file.mimetype,
          size: file.size,
        },
      });

      return media;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Ошибка при сохранении файла');
    }
  }

  async deleteFile(fileUrl: string, tx?: Prisma.TransactionClient) {
    if (!fileUrl) return;
    const filePath = path.join(process.cwd(), fileUrl);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      const db = tx || this.prisma;
      await db.media.deleteMany({
        where: {
          url: fileUrl,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
