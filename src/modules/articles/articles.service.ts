import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';
import { CreateArticleDto } from './dto/create-article.dto';
import defaultSlugify from 'slugify';
import { UploadsService } from '../uploads/uploads.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

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
    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.article.count(),
    ]);

    return {
      data: articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTranslatedArticles({ locale, paginationDto }: { locale: string; paginationDto: PaginationDto }) {
    const { page = 1, limit = 10 } = paginationDto;
    const { data, meta } = await this.getArticles({ page, limit });
    return {
      data: this.translationService.translateDeep(data, locale),
      meta,
    };
  }

  async createArticle(dto: CreateArticleDto, image: Express.Multer.File) {
    console.log(dto);
    const { publishedAt, slug, titleRu, titleUz, descriptionRu, descriptionUz } = dto;

    return await this.prisma.$transaction(async (tx) => {
      let finalSlug = slug;
      if (!finalSlug) {
        finalSlug = defaultSlugify(titleRu, {
          lower: true,
          strict: true,
          locale: 'ru',
        });
      }
      let uploadedMedia: { id: number } | null = null;
      if (image) {
        uploadedMedia = await this.uploadService.processAndUploadFile(image, tx);
      }
      const article = await tx.article.create({
        data: {
          title: titleRu,
          content: descriptionRu,
          publishedAt,
          slug: finalSlug,
          imageId: uploadedMedia?.id || null,
        },
      });

      // Создаем переводы
      const translations: Prisma.ArticleTranslationUncheckedCreateInput[] = [];
      if (titleRu || descriptionRu) {
        translations.push({
          articleId: article.id,
          locale: 'ru',
          title: titleRu,
          content: descriptionRu,
        });
      }
      if (titleUz || descriptionUz) {
        translations.push({
          articleId: article.id,
          locale: 'uz',
          title: titleUz || '',
          content: descriptionUz || '',
        });
      }

      if (translations.length > 0) {
        await tx.articleTranslation.createMany({
          data: translations,
        });
      }

      return article;
    });
  }

  async updateArticle(id: number, dto: UpdateArticleDto, image: Express.Multer.File) {
    const { publishedAt, slug, imageId, titleRu, titleUz, descriptionRu, descriptionUz } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const currentArticle = await tx.article.findUnique({ where: { id } });
      if (!currentArticle) {
        throw new BadRequestException('Статья не найдена');
      }

      let finalSlug = slug;
      if (!finalSlug && titleRu && titleRu !== currentArticle.title) {
        finalSlug = defaultSlugify(titleRu, {
          lower: true,
          strict: true,
          locale: 'ru',
        });
      }

      const updateData: any = {
        publishedAt,
      };
      if (titleRu) updateData.title = titleRu;
      if (descriptionRu) updateData.content = descriptionRu;

      if (finalSlug) updateData.slug = finalSlug;

      if (imageId) {
        if (currentArticle.imageId !== imageId) throw new BadRequestException('Неверный ID изображения');
        const file = await tx.media.findUnique({ where: { id: imageId } });
        if (!file) {
          throw new BadRequestException('Файл для удаления не найден');
        }
        await this.uploadService.deleteFile(file.url as string, tx);
      }
      if (image) {
        const uploadedImage = await this.uploadService.processAndUploadFile(image, tx);
        updateData.imageId = uploadedImage.id;
      }

      const article = await tx.article.update({
        where: { id },
        data: updateData,
        include: { media: true },
      });

      // Обновляем переводы (upsert)
      if (titleRu || descriptionRu) {
        await this.upsertTranslation(tx, id, 'ru', titleRu, descriptionRu);
      }
      if (titleUz || descriptionUz) {
        await this.upsertTranslation(tx, id, 'uz', titleUz, descriptionUz);
      }

      return article;
    });
  }

  private async upsertTranslation(
    tx: Prisma.TransactionClient,
    articleId: number,
    locale: string,
    title?: string,
    content?: string,
  ) {
    if (!title && !content) return;

    const existing = await tx.articleTranslation.findUnique({
      where: {
        articleId_locale: { articleId, locale },
      },
    });

    if (existing) {
      await tx.articleTranslation.update({
        where: { id: existing.id },
        data: {
          title: title || existing.title,
          content: content || existing.content,
        },
      });
    } else {
      await tx.articleTranslation.create({
        data: {
          articleId,
          locale,
          title: title || '',
          content: content || '',
        },
      });
    }
  }
}
