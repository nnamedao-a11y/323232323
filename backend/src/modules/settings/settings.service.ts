import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from './setting.schema';
import { toObjectResponse, generateId } from '../../shared/utils';
import { LeadStatus, DealStatus, DepositStatus, LeadSource } from '../../shared/enums';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(@InjectModel(Setting.name) private settingModel: Model<Setting>) {}

  async onModuleInit() {
    await this.bootstrapSettings();
  }

  async bootstrapSettings(): Promise<void> {
    const defaults = [
      { key: 'lead_statuses', value: Object.values(LeadStatus), description: 'Lead pipeline statuses' },
      { key: 'deal_statuses', value: Object.values(DealStatus), description: 'Deal pipeline statuses' },
      { key: 'deposit_statuses', value: Object.values(DepositStatus), description: 'Deposit lifecycle statuses' },
      { key: 'lead_sources', value: Object.values(LeadSource), description: 'Lead sources' },
    ];

    for (const setting of defaults) {
      const exists = await this.settingModel.findOne({ key: setting.key });
      if (!exists) {
        await this.settingModel.create({ id: generateId(), ...setting });
      }
    }
  }

  async findAll(): Promise<any[]> {
    const settings = await this.settingModel.find();
    return settings.map(s => toObjectResponse(s));
  }

  async findByKey(key: string): Promise<any> {
    const setting = await this.settingModel.findOne({ key });
    return setting ? toObjectResponse(setting) : null;
  }

  async update(key: string, value: any): Promise<any> {
    const setting = await this.settingModel.findOneAndUpdate(
      { key },
      { $set: { value } },
      { new: true, upsert: true },
    );
    return toObjectResponse(setting);
  }
}
