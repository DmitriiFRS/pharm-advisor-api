import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { PrismaService } from 'src/core/prisma.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, PrismaService],
  exports: [UploadsService],
})
export class UploadsModule {}
