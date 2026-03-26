import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LeadStatus, LeadSource, ContactStatus } from '../../shared/enums';
import { generateId } from '../../shared/utils';

@Schema({ timestamps: true })
export class Lead extends Document {
  @Prop({ type: String, default: () => generateId(), unique: true })
  id: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  company?: string;

  @Prop({ type: String, enum: Object.values(LeadStatus), default: LeadStatus.NEW })
  status: LeadStatus;

  @Prop({ type: String, enum: Object.values(ContactStatus), default: ContactStatus.NEW_REQUEST })
  contactStatus: ContactStatus;

  @Prop({ type: String, enum: Object.values(LeadSource), default: LeadSource.WEBSITE })
  source: LeadSource;

  @Prop()
  assignedTo?: string;

  @Prop()
  assignedAt?: Date;

  @Prop()
  assignmentStrategy?: string;

  @Prop()
  assignmentReason?: string;

  @Prop({ type: Number, default: 0 })
  reassignedCount: number;

  @Prop()
  firstResponseDueAt?: Date;

  @Prop()
  firstResponseAt?: Date;

  @Prop({ type: Boolean, default: false })
  isOverdueForFirstResponse: boolean;

  @Prop()
  description?: string;

  @Prop({ type: Number, default: 0 })
  value?: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // === CONTACT TRACKING ===
  @Prop({ type: Number, default: 0 })
  callAttempts: number;

  @Prop({ type: Number, default: 0 })
  smsAttempts: number;

  @Prop({ type: Number, default: 0 })
  emailAttempts: number;

  @Prop()
  lastContactAt?: Date;

  @Prop()
  nextFollowUpAt?: Date;

  // Escalation: 0=new, 1=1st attempt, 2=2nd attempt, 3=SMS sent, 4=cold/unreachable
  @Prop({ type: Number, default: 0, index: true })
  escalationLevel: number;

  @Prop()
  lastSmsDeliveredAt?: Date;

  @Prop()
  lastEmailDeliveredAt?: Date;

  // === CONVERSION ===
  @Prop()
  convertedToCustomerId?: string;

  @Prop()
  convertedAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy?: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

LeadSchema.index({ status: 1 });
LeadSchema.index({ contactStatus: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ isOverdueForFirstResponse: 1, firstResponseDueAt: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ nextFollowUpAt: 1 });
