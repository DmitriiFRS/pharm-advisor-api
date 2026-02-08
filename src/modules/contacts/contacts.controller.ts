import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { UpdateContactsDto } from './dto/update-contacts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  getContacts() {
    return this.contactsService.getContacts();
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @AdminOnly()
  updateContacts(@Body() dto: UpdateContactsDto) {
    return this.contactsService.updateContacts(dto);
  }
}
