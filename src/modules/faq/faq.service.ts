import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';
import { PaginationService } from 'src/common/service/pagination.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { CreateFaqDto } from './dto/create-faq.dto';

@Injectable()
export class FaqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
    private readonly paginationService: PaginationService,
  ) {}

  async getAllFaqs(locale: string) {
    const faqs = await this.prisma.faq.findMany({
      include: { translations: true },
      orderBy: { createdAt: 'asc' },
    });
    return this.translationService.translateDeep(faqs, locale);
  }

  async getFaqs({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    return this.paginationService.getPaginatedItems({
      modelName: 'Faq',
      page,
      limit,
      params: {
        orderBy: { createdAt: 'desc' },
        include: { translations: true },
      },
    });
  }

  async getTranslatedFaqs({ locale, paginationDto }: { locale: string; paginationDto: PaginationDto }) {
    const { page = 1, limit = 10 } = paginationDto;
    const { data, meta } = await this.getFaqs({ page, limit });
    return {
      data: this.translationService.translateDeep(data, locale),
      meta,
    };
  }

  async getFaqById(id: number, locale: string) {
    const faq = await this.prisma.faq.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!faq) {
      throw new NotFoundException(`Faq with ID ${id} not found`);
    }
    const data = this.translationService.translateDeep(faq, locale);
    return { ...data, translations: faq.translations };
  }

  async createFaq(dto: CreateFaqDto) {
    const { questionRu, questionUz, answerRu, answerUz } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const faq = await tx.faq.create({
        data: {
          question: questionRu,
          answer: answerRu,
        },
      });
      const translations: Prisma.FaqTranslationUncheckedCreateInput[] = [];
      if (questionRu || answerRu) {
        translations.push({
          faqId: faq.id,
          locale: 'ru',
          question: questionRu,
          answer: answerRu,
        });
      }
      if (questionUz || answerUz) {
        translations.push({
          faqId: faq.id,
          locale: 'uz',
          question: questionUz || '',
          answer: answerUz || '',
        });
      }
      if (translations.length > 0) {
        await tx.faqTranslation.createMany({
          data: translations,
        });
      }
      return faq;
    });
  }

  async updateFaq(id: number, dto: CreateFaqDto) {
    const { questionRu, questionUz, answerRu, answerUz } = dto;
    return await this.prisma.$transaction(async (tx) => {
      const currentFaq = await tx.faq.findUnique({ where: { id } });
      if (!currentFaq) {
        throw new BadRequestException('Faq not found');
      }
      const updateData: any = {};
      if (questionRu) updateData.question = questionRu;
      if (answerRu) updateData.answer = answerRu;

      const faq = await tx.faq.update({
        where: { id },
        data: updateData,
      });
      if (questionRu || answerRu) await this.upsertTranslation(tx, id, 'ru', questionRu, answerRu);
      if (questionUz || answerUz) await this.upsertTranslation(tx, id, 'uz', questionUz || '', answerUz || '');
      return faq;
    });
  }

  private async upsertTranslation(
    tx: Prisma.TransactionClient,
    faqId: number,
    locale: string,
    question: string,
    answer: string,
  ) {
    if (!question && !answer) return;
    const existingTranslation = await tx.faqTranslation.findUnique({
      where: { faqId_locale: { faqId, locale } },
    });
    if (existingTranslation) {
      await tx.faqTranslation.update({
        where: { id: existingTranslation.id },
        data: {
          question: question || existingTranslation.question,
          answer: answer || existingTranslation.answer,
        },
      });
    } else {
      await tx.faqTranslation.create({
        data: {
          faqId,
          locale,
          question: question || '',
          answer: answer || '',
        },
      });
    }
  }

  async deleteFaq(id: number) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) {
      throw new BadRequestException('Faq not found');
    }
    return await this.prisma.faq.delete({ where: { id } });
  }
}
