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

  @Prop({ required: true })
  email: string;

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
  description?: string;

  @Prop({ type: Number, default: 0 })
  value?: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Number, default: 0 })
  callAttempts: number;

  @Prop()
  lastContactAt?: Date;

  @Prop()
  nextFollowUpAt?: Date;

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
LeadSchema.index({ email: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ nextFollowUpAt: 1 });
