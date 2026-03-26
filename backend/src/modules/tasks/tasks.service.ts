import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './task.schema';
import { toObjectResponse, toArrayResponse, generateId } from '../../shared/utils';
import { TaskStatus } from '../../shared/enums';
import { PaginatedResult } from '../../shared/dto/pagination.dto';
import { ActivityService } from '../activity/services/activity.service';
import { ActivityAction, ActivityEntityType, ActivitySource } from '../activity/enums/activity-action.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private activityService: ActivityService,
  ) {}

  async create(data: any, userId: string, userRole?: string, userName?: string): Promise<any> {
    const task = new this.taskModel({
      id: generateId(),
      ...data,
      createdBy: userId,
    });
    const saved = await task.save();
    const result = toObjectResponse(saved);

    // Activity log
    this.activityService.logAsync({
      userId,
      userRole: userRole || 'unknown',
      userName,
      action: ActivityAction.TASK_CREATED,
      entityType: ActivityEntityType.TASK,
      entityId: result.id,
      meta: { title: data.title, assignedTo: data.assignedTo, priority: data.priority },
      context: { source: ActivitySource.WEB },
    });

    return result;
  }

  async findAll(query: any): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc', status, assignedTo, priority } = query;

    const filter: any = { isDeleted: false };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.taskModel.countDocuments(filter),
    ]);

    return {
      data: toArrayResponse(tasks),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<any> {
    const task = await this.taskModel.findOne({ id, isDeleted: false });
    return task ? toObjectResponse(task) : null;
  }

  async findByEntity(entityType: string, entityId: string): Promise<any[]> {
    const tasks = await this.taskModel.find({ relatedEntityType: entityType, relatedEntityId: entityId, isDeleted: false });
    return toArrayResponse(tasks);
  }

  async update(id: string, data: any, userId?: string, userRole?: string, userName?: string): Promise<any> {
    const updateData = { ...data };
    const isCompleting = data.status === TaskStatus.COMPLETED;
    
    if (isCompleting) {
      updateData.completedAt = new Date();
    }

    const task = await this.taskModel.findOneAndUpdate(
      { id, isDeleted: false },
      { $set: updateData },
      { new: true },
    );
    
    if (task && userId) {
      this.activityService.logAsync({
        userId,
        userRole: userRole || 'unknown',
        userName,
        action: isCompleting ? ActivityAction.TASK_COMPLETED : ActivityAction.TASK_UPDATED,
        entityType: ActivityEntityType.TASK,
        entityId: id,
        meta: isCompleting ? { title: task.title } : { fromStatus: data.status },
        context: { source: ActivitySource.WEB },
      });
    }
    
    return task ? toObjectResponse(task) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.taskModel.findOneAndUpdate({ id }, { $set: { isDeleted: true } });
    return !!result;
  }

  async getOverdue(): Promise<any[]> {
    const now = new Date();
    const tasks = await this.taskModel.find({
      isDeleted: false,
      status: { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      dueDate: { $lt: now },
    });
    return toArrayResponse(tasks);
  }

  async getStats(userId?: string): Promise<any> {
    const filter: any = { isDeleted: false };
    if (userId) filter.assignedTo = userId;

    const [total, byStatus, overdue] = await Promise.all([
      this.taskModel.countDocuments(filter),
      this.taskModel.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.taskModel.countDocuments({
        ...filter,
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        dueDate: { $lt: new Date() },
      }),
    ]);

    return {
      total,
      overdue,
      byStatus: byStatus.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
    };
  }
}
