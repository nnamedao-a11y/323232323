/**
 * Source Registry Service
 * 
 * Керування джерелами VIN пошуку
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Source, SourceDocument } from './source.schema';

// Default sources to seed
const DEFAULT_SOURCES = [
  {
    name: 'local_db',
    displayName: 'Локальна база',
    type: 'database',
    weight: 1.0,
    priority: 1,
    description: 'Пошук у власній базі vehicles',
  },
  {
    name: 'bidfax',
    displayName: 'BidFax',
    type: 'aggregator',
    weight: 0.80,
    priority: 10,
    baseUrl: 'https://bidfax.info',
    description: 'Агрегатор аукціонних даних',
  },
  {
    name: 'poctra',
    displayName: 'Poctra',
    type: 'aggregator',
    weight: 0.75,
    priority: 11,
    baseUrl: 'https://poctra.com',
    description: 'Історія аукціонів',
  },
  {
    name: 'stat_vin',
    displayName: 'Stat.VIN',
    type: 'aggregator',
    weight: 0.80,
    priority: 12,
    baseUrl: 'https://stat.vin',
    description: 'VIN статистика',
  },
  {
    name: 'autobidmaster',
    displayName: 'AutoBidMaster',
    type: 'competitor',
    weight: 0.70,
    priority: 20,
    baseUrl: 'https://autobidmaster.com',
    description: 'Конкурентний сервіс',
  },
  {
    name: 'salvagebid',
    displayName: 'SalvageBid',
    type: 'competitor',
    weight: 0.70,
    priority: 21,
    baseUrl: 'https://salvagebid.com',
    description: 'Конкурентний сервіс',
  },
  {
    name: 'web_search',
    displayName: 'Web Search',
    type: 'web_search',
    weight: 0.55,
    priority: 50,
    description: 'Пошук через DuckDuckGo',
  },
];

@Injectable()
export class SourceRegistryService implements OnModuleInit {
  private readonly logger = new Logger(SourceRegistryService.name);

  constructor(
    @InjectModel(Source.name)
    private sourceModel: Model<SourceDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultSources();
  }

  private async seedDefaultSources() {
    for (const source of DEFAULT_SOURCES) {
      const exists = await this.sourceModel.findOne({ name: source.name });
      if (!exists) {
        await this.sourceModel.create(source);
        this.logger.log(`Seeded source: ${source.name}`);
      }
    }
  }

  async getAll(): Promise<Source[]> {
    return this.sourceModel.find().sort({ priority: 1 }).lean();
  }

  async getEnabledSources(): Promise<Source[]> {
    return this.sourceModel.find({ enabled: true }).sort({ priority: 1 }).lean();
  }

  async getByName(name: string): Promise<Source | null> {
    return this.sourceModel.findOne({ name }).lean();
  }

  async updateWeight(name: string, weight: number): Promise<void> {
    const safeWeight = Math.max(0, Math.min(1, weight));
    await this.sourceModel.updateOne({ name }, { weight: safeWeight });
    this.logger.log(`Updated weight for ${name}: ${safeWeight}`);
  }

  async updatePriority(name: string, priority: number): Promise<void> {
    await this.sourceModel.updateOne({ name }, { priority });
    this.logger.log(`Updated priority for ${name}: ${priority}`);
  }

  async toggle(name: string, enabled: boolean): Promise<void> {
    await this.sourceModel.updateOne({ name }, { enabled });
    this.logger.log(`Toggled ${name}: ${enabled ? 'enabled' : 'disabled'}`);
  }

  async recordSuccess(name: string, responseTime: number): Promise<void> {
    const source = await this.sourceModel.findOne({ name });
    if (!source) return;

    // Calculate new average response time
    const newAvg = source.successCount > 0
      ? (source.avgResponseTime * source.successCount + responseTime) / (source.successCount + 1)
      : responseTime;

    await this.sourceModel.updateOne(
      { name },
      {
        $inc: { successCount: 1 },
        $set: {
          lastSuccessAt: new Date(),
          avgResponseTime: Math.round(newAvg),
        },
      },
    );
  }

  async recordFail(name: string): Promise<void> {
    await this.sourceModel.updateOne(
      { name },
      {
        $inc: { failCount: 1 },
        $set: {
          lastFailAt: new Date(),
        },
      },
    );
  }

  async getStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
  }> {
    const all = await this.sourceModel.find().lean();
    const enabled = all.filter(s => s.enabled);
    const byType = all.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: all.length,
      enabled: enabled.length,
      disabled: all.length - enabled.length,
      byType,
    };
  }

  async resetStats(name: string): Promise<void> {
    await this.sourceModel.updateOne(
      { name },
      {
        successCount: 0,
        failCount: 0,
        avgResponseTime: 0,
        lastSuccessAt: null,
        lastFailAt: null,
      },
    );
    this.logger.log(`Reset stats for ${name}`);
  }
}
