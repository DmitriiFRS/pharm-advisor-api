import { Body, Controller, Get, UseGuards, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('get-me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser('id') userId: number) {
    return await this.usersService.getMe(userId);
  }

  @Patch('update-me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@GetUser('id') userId: number, @Body() dto: UpdateProfileDto) {
    return await this.usersService.updateProfile(userId, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@GetUser('id') userId: number, @Body() dto: ChangePasswordDto) {
    return await this.usersService.changePassword(userId, dto);
  }

  @Get('registration-stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async getRegistrationStats(@Query('year') year?: string) {
    const parsedYear = year ? parseInt(year) : new Date().getFullYear();
    return await this.usersService.getRegistrationStats(parsedYear);
  }

  @Get('dashboard-activity')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async getDashboardActivity() {
    return await this.usersService.getDashboardActivity();
  }
}
