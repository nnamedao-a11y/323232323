import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, CommunicationChannel } from '../../shared/enums';

@Controller('communications')
@UseGuards(JwtAuthGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  // Надіслати повідомлення
  @Post('send')
  async sendMessage(@Body() data: {
    channel: CommunicationChannel;
    recipientId: string;
    recipientEmail?: string;
    recipientPhone?: string;
    templateId?: string;
    subject?: string;
    content?: string;
    variables?: Record<string, any>;
  }, @Request() req) {
    return this.communicationsService.sendMessage({
      ...data,
      sentBy: req.user.id,
    });
  }

  // Історія комунікацій по ліду/клієнту
  @Get('history/:recipientId')
  async getHistory(
    @Param('recipientId') recipientId: string,
    @Query('channel') channel?: CommunicationChannel
  ) {
    return this.communicationsService.getHistory(recipientId, channel);
  }

  // Шаблони
  @Post('templates')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async createTemplate(@Body() data: any, @Request() req) {
    return this.communicationsService.createTemplate({
      ...data,
      createdBy: req.user.id,
    });
  }

  @Get('templates')
  async findAllTemplates(@Query('channel') channel?: CommunicationChannel) {
    return this.communicationsService.findAllTemplates(channel);
  }

  @Put('templates/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.communicationsService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async deleteTemplate(@Param('id') id: string) {
    return this.communicationsService.deleteTemplate(id);
  }
}
