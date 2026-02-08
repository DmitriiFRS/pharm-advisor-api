import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  titleRu: string;

  @IsString()
  @IsOptional()
  titleUz?: string;

  @IsString()
  descriptionRu: string;

  @IsOptional()
  @IsString()
  descriptionUz?: string;

  @Type(() => Date)
  @IsDate()
  publishedAt: Date;

  @IsOptional()
  @IsString()
  slug?: string;
}
