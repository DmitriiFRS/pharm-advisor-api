import { Body, Controller, Get, UseGuards, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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
  async updateProfile(
    @GetUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.usersService.updateProfile(userId, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @GetUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return await this.usersService.changePassword(userId, dto);
  }
}
