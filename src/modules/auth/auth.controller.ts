import { Body, Controller, ForbiddenException, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtPayload } from 'src/types/jwt/jwt-payload.type';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';

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
    @Body() dto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const userId = userFromToken?.sub;

    if (!userId) {
      throw new ForbiddenException('Could not identify user from token payload.');
    }

    return await this.authService.refreshTokens(userId, dto.refreshToken);
  }
  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  //======================== admin ========================
  @Post('admin/login')
  async adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Get('login-stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async getLoginStats(@Query('year') year?: string) {
    const parsedYear = year ? parseInt(year) : new Date().getFullYear();
    return await this.authService.getLoginStats(parsedYear);
  }
}
