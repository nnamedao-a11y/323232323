import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deposit } from './deposit.schema';
import { toObjectResponse, toArrayResponse, generateId } from '../../shared/utils';
import { DEPOSIT_STATUS_TRANSITIONS } from '../../shared/constants/permissions';
import { DepositStatus } from '../../shared/enums';
import { PaginatedResult } from '../../shared/dto/pagination.dto';

@Injectable()
export class DepositsService {
  constructor(
    @InjectModel(Deposit.name) private depositModel: Model<Deposit>,
  ) {}

  async create(data: any, userId: string): Promise<any> {
    const deposit = new this.depositModel({
      id: generateId(),
      ...data,
      createdBy: userId,
    });
    const saved = await deposit.save();
    return toObjectResponse(saved);
  }

  async findAll(query: any): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, customerId, dealId } = query;

    const filter: any = { isDeleted: false };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (dealId) filter.dealId = dealId;

    const [deposits, total] = await Promise.all([
      this.depositModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.depositModel.countDocuments(filter),
    ]);

    return {
      data: toArrayResponse(deposits),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<any> {
    const deposit = await this.depositModel.findOne({ id, isDeleted: false });
    return deposit ? toObjectResponse(deposit) : null;
  }

  async update(id: string, data: any): Promise<any> {
    if (data.status) {
      const current = await this.depositModel.findOne({ id, isDeleted: false });
      if (current) {
        const allowed: string[] = DEPOSIT_STATUS_TRANSITIONS[current.status as keyof typeof DEPOSIT_STATUS_TRANSITIONS] || [];
        if (!allowed.includes(data.status)) {
          throw new BadRequestException(`Cannot transition from ${current.status} to ${data.status}`);
        }
      }
    }

    const deposit = await this.depositModel.findOneAndUpdate(
      { id, isDeleted: false },
      { $set: data },
      { new: true },
    );
    return deposit ? toObjectResponse(deposit) : null;
  }

  async approve(id: string, userId: string): Promise<any> {
    const deposit = await this.depositModel.findOneAndUpdate(
      { id, isDeleted: false },
      { $set: { status: DepositStatus.CONFIRMED, approvedBy: userId, approvedAt: new Date() } },
      { new: true },
    );
    return deposit ? toObjectResponse(deposit) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.depositModel.findOneAndUpdate({ id }, { $set: { isDeleted: true } });
    return !!result;
  }

  async getStats(): Promise<any> {
    const [total, byStatus, totalAmount] = await Promise.all([
      this.depositModel.countDocuments({ isDeleted: false }),
      this.depositModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      ]),
      this.depositModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      total,
      totalAmount: totalAmount[0]?.total || 0,
      byStatus: byStatus.reduce((acc, { _id, count, amount }) => ({ ...acc, [_id]: { count, amount } }), {}),
    };
  }
}
