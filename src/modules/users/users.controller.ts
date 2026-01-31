import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('get-me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser('id') userId: number) {
    return await this.usersService.getMe(userId);
  }
}
