import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';
import { CreateArticleDto } from './dto/create-article.dto';
import defaultSlugify from 'slugify';
import { UploadsService } from '../uploads/uploads.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PaginationService } from 'src/common/service/pagination.service';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
    private readonly uploadService: UploadsService,
    private readonly paginationService: PaginationService,
  ) {}

  async getArticles({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    return this.paginationService.getPaginatedItems({
      modelName: 'Article',
      page,
      limit,
      params: {
        orderBy: { createdAt: 'desc' },
        include: { media: true, pdf: true, translations: true },
      },
    });
  }

  async getTranslatedArticles({ locale, paginationDto }: { locale: string; paginationDto: PaginationDto }) {
    const { page = 1, limit = 10 } = paginationDto;
    const { data, meta } = await this.getArticles({ page, limit });
    return {
      data: this.translationService.translateDeep(data, locale),
      meta,
    };
  }

  async getArticleById(id: number, locale: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { media: true, pdf: true, translations: true },
    });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    const data = this.translationService.translateDeep(article, locale);
    return { ...data, translations: article.translations };
  }

  async createArticle(dto: CreateArticleDto, files: { image?: Express.Multer.File[]; pdf?: Express.Multer.File[] }) {
    const { publishedAt, slug, titleRu, titleUz, descriptionRu, descriptionUz, youtubeLink } = dto;

    const image = files.image?.[0];
    const pdf = files.pdf?.[0];

    return await this.prisma.$transaction(async (tx) => {
      let finalSlug = slug;
      if (!finalSlug) {
        finalSlug = defaultSlugify(titleRu, {
          lower: true,
          strict: true,
          locale: 'ru',
        });
      }
      let uploadedMediaId: number | null = null;
      if (image) {
        const uploaded = await this.uploadService.processAndUploadFile(image, tx);
        uploadedMediaId = uploaded.id;
      }
      let uploadedPdfId: number | null = null;
      if (pdf) {
        const uploaded = await this.uploadService.processAndUploadFile(pdf, tx);
        uploadedPdfId = uploaded.id;
      }
      const article = await tx.article.create({
        data: {
          title: titleRu,
          content: descriptionRu,
          publishedAt,
          slug: finalSlug,
          youtubeLink,
          imageId: uploadedMediaId || null,
          pdfId: uploadedPdfId || null,
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

  async updateArticle(
    id: number,
    dto: UpdateArticleDto,
    files: { image?: Express.Multer.File[]; pdf?: Express.Multer.File[] },
  ) {
    const { publishedAt, slug, imageId, pdfId, titleRu, titleUz, descriptionRu, descriptionUz, youtubeLink } = dto;
    const image = files.image?.[0];
    const pdf = files.pdf?.[0];

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
      if (youtubeLink) {
        updateData.youtubeLink = youtubeLink;
      } else {
        updateData.youtubeLink = null;
      }

      if (imageId) {
        if (currentArticle.imageId !== imageId) throw new BadRequestException('Неверный ID изображения');
        const file = await tx.media.findUnique({ where: { id: imageId } });
        if (!file) {
          throw new BadRequestException('Файл для удаления не найден');
        }
        await this.uploadService.deleteFile(file.url, tx);
      }
      if (image) {
        const uploadedImage = await this.uploadService.processAndUploadFile(image, tx);
        updateData.imageId = uploadedImage.id;
      }

      if (pdfId) {
        if (currentArticle.pdfId !== pdfId) throw new BadRequestException('Неверный ID PDF');
        const file = await tx.media.findUnique({ where: { id: pdfId } });
        if (file) {
          await this.uploadService.deleteFile(file.url, tx);
        }
        updateData.pdfId = null;
      }
      if (pdf) {
        const uploadedPdf = await this.uploadService.processAndUploadFile(pdf, tx);
        updateData.pdfId = uploadedPdf.id;
      }

      const article = await tx.article.update({
        where: { id },
        data: updateData,
        include: { media: true, pdf: true },
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

  async deleteArticle(id: number) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      if (article.imageId) {
        const file = await tx.media.findUnique({ where: { id: article.imageId } });
        if (file) {
          await this.uploadService.deleteFile(file.url, tx);
        }
      }
      return await tx.article.delete({ where: { id } });
    });
  }
}
