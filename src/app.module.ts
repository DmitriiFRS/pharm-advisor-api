import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './core/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SmsModule } from './modules/sms/sms.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { MailModule } from './modules/mail/mail.module';
import { FaqModule } from './modules/faq/faq.module';

@Module({
  imports: [AuthModule, UsersModule, SmsModule, ArticlesModule, TranslationsModule, ContactsModule, MailModule, FaqModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
