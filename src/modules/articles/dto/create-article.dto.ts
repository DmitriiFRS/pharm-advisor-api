import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsDateString()
  publishedAt: Date;

  @IsOptional()
  @IsString()
  slug?: string;
}
