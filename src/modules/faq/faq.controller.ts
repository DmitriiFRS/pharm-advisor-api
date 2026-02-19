import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { CreateFaqDto } from './dto/create-faq.dto';

@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  async getFaqs(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.faqService.getAllFaqs(locale);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async getAdminFaqs(@Query() query: PaginationDto) {
    return this.faqService.getFaqs(query);
  }

  @Get('getById/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async getFaqById(@Headers() headers: Record<string, string>, @Param('id') id: number) {
    const locale = headers['accept-language'] || 'ru';
    return this.faqService.getFaqById(id, locale);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async createFaq(@Body() dto: CreateFaqDto) {
    return this.faqService.createFaq(dto);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async updateFaq(@Body() dto: CreateFaqDto, @Param('id') id: number) {
    return this.faqService.updateFaq(id, dto);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async deleteFaq(@Param('id') id: number) {
    return this.faqService.deleteFaq(id);
  }
}
