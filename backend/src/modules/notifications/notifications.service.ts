import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.schema';
import { toObjectResponse, toArrayResponse, generateId } from '../../shared/utils';
import { NotificationType } from '../../shared/enums';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>) {}

  async create(data: { userId: string; type: NotificationType; title: string; message?: string; entityType?: string; entityId?: string }): Promise<any> {
    const notification = new this.notificationModel({ id: generateId(), ...data });
    return toObjectResponse(await notification.save());
  }

  async findByUser(userId: string, limit = 50): Promise<any[]> {
    const notifications = await this.notificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    return toArrayResponse(notifications);
  }

  async markAsRead(id: string): Promise<any> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    );
    return notification ? toObjectResponse(notification) : null;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany({ userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ userId, isRead: false });
  }
}
