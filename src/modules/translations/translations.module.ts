import { Module } from '@nestjs/common';
import { TranslationsController } from './translations.controller';
import { TranslationService } from './translations.service';

@Module({
  controllers: [TranslationsController],
  providers: [TranslationService],
})
export class TranslationsModule {}
