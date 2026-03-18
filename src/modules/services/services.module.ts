import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';
import { PaginationService } from 'src/common/service/pagination.service';
import { UploadsService } from '../uploads/uploads.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, PrismaService, TranslationService, PaginationService, UploadsService],
})
export class ServicesModule {}
