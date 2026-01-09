import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Get('get-me')
  // @UseGuards(JwtAuthGuard)
  // async getMe(@GetUser('id') userId: number) {
  //   return await this.usersService.getMe(userId);
  // }
}
