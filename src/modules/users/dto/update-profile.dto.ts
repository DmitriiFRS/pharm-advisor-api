import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phoneNumber: string;
}
