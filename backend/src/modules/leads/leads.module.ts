import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead, LeadSchema } from './lead.schema';
import { AutomationModule } from '../automation/automation.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    forwardRef(() => AutomationModule),
    ActivityModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService, MongooseModule],
})
export class LeadsModule {}
