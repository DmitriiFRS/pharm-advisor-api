import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from 'src/core/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { PaginationService } from 'src/common/service/pagination.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

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

  async getUserList({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    return this.paginationService.getPaginatedItems({
      modelName: 'User',
      page,
      limit,
      params: {
        orderBy: { createdAt: 'desc' },
        include: { role: true, translations: true },
      },
    });
  }

  async getMe(id: number): Promise<Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
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

  async findOne(email: string): Promise<(User & { role: Role }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    return user;
  }

  async getRegistrationStats(year: number = new Date().getFullYear()) {
    const stats = await this.prisma.$queryRaw<{ month: number; count: bigint }[]>`
      SELECT MONTH(createdAt) as month,
      COUNT(*) as count
      FROM users
      WHERE YEAR(createdAt) = ${year}
      GROUP BY MONTH(createdAt)
      ORDER BY month ASC
    `;

    const result = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2000, i, 1);
      return {
        month: date.toLocaleString('en-US', {
          month: 'short',
        }),
        users: 0,
      };
    });

    stats.forEach((item) => {
      // Явное приведение BigInt к Number перед использованием
      const index = Number(item.month) - 1;
      if (index >= 0 && index < 12) {
        result[index].users = Number(item.count);
      }
    });
    return result;
  }

  async getDashboardActivity() {
    const [latestRegistrations, latestLogins] = await Promise.all([
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          role: {
            admin: false,
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          role: true,
        },
      }),
      this.prisma.userLogin.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          user: {
            role: {
              admin: false,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);
    return {
      latestRegistrations,
      latestLogins,
    };
  }
}
