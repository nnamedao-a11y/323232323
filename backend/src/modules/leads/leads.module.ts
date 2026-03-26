import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead, LeadSchema } from './lead.schema';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    forwardRef(() => AutomationModule),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService, MongooseModule],
})
export class LeadsModule {}
