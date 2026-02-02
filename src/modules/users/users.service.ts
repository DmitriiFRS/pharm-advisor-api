import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from 'src/core/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async genUniqueSlug(attempts = 5, email: string): Promise<string> {
    for (let i = 0; i < attempts; i++) {
      const slug = `u-${Date.now()}-${nanoid(6)}`;
      const exists = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!exists) return slug;
    }
    // fallback
    return `u-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  async getMe(id: number): Promise<Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return user;
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> | null> {
    console.log('userId', userId);
    console.log('dto', dto);
    const user = await this.getMe(userId);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updatedUser;
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный пароль');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updatedUser;
  }

  async findOne(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }
}
