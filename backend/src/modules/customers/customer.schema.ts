import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CustomerType } from '../../shared/enums';
import { generateId } from '../../shared/utils';

@Schema({ timestamps: true })
export class Customer extends Document {
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

  @Prop({ type: String, enum: CustomerType, default: CustomerType.INDIVIDUAL })
  type: CustomerType;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  country?: string;

  @Prop()
  assignedTo?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  leadId?: string;

  @Prop({ type: Number, default: 0 })
  totalDeals: number;

  @Prop({ type: Number, default: 0 })
  totalValue: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdBy: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ email: 1 });
CustomerSchema.index({ assignedTo: 1 });
CustomerSchema.index({ type: 1 });
