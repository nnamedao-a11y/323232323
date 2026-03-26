import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums';

@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  async create(@Body() data: any, @Request() req) {
    return this.dealsService.create(data, req.user.id);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.dealsService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN, UserRole.FINANCE)
  async getStats() {
    return this.dealsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dealsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.dealsService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.dealsService.delete(id);
  }
}
