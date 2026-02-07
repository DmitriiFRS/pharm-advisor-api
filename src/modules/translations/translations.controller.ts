import { Controller } from '@nestjs/common';
import { TranslationService } from './translations.service';

@Controller('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationService) {}
}
