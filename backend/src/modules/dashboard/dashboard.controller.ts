import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadsService } from '../leads/leads.service';
import { CustomersService } from '../customers/customers.service';
import { DealsService } from '../deals/deals.service';
import { DepositsService } from '../deposits/deposits.service';
import { TasksService } from '../tasks/tasks.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private leadsService: LeadsService,
    private customersService: CustomersService,
    private dealsService: DealsService,
    private depositsService: DepositsService,
    private tasksService: TasksService,
  ) {}

  @Get()
  async getDashboard(@Request() req) {
    const [leads, customers, deals, deposits, tasks] = await Promise.all([
      this.leadsService.getStats(),
      this.customersService.getStats(),
      this.dealsService.getStats(),
      this.depositsService.getStats(),
      this.tasksService.getStats(req.user.id),
    ]);

    return {
      leads,
      customers,
      deals,
      deposits,
      tasks,
    };
  }

  @Get('kpi')
  async getKpi() {
    const [leads, deals, deposits] = await Promise.all([
      this.leadsService.getStats(),
      this.dealsService.getStats(),
      this.depositsService.getStats(),
    ]);

    const conversionRate = leads.total > 0 
      ? Math.round((leads.byStatus?.won || 0) / leads.total * 100) 
      : 0;

    return {
      totalLeads: leads.total,
      totalDeals: deals.total,
      totalDealsValue: deals.totalValue,
      totalDeposits: deposits.total,
      totalDepositsAmount: deposits.totalAmount,
      conversionRate,
    };
  }
}
