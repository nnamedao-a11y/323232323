import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { CommunicationsProcessor } from './communications.processor';
import { CommunicationLog, CommunicationLogSchema } from './schemas/communication-log.schema';
import { MessageTemplate, MessageTemplateSchema } from './schemas/message-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunicationLog.name, schema: CommunicationLogSchema },
      { name: MessageTemplate.name, schema: MessageTemplateSchema },
    ]),
    BullModule.registerQueue({ name: 'communications' }),
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, CommunicationsProcessor],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
