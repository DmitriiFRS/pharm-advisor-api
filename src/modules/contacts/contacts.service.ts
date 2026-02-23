import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { UpdateContactsDto } from './dto/update-contacts.dto';
import { TranslationService } from '../translations/translations.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
  ) {}

  async getTranslatedContacts(locale: string) {
    const contact = await this.prisma.contact.findFirst({
      include: {
        translations: true,
      },
    });
    if (!contact) {
      throw new NotFoundException('Контакты не найдены');
    }
    const data = this.translationService.translateDeep(contact, locale);
    return { ...data, translations: contact.translations };
  }

  async updateContacts(dto: UpdateContactsDto) {
    return await this.prisma.$transaction(async (tx) => {
      const contact = await tx.contact.findFirst();
      if (!contact) {
        throw new NotFoundException('Контакты не найдены');
      }
      const updatedContact = await tx.contact.update({
        where: { id: contact.id },
        data: {
          email: dto.email,
          address: dto.addressRu,
          phone: dto.phone,
          telegramLink: dto.telegramLink,
          googleMapsLink: dto.googleMapsLink,
          instagramLink: dto.instagramLink,
        },
      });
      if (dto.addressRu) {
        await this.upsertTranslations(tx, updatedContact.id, 'ru', dto.addressRu);
      }
      if (dto.addressUz) {
        await this.upsertTranslations(tx, updatedContact.id, 'uz', dto.addressUz);
      }
      return updatedContact;
    });
  }

  private async upsertTranslations(tx: Prisma.TransactionClient, contactId: number, locale: string, address: string) {
    const existing = await tx.contactTranslation.findFirst({
      where: { contactId, locale },
    });
    if (existing) {
      await tx.contactTranslation.update({
        where: { id: existing.id },
        data: { address },
      });
    } else {
      await tx.contactTranslation.create({
        data: { contactId, locale, address },
      });
    }
  }
}
