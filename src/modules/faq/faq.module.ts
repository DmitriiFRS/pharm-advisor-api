import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';
import { PaginationService } from 'src/common/service/pagination.service';

@Module({
  controllers: [FaqController],
  providers: [FaqService, PrismaService, TranslationService, PaginationService],
})
export class FaqModule {}
