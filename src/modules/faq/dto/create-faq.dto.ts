import { IsOptional, IsString } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  questionRu: string;

  @IsOptional()
  @IsString()
  questionUz?: string;

  @IsString()
  answerRu: string;

  @IsOptional()
  @IsString()
  answerUz?: string;
}
