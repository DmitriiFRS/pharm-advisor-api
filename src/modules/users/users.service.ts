import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from 'src/core/prisma.service';

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

  async getMe(
    id: number,
  ): Promise<Pick<
    User,
    'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'
  > | null> {
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
    console.log(user);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return user;
  }

  async findOne(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }
}
