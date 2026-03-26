import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { LeadsModule } from '../leads/leads.module';
import { CustomersModule } from '../customers/customers.module';
import { DealsModule } from '../deals/deals.module';
import { DepositsModule } from '../deposits/deposits.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [LeadsModule, CustomersModule, DealsModule, DepositsModule, TasksModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
