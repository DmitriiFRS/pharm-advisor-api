import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  nameRu: string;

  @IsString()
  nameUz: string;

  @IsString()
  descriptionRu: string;

  @IsString()
  descriptionUz: string;

  @IsString()
  labelRu: string;

  @IsString()
  labelUz: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  order?: number | null;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  price?: number | null;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  serviceFeaturesRu: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  serviceFeaturesUz: string[];
}
