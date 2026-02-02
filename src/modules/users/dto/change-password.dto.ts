import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Введите пароль' })
  @MinLength(6, { message: 'Пароль должен содержать не менее 6 символов' })
  @MaxLength(20, { message: 'Пароль должен содержать не более 20 символов' })
  password: string;

  @IsString({ message: 'Введите новый пароль' })
  @MinLength(6, {
    message: 'Новый пароль должен содержать не менее 6 символов',
  })
  @MaxLength(20, {
    message: 'Новый пароль должен содержать не более 20 символов',
  })
  newPassword: string;
}
