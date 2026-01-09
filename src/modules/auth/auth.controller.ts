import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestCodeDto } from './dto/request-code.dto';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtPayload } from 'src/types/jwt/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-registration-code')
  async requestRegistrationCode(
    @Body() dto: RequestCodeDto,
  ): Promise<{ message: string }> {
    return this.authService.requestRegistrationCode(dto.phoneNumber);
  }

  @Post('request-login-code')
  async requestLoginCode(
    @Body() dto: RequestCodeDto,
  ): Promise<{ message: string; code: string }> {
    return this.authService.requestLoginCode(dto.phoneNumber);
  }

  @Post('verify-code')
  async verifyCode(
    @Body() dto: VerifySmsCodeDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.authService.verifySmsCodeAndLogin(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@GetUser('sub') userId: number): Promise<void> {
    return this.authService.logout(userId);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshTokens(
    @GetUser() userFromToken: JwtPayload,
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const userId = userFromToken?.sub;

    if (!userId) {
      throw new ForbiddenException(
        'Could not identify user from token payload.',
      );
    }

    return await this.authService.refreshTokens(userId, refreshToken);
  }
}
