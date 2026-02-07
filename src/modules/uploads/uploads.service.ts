import { PrismaService } from 'src/core/prisma.service';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  public sanitizeSvg(buffer: Buffer): Buffer {
    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
    const svgString = buffer.toString('utf-8');
    const sanitizedString = purify.sanitize(svgString);
    return Buffer.from(sanitizedString, 'utf-8');
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не предоставлен');

    const uploadFolder = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadFolder, uniqueFileName);

    try {
      await fs.promises.writeFile(filePath, file.buffer);

      return {
        url: `/uploads/${uniqueFileName}`,
        fileName: uniqueFileName,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Ошибка при сохранении файла');
    }
  }
}
