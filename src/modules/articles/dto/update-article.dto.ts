import { IsNumber, IsOptional } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';
import { Type } from 'class-transformer';

export class UpdateArticleDto extends CreateArticleDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  imageId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pdfId?: number;
}
