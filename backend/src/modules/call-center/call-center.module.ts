import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { CallCenterService } from './call-center.service';
import { CallCenterController } from './call-center.controller';
import { CallbackProcessor } from './callback.processor';
import { CallLog, CallLogSchema } from './schemas/call-log.schema';
import { CallbackQueue, CallbackQueueSchema } from './schemas/callback-queue.schema';
import { Lead, LeadSchema } from '../leads/lead.schema';
import { AutomationModule } from '../automation/automation.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallLog.name, schema: CallLogSchema },
      { name: CallbackQueue.name, schema: CallbackQueueSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
    BullModule.registerQueue({ name: 'callbacks' }),
    forwardRef(() => AutomationModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [CallCenterController],
  providers: [CallCenterService, CallbackProcessor],
  exports: [CallCenterService],
})
export class CallCenterModule {}
