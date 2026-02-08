import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma.service';
import { UpdateContactsDto } from './dto/update-contacts.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async getContacts() {
    return this.prisma.contact.findFirst();
  }

  async updateContacts(dto: UpdateContactsDto) {
    return this.prisma.contact.update({
      where: { id: 1 },
      data: dto,
    });
  }
}
