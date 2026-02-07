import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';
import { CreateArticleDto } from './dto/create-article.dto';
import defaultSlugify from 'slugify';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
    private readonly uploadService: UploadsService,
  ) {}

  async getArticles({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const skip = (page - 1) * limit;
    const take = limit;
    const articles = await this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    return articles;
  }

  async getTranslatedArticles({ locale, page = 1, limit = 10 }: { locale: string; page?: number; limit?: number }) {
    const articles = await this.getArticles({ page, limit });
    return this.translationService.translateDeep(articles, locale);
  }

  async createArticle(dto: CreateArticleDto, image: Express.Multer.File) {
    const { title, content, publishedAt, slug } = dto;
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = defaultSlugify(title, {
        lower: true,
        strict: true,
        locale: 'ru',
      });
    }
    let uploadedImage: { url: string; fileName: string; mimeType: string; size: number } | null = null;
    if (image) {
      if (image.mimetype === 'image/svg+xml') {
        image.buffer = this.uploadService.sanitizeSvg(image.buffer);
      }
      uploadedImage = await this.uploadService.uploadFile(image);
    }
    const article = await this.prisma.article.create({
      data: {
        title,
        content,
        publishedAt,
        slug: finalSlug,
        image: uploadedImage?.url,
      },
    });
    return article;
  }
}
