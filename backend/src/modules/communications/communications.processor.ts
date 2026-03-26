import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CommunicationsService } from './communications.service';
import { CommunicationChannel } from '../../shared/enums';

@Processor('communications')
export class CommunicationsProcessor {
  private readonly logger = new Logger(CommunicationsProcessor.name);

  constructor(private communicationsService: CommunicationsService) {}

  @Process('send')
  async handleSend(job: Job<{
    logId: string;
    channel: CommunicationChannel;
    recipient: string;
    subject: string;
    content: string;
  }>) {
    const { logId, channel, recipient, subject, content } = job.data;
    this.logger.log(`Processing ${channel} message ${logId} to ${recipient}`);

    try {
      if (channel === CommunicationChannel.EMAIL) {
        const result = await this.communicationsService.sendEmail(recipient, subject, content);
        
        if (result.success) {
          await this.communicationsService.updateStatus(logId, 'sent', result.id);
          this.logger.log(`Email sent successfully: ${logId}`);
        } else {
          await this.communicationsService.updateStatus(logId, 'failed', undefined, result.error);
          this.logger.error(`Email failed: ${logId} - ${result.error}`);
        }
      } else if (channel === CommunicationChannel.SMS) {
        // SMS integration placeholder
        // For now, mark as pending - SMS provider needs to be integrated
        this.logger.warn(`SMS sending not implemented yet for ${logId}`);
        await this.communicationsService.updateStatus(logId, 'pending', undefined, 'SMS service not configured');
      } else {
        this.logger.warn(`Unsupported channel ${channel} for ${logId}`);
        await this.communicationsService.updateStatus(logId, 'failed', undefined, `Unsupported channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Message processing error: ${error.message}`);
      await this.communicationsService.updateStatus(logId, 'failed', undefined, error.message);
      throw error;
    }
  }
}
