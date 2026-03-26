import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { generateId } from '../../shared/utils';

const DealStatusValues = ['draft', 'pending', 'in_progress', 'awaiting_payment', 'paid', 'completed', 'cancelled'];

@Schema({ timestamps: true })
export class Deal extends Document {
  @Prop({ type: String, default: () => generateId(), unique: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ type: String, enum: DealStatusValues, default: 'draft' })
  status: string;

  @Prop({ type: Number, default: 0 })
  value: number;

  @Prop({ type: Number, default: 0 })
  commission: number;

  @Prop()
  assignedTo?: string;

  @Prop()
  description?: string;

  @Prop()
  deadline?: Date;

  @Prop()
  vehiclePlaceholder?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdBy: string;
}

export const DealSchema = SchemaFactory.createForClass(Deal);

DealSchema.index({ customerId: 1 });
DealSchema.index({ status: 1 });
DealSchema.index({ assignedTo: 1 });
