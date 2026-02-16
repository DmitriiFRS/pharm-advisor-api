import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/core/prisma.service';
import { PaginationService } from 'src/common/service/pagination.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, PaginationService],
  exports: [UsersService],
})
export class UsersModule {}
