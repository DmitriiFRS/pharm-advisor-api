import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @IsString()
  @MinLength(10, { message: 'Номер телефона должен быть не менее 10 символов' })
  phoneNumber: string;

  @IsString()
  @MinLength(2, { message: 'Имя должно быть не менее 2 символов' })
  name: string;
}
//
