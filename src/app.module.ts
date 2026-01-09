import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './core/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SmsModule } from './modules/sms/sms.module';

@Module({
  imports: [AuthModule, UsersModule, SmsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
