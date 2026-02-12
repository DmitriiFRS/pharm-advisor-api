import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/core/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EnvironmentVariables } from 'src/types/env/EnvironmentVariables.type';
import { RegisterDto } from './dto/register.dto';
import { Role, User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

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
      include: {
        role: true,
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Доступ запрещен.');
    }

    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Некорректный Refresh Token');
    }
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const refreshTokenMatches = hash === user.hashedRefreshToken;

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
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  private async loginUser(user: User & { role: Role }) {
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const isAdmin = user.role?.admin;

    if (!isAdmin) {
      const lastLogin = await this.prisma.userLogin.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const shouldLog = !lastLogin || lastLogin.createdAt < oneHourAgo;
      if (shouldLog) {
        await this.prisma.userLogin.create({
          data: { userId: user.id },
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roleId: user.roleId,
        },
        ...tokens,
      };
    }
  }

  private async getTokens(userId: number, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          jti: uuidv4(),
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
          jti: uuidv4(),
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

  async checkAccessTokenExpiration(accessToken: string) {
    try {
      await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new ForbiddenException('Token expired');
      }
      throw e;
    }
  }

  async adminLogin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    if (user.role.admin === false) {
      throw new UnauthorizedException('Недостаточно прав');
    }

    if (!user.password || !user.email) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return this.loginUser(user);
  }

  async getLoginStats(year: number = new Date().getFullYear()) {
    const stats = await this.prisma.$queryRaw<{ month: number; count: bigint }[]>`
      SELECT MONTH(createdAt) as month,
      COUNT(*) as count
      FROM user_logins
      WHERE YEAR(createdAt) = ${year}
      GROUP BY MONTH(createdAt)
      ORDER BY month ASC
    `;
    const result = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2000, i, 1);
      return {
        month: date.toLocaleString('en-US', { month: 'short' }),
        logins: 0,
      };
    });
    stats.forEach((item) => {
      const index = Number(item.month) - 1;
      if (index >= 0 && index < 12) {
        result[index].logins = Number(item.count);
      }
    });
    return result;
  }
}
