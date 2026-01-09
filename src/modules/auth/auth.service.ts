import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/core/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { SmsVerificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';
import { IUser } from 'src/types/user/user.type';
import { EnvironmentVariables } from 'src/types/env/EnvironmentVariables.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async requestRegistrationCode(phone: string) {
    const existingUser = await this.usersService.findOne(phone);
    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким номером телефона уже существует.',
      );
    }

    await this.generateAndSendCode(phone, SmsVerificationType.REGISTRATION);

    return {
      message: 'Код для регистрации отправлен.',
    };
  }

  async requestLoginCode(phone: string) {
    const existingUser = await this.usersService.findOne(phone);
    if (!existingUser) {
      throw new BadRequestException('Пользователь с таким номером не найден.');
    }

    const data = await this.generateAndSendCode(
      phone,
      SmsVerificationType.LOGIN,
    );

    return {
      message: 'Код для входа отправлен.',
      code: data.code,
    };
  }

  async verifySmsCodeAndLogin(dto: VerifySmsCodeDto) {
    const { phoneNumber, name, code, type } = dto;

    const verification = await this.prisma.smsVerification.findUnique({
      where: { phoneNumber_type: { phoneNumber, type } },
    });

    if (
      !verification ||
      verification.code !== code ||
      new Date() > verification.expiresAt
    ) {
      throw new BadRequestException(
        'Неверный код или срок его действия истёк.',
      );
    }

    if (verification) {
      await this.prisma.smsVerification.delete({
        where: { id: verification.id },
      });
    }

    let user = await this.usersService.findOne(phoneNumber);
    if (type === SmsVerificationType.REGISTRATION && !user) {
      user = await this.prisma.user.create({
        data: { phoneNumber, name, roleId: 1 },
      });
    }

    if (!user)
      throw new UnauthorizedException(
        'Не удалось найти или создать пользователя.',
      );
    return this.login(user as IUser);
  }

  async login(user: IUser) {
    const tokens = await this.getTokens(user.id, user.phoneNumber);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refreshTokens(userId: number, refreshToken: string) {
    // if (!refreshToken) {
    //   throw new ForbiddenException('Доступ запрещен.');
    // }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Доступ запрещен.');
    }
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      throw new ForbiddenException('Доступ запрещен.');
    }
    const tokens = await this.getTokens(user.id, user.phoneNumber);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRefreshToken: null,
      },
    });
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const salt = await bcrypt.genSalt();
    const hashedToken = await bcrypt.hash(refreshToken, salt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hashedToken },
    });
  }

  private async generateAndSendCode(
    phoneNumber: string,
    type: SmsVerificationType,
  ): Promise<{ code: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 минуты

    await this.prisma.smsVerification.upsert({
      where: { phoneNumber_type: { phoneNumber, type } },
      update: { code, expiresAt },
      create: { phoneNumber, code, expiresAt, type },
    });
    // await this.smsService.sendVerificationCode(phone, code);
    console.log(
      `[SMS Service Mock] Code for ${phoneNumber} (${type}): ${code}`,
    );
    return { code };
  }

  private async getTokens(userId: number, phoneNumber: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          phoneNumber,
        },
        {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          phoneNumber,
        },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }
}
