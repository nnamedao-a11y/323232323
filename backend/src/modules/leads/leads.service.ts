import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead } from './lead.schema';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './dto/lead.dto';
import { toObjectResponse, toArrayResponse, generateId } from '../../shared/utils';
import { LeadStatus, AutomationTrigger, ContactStatus } from '../../shared/enums';
import { LEAD_STATUS_TRANSITIONS } from '../../shared/constants/permissions';
import { PaginatedResult } from '../../shared/dto/pagination.dto';
import { AutomationService } from '../automation/automation.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @Inject(forwardRef(() => AutomationService)) private automationService: AutomationService,
  ) {}

  async create(createLeadDto: CreateLeadDto, userId: string): Promise<any> {
    const lead = new this.leadModel({
      id: generateId(),
      ...createLeadDto,
      contactStatus: ContactStatus.NEW_REQUEST,
      createdBy: userId,
    });
    const saved = await lead.save();
    const result = toObjectResponse(saved);

    // Тригеримо автоматизацію
    await this.automationService.emit({
      trigger: AutomationTrigger.LEAD_CREATED,
      entityType: 'lead',
      entityId: result.id,
      data: result,
      userId,
    });

    return result;
  }

  async findAll(query: LeadQueryDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, status, source, assignedTo } = query;

    const filter: any = { isDeleted: false };
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.leadModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.leadModel.countDocuments(filter),
    ]);

    return {
      data: toArrayResponse(leads),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<any> {
    const lead = await this.leadModel.findOne({ id, isDeleted: false });
    return lead ? toObjectResponse(lead) : null;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, userId: string): Promise<any> {
    // Validate status transition
    if (updateLeadDto.status) {
      const current = await this.leadModel.findOne({ id, isDeleted: false });
      if (current) {
        const allowedTransitions = LEAD_STATUS_TRANSITIONS[current.status] || [];
        if (!allowedTransitions.includes(updateLeadDto.status)) {
          throw new BadRequestException(`Cannot transition from ${current.status} to ${updateLeadDto.status}`);
        }
      }
    }

    const lead = await this.leadModel.findOneAndUpdate(
      { id, isDeleted: false },
      { $set: { ...updateLeadDto, updatedBy: userId } },
      { new: true },
    );
    return lead ? toObjectResponse(lead) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.leadModel.findOneAndUpdate(
      { id },
      { $set: { isDeleted: true } },
    );
    return !!result;
  }

  async assign(id: string, assignedTo: string, userId: string): Promise<any> {
    const lead = await this.leadModel.findOneAndUpdate(
      { id, isDeleted: false },
      { $set: { assignedTo, updatedBy: userId } },
      { new: true },
    );
    
    if (lead) {
      const result = toObjectResponse(lead);
      // Тригеримо автоматизацію
      await this.automationService.emit({
        trigger: AutomationTrigger.LEAD_ASSIGNED,
        entityType: 'lead',
        entityId: result.id,
        data: result,
        userId,
      });
      return result;
    }
    return null;
  }

  async convertToCustomer(id: string, customerId: string): Promise<any> {
    const lead = await this.leadModel.findOneAndUpdate(
      { id, isDeleted: false },
      { 
        $set: { 
          status: LeadStatus.WON, 
          convertedToCustomerId: customerId, 
          convertedAt: new Date() 
        } 
      },
      { new: true },
    );
    return lead ? toObjectResponse(lead) : null;
  }

  async getStats(): Promise<any> {
    const [byStatus, bySource, total] = await Promise.all([
      this.leadModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.leadModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      this.leadModel.countDocuments({ isDeleted: false }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
      bySource: bySource.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
    };
  }

  async findDuplicates(email: string): Promise<any[]> {
    const leads = await this.leadModel.find({ email, isDeleted: false });
    return toArrayResponse(leads);
  }
}
