import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(@Body() data: any, @Request() req) {
    return this.customersService.create(data, req.user.id);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.customersService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async getStats() {
    return this.customersService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.customersService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.customersService.delete(id);
  }
}
