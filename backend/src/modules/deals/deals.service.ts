import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deal } from './deal.schema';
import { toObjectResponse, toArrayResponse, generateId } from '../../shared/utils';
import { DEAL_STATUS_TRANSITIONS } from '../../shared/constants/permissions';
import { PaginatedResult } from '../../shared/dto/pagination.dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectModel(Deal.name) private dealModel: Model<Deal>,
  ) {}

  async create(data: any, userId: string): Promise<any> {
    const deal = new this.dealModel({
      id: generateId(),
      ...data,
      createdBy: userId,
    });
    const saved = await deal.save();
    return toObjectResponse(saved);
  }

  async findAll(query: any): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, customerId, assignedTo, search } = query;

    const filter: any = { isDeleted: false };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const [deals, total] = await Promise.all([
      this.dealModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.dealModel.countDocuments(filter),
    ]);

    return {
      data: toArrayResponse(deals),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<any> {
    const deal = await this.dealModel.findOne({ id, isDeleted: false });
    return deal ? toObjectResponse(deal) : null;
  }

  async update(id: string, data: any): Promise<any> {
    if (data.status) {
      const current = await this.dealModel.findOne({ id, isDeleted: false });
      if (current) {
        const allowed: string[] = DEAL_STATUS_TRANSITIONS[current.status as keyof typeof DEAL_STATUS_TRANSITIONS] || [];
        if (!allowed.includes(data.status)) {
          throw new BadRequestException(`Cannot transition from ${current.status} to ${data.status}`);
        }
      }
    }

    const deal = await this.dealModel.findOneAndUpdate(
      { id, isDeleted: false },
      { $set: data },
      { new: true },
    );
    return deal ? toObjectResponse(deal) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.dealModel.findOneAndUpdate({ id }, { $set: { isDeleted: true } });
    return !!result;
  }

  async getStats(): Promise<any> {
    const [total, byStatus, totalValue] = await Promise.all([
      this.dealModel.countDocuments({ isDeleted: false }),
      this.dealModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$value' } } },
      ]),
      this.dealModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
    ]);

    return {
      total,
      totalValue: totalValue[0]?.total || 0,
      byStatus: byStatus.reduce((acc, { _id, count, value }) => ({ ...acc, [_id]: { count, value } }), {}),
    };
  }
}
