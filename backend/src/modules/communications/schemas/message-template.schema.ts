import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CommunicationChannel } from '../../../shared/enums';
import { generateId } from '../../../shared/utils';

@Schema({ timestamps: true })
export class MessageTemplate extends Document {
  @Prop({ type: String, default: () => generateId(), unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: Object.values(CommunicationChannel), required: true })
  channel: CommunicationChannel;

  @Prop({ required: true })
  subject: string; // For email

  @Prop({ required: true })
  content: string; // Template content with {{placeholders}}

  @Prop({ type: [String], default: [] })
  variables: string[]; // Available variables like firstName, lastName, etc.

  @Prop({ type: String, enum: ['new_lead', 'task_reminder', 'follow_up', 'deposit_alert', 'welcome', 'custom'], required: true })
  type: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdBy: string;
}

export const MessageTemplateSchema = SchemaFactory.createForClass(MessageTemplate);
MessageTemplateSchema.index({ type: 1, channel: 1, isActive: 1 });
