import {
  Body,
  Controller,
  Get,
  Headers,
  Query,
  UploadedFile,
  Post,
  UseGuards,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Post('create')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  @UseInterceptors(FileInterceptor('image'))
  async createArticle(@Body() dto: CreateArticleDto, @UploadedFile() image: Express.Multer.File) {
    return this.articlesService.createArticle(dto, image);
  }

  @Post('update/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  async updateArticle(
    @Body() dto: UpdateArticleDto,
    @UploadedFile() image: Express.Multer.File,
    @Param('id') id: number,
  ) {
    return this.articlesService.updateArticle(id, dto, image);
  }
}
