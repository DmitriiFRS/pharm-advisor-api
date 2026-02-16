import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';
import { UploadsService } from '../uploads/uploads.service';
import { PaginationService } from 'src/common/service/pagination.service';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, PrismaService, TranslationService, UploadsService, PaginationService],
})
export class ArticlesModule {}
