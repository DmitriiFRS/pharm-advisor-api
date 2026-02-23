import { IsOptional, IsString } from 'class-validator';

export class UpdateContactsDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  addressRu?: string;

  @IsOptional()
  @IsString()
  addressUz?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  telegramLink?: string;

  @IsOptional()
  @IsString()
  googleMapsLink?: string;

  @IsOptional()
  @IsString()
  instagramLink?: string;
}
