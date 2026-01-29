import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtPayload } from 'src/types/jwt/jwt-payload.type';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
