import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { TranslationService } from '../translations/translations.service';
import { PaginationService } from 'src/common/service/pagination.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { Media, Prisma } from '@prisma/client';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
    private readonly paginationService: PaginationService,
    private readonly uploadService: UploadsService,
  ) {}

  async getAllServices(locale: string) {
    const services = await this.prisma.service.findMany({
      include: { translations: true, media: true },
      orderBy: { order: 'desc' },
    });

    return this.translationService.translateDeep(services, locale);
  }

  async getServices({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    return this.paginationService.getPaginatedItems({
      modelName: 'Service',
      page,
      limit,
      params: {
        orderBy: { order: 'desc' },
        include: { translations: true, media: true },
      },
    });
  }

  async getTranslatedServices({ locale, paginationDto }: { locale: string; paginationDto: PaginationDto }) {
    const { page = 1, limit = 10 } = paginationDto;
    const { data, meta } = await this.getServices({ page, limit });
    return {
      data: this.translationService.translateDeep(data, locale),
      meta,
    };
  }

  async getServiceById(id: number, locale: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { translations: true, media: true },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    const data = this.translationService.translateDeep(service, locale);
    return { ...data, translations: service.translations };
  }

  async createService(dto: CreateServiceDto, image?: Express.Multer.File) {
    const {
      descriptionRu,
      descriptionUz,
      labelRu,
      labelUz,
      nameRu,
      nameUz,
      price,
      serviceFeaturesRu,
      serviceFeaturesUz,
      order,
    } = dto;
    return await this.prisma.$transaction(async (tx) => {
      let uploadedImage: Media | null = null;
      if (image) {
        uploadedImage = await this.uploadService.processAndUploadFile(image, tx);
      }
      const service = await tx.service.create({
        data: {
          price,
          name: nameRu,
          description: descriptionRu,
          label: labelRu,
          serviceFeatures: serviceFeaturesRu,
          imageId: uploadedImage?.id || null,
          order,
        },
      });
      const translations: Prisma.ServiceTranslationUncheckedCreateInput[] = [];

      translations.push({
        serviceId: service.id,
        locale: 'ru',
        name: nameRu,
        description: descriptionRu,
        label: labelRu,
        serviceFeatures: serviceFeaturesRu,
      });
      translations.push({
        serviceId: service.id,
        locale: 'uz',
        name: nameUz,
        description: descriptionUz,
        label: labelUz,
        serviceFeatures: serviceFeaturesUz,
      });
      if (translations.length > 0) {
        await tx.serviceTranslation.createMany({
          data: translations,
        });
      }
      return service;
    });
  }

  async updateService(id: number, dto: UpdateServiceDto, image: Express.Multer.File) {
    const {
      descriptionRu,
      descriptionUz,
      labelRu,
      labelUz,
      nameRu,
      nameUz,
      price,
      serviceFeaturesRu,
      serviceFeaturesUz,
      imageId,
      order,
    } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const currentService = await tx.service.findUnique({ where: { id } });
      if (!currentService) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }
      const updatedData: any = {};

      if (price !== undefined) {
        updatedData.price = price;
      }
      if (nameRu) updatedData.name = nameRu;
      if (descriptionRu) updatedData.description = descriptionRu;
      if (labelRu) updatedData.label = labelRu;
      if (serviceFeaturesRu) updatedData.serviceFeatures = serviceFeaturesRu;
      if (order) updatedData.order = order;
      if (imageId) {
        if (currentService.imageId !== imageId) throw new BadRequestException('Неверный ID изображения');
        const file = await tx.media.findUnique({ where: { id: imageId } });
        if (!file) throw new BadRequestException('Неверный ID изображения');
        await this.uploadService.deleteFile(file.url, tx);
        updatedData.imageId = null;
      }
      if (image) {
        const uploadedImage = await this.uploadService.processAndUploadFile(image, tx);
        updatedData.imageId = uploadedImage.id;
      }

      const service = await tx.service.update({
        where: { id },
        data: updatedData,
        include: { media: true },
      });

      await this.upsertTranslation(tx, id, 'ru', nameRu, descriptionRu, labelRu, serviceFeaturesRu || []);
      await this.upsertTranslation(tx, id, 'uz', nameUz, descriptionUz, labelUz, serviceFeaturesUz || []);
      return service;
    });
  }

  async deleteService(id: number) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return this.prisma.$transaction(async (tx) => {
      if (service.imageId) {
        const file = await tx.media.findUnique({ where: { id: service.imageId } });
        if (file) {
          await this.uploadService.deleteFile(file.url, tx);
        }
      }
      return await tx.service.delete({ where: { id } });
    });
  }

  private async upsertTranslation(
    tx: Prisma.TransactionClient,
    serviceId: number,
    locale: string,
    name: string | undefined,
    description: string | undefined,
    label: string | undefined,
    serviceFeatures: string[],
  ) {
    const existing = await tx.serviceTranslation.findUnique({
      where: {
        serviceId_locale: { serviceId, locale },
      },
    });

    if (existing) {
      await tx.serviceTranslation.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          description: description || existing.description,
          label: label || existing.label,
          serviceFeatures:
            serviceFeatures.length > 0 ? serviceFeatures : (existing.serviceFeatures as Prisma.InputJsonValue),
        },
      });
    } else {
      await tx.serviceTranslation.create({
        data: {
          serviceId,
          locale,
          name: name || '',
          description: description || '',
          label: label || '',
          serviceFeatures: serviceFeatures || [],
        },
      });
    }
  }
}
