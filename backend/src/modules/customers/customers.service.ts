import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from './customer.schema';
import { toObjectResponse, toArrayResponse, generateId } from '../../shared/utils';
import { PaginatedResult } from '../../shared/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<Customer>,
  ) {}

  async create(data: any, userId: string): Promise<any> {
    const customer = new this.customerModel({
      id: generateId(),
      ...data,
      createdBy: userId,
    });
    const saved = await customer.save();
    return toObjectResponse(saved);
  }

  async findAll(query: any): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, assignedTo, type } = query;

    const filter: any = { isDeleted: false };
    if (assignedTo) filter.assignedTo = assignedTo;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(filter),
    ]);

    return {
      data: toArrayResponse(customers),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<any> {
    const customer = await this.customerModel.findOne({ id, isDeleted: false });
    return customer ? toObjectResponse(customer) : null;
  }

  async update(id: string, data: any): Promise<any> {
    const customer = await this.customerModel.findOneAndUpdate(
      { id, isDeleted: false },
      { $set: data },
      { new: true },
    );
    return customer ? toObjectResponse(customer) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.customerModel.findOneAndUpdate(
      { id },
      { $set: { isDeleted: true } },
    );
    return !!result;
  }

  async updateStats(id: string, totalDeals: number, totalValue: number): Promise<void> {
    await this.customerModel.findOneAndUpdate(
      { id },
      { $set: { totalDeals, totalValue } },
    );
  }

  async getStats(): Promise<any> {
    const [total, byType] = await Promise.all([
      this.customerModel.countDocuments({ isDeleted: false }),
      this.customerModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      byType: byType.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
    };
  }
}
