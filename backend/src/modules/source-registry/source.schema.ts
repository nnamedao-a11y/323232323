/**
 * Source Schema
 * 
 * MongoDB модель для VIN джерел (провайдерів)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SourceDocument = Source & Document;

@Schema({ timestamps: true, collection: 'sources' })
export class Source {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: 'provider' })
  type: string; // 'database', 'aggregator', 'competitor', 'web_search'

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: 0.5, min: 0, max: 1 })
  weight: number;

  @Prop({ default: 10 })
  priority: number; // Lower = higher priority

  @Prop({ default: 0 })
  successCount: number;

  @Prop({ default: 0 })
  failCount: number;

  @Prop({ default: null })
  lastSuccessAt?: Date;

  @Prop({ default: null })
  lastFailAt?: Date;

  @Prop({ default: 0 })
  avgResponseTime: number;

  @Prop({ default: '' })
  baseUrl?: string;

  @Prop({ default: '' })
  description?: string;
}

export const SourceSchema = SchemaFactory.createForClass(Source);

// Index for fast lookups
SourceSchema.index({ enabled: 1, priority: 1 });
