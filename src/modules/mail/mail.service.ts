import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/types/env/EnvironmentVariables.type';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: Number(this.configService.get('SMTP_PORT')),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.configService.get('CLIENT_URL')}/verify?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: 'Подтверждение регистрации',
      html: `
        <h1>Добро пожаловать!</h1>
        <p>Для завершения регистрации перейдите по ссылке:</p>
        <a href="${verificationUrl}">Подтвердить Email</a>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${this.configService.get('CLIENT_URL')}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: 'Сброс пароля',
      html: `
      <h1>Сброс пароля</h1>
      <p>Вы запросили сброс пароля. Перейдите по ссылке ниже, чтобы задать новый пароль:</p>
      <a href="${resetLink}">Сбросить пароль</a>
      <p>Ссылка действительна в течение 1 часа.</p>
    `,
    });
  }
}
