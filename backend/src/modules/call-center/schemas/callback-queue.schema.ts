import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { generateId } from '../../../shared/utils';

@Schema({ timestamps: true })
export class CallbackQueue extends Document {
  @Prop({ type: String, default: () => generateId(), unique: true })
  id: string;

  @Prop({ required: true })
  leadId: string;

  @Prop()
  customerId?: string;

  @Prop({ required: true })
  assignedTo: string;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop({ default: 0 })
  attemptNumber: number;

  @Prop({ default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed' | 'missed' | 'cancelled';

  @Prop()
  completedAt?: Date;

  @Prop()
  notes?: string;

  @Prop({ type: Number, default: 1 })
  priority: number;
}

export const CallbackQueueSchema = SchemaFactory.createForClass(CallbackQueue);
CallbackQueueSchema.index({ assignedTo: 1, status: 1, scheduledAt: 1 });
CallbackQueueSchema.index({ leadId: 1 });
