import { Body, Controller, Get, Headers, Patch, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { UpdateContactsDto } from './dto/update-contacts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  getContacts(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.contactsService.getTranslatedContacts(locale);
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  updateContacts(@Body() dto: UpdateContactsDto) {
    return this.contactsService.updateContacts(dto);
  }
}
