import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, PrismaService, TranslationService],
})
export class ContactsModule {}
