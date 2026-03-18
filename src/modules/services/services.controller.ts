import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async getServices(@Headers() headers: Record<string, string>, @Query() query: PaginationDto) {
    const locale = headers['accept-language'] || 'ru';
    return this.servicesService.getTranslatedServices({ locale, paginationDto: query });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async getAdminServices(@Query() query: PaginationDto) {
    return this.servicesService.getServices(query);
  }

  @Get('getById/:id')
  async getServiceById(@Headers() headers: Record<string, string>, @Param('id') id: number) {
    const locale = headers['accept-language'] || 'ru';
    return this.servicesService.getServiceById(id, locale);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  @UseInterceptors(FileInterceptor('image'))
  async createService(@Body() dto: CreateServiceDto, @UploadedFile() image: Express.Multer.File) {
    return this.servicesService.createService(dto, image);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  @UseInterceptors(FileInterceptor('image'))
  async updateService(
    @Body() dto: UpdateServiceDto,
    @UploadedFile() image: Express.Multer.File,
    @Param('id') id: number,
  ) {
    return this.servicesService.updateService(id, dto, image);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async deleteService(@Param('id') id: number) {
    return this.servicesService.deleteService(id);
  }
}
