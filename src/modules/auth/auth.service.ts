import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/core/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EnvironmentVariables } from 'src/types/env/EnvironmentVariables.type';
import { RegisterDto } from './dto/register.dto';
import { User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findOne(dto.email);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        roleId: 1, // Или другая логика для роли
      },
    });
    return this.loginUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findOne(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return this.loginUser(user);
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
    const tokens = await this.getTokens(user.id, user.email);
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

  private async loginUser(user: User) {
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  private async getTokens(userId: number, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
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
