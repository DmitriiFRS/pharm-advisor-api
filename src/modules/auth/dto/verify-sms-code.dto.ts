import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';
import { SmsVerificationType } from '@prisma/client';

export class VerifySmsCodeDto {
  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsPhoneNumber('UZ', { message: 'Неверный формат номера телефона' })
  phoneNumber: string;

  @IsNotEmpty({ message: 'Имя обязателено' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Код обязателен' })
  @IsString()
  @Length(6, 6, { message: 'Код должен состоять из 6 цифр' })
  code: string;

  @IsNotEmpty({ message: 'Тип верификации обязателен' })
  @IsEnum(SmsVerificationType, {
    message: 'Неверный тип верификации (ожидается REGISTRATION или LOGIN)',
  })
  type: SmsVerificationType;

  @IsOptional()
  @IsString()
  initData?: string;
}
