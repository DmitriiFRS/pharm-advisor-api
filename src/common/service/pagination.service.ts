import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class PaginationService {
  constructor(private readonly prisma: PrismaService) {}
  async getPaginatedItems({
    page = 1,
    limit = 10,
    modelName,
    params,
  }: {
    page?: number;
    limit?: number;
    modelName: Prisma.ModelName;
    params?: {
      where?: Prisma.Args<Prisma.ModelName, 'findMany'>;
      orderBy?: Prisma.Args<Prisma.ModelName, 'findMany'>;
      include?: Prisma.Args<Prisma.ModelName, 'findMany'>;
      select?: Prisma.Args<Prisma.ModelName, 'findMany'>;
    };
  }) {
    const skip = (page - 1) * limit;
    const take = limit;
    const [items, total] = await Promise.all([
      this.prisma[modelName].findMany({
        skip,
        take,
        ...params,
      }),
      this.prisma[modelName].count(),
    ]);
    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
