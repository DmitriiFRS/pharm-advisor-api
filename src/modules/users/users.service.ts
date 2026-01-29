import { Injectable } from '@nestjs/common';
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

  async findOne(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }
}
