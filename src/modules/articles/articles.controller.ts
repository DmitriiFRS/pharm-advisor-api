import {
  Body,
  Controller,
  Get,
  Headers,
  Query,
  Post,
  UseGuards,
  Param,
  UseInterceptors,
  Patch,
  Delete,
  UploadedFiles,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async getArticles(@Headers() headers: Record<string, string>, @Query() query: PaginationDto) {
    const locale = headers['accept-language'] || 'ru';
    return this.articlesService.getTranslatedArticles({ locale, paginationDto: query });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async getAdminArticles(@Query() query: PaginationDto) {
    return this.articlesService.getArticles(query);
  }

  @Get('getById/:id')
  async getArticleById(@Headers() headers: Record<string, string>, @Param('id') id: number) {
    const locale = headers['accept-language'] || 'ru';
    return this.articlesService.getArticleById(id, locale);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
    ]),
  )
  async createArticle(
    @Body() dto: CreateArticleDto,
    @UploadedFiles() files: { image?: Express.Multer.File[]; pdf?: Express.Multer.File[] },
  ) {
    return this.articlesService.createArticle(dto, files);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
    ]),
  )
  async updateArticle(
    @Body() dto: UpdateArticleDto,
    @UploadedFiles() files: { image?: Express.Multer.File[]; pdf?: Express.Multer.File[] },
    @Param('id') id: number,
  ) {
    return this.articlesService.updateArticle(id, dto, files);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async deleteArticle(@Param('id') id: number) {
    return this.articlesService.deleteArticle(id);
  }
}
