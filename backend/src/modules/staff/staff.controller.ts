import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR)
  async findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN)
  async getStats() {
    return this.usersService.countByRole();
  }
}
