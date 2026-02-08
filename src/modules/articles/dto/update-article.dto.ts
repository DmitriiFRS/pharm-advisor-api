import { IsNumber, IsOptional } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';

export class UpdateArticleDto extends CreateArticleDto {
  @IsOptional()
  @IsNumber()
  imageId?: number;
}
