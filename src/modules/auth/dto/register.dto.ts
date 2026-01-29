import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @IsString()
  name: string;
}
