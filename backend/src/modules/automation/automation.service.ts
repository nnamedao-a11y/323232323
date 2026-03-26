import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { AutomationRule } from './schemas/automation-rule.schema';
import { AutomationLog } from './schemas/automation-log.schema';
import { AutomationTrigger, AutomationAction, NotificationType } from '../../shared/enums';
import { generateId, toObjectResponse, toArrayResponse } from '../../shared/utils';
import { TasksService } from '../tasks/tasks.service';
import { NotificationsService } from '../notifications/notifications.service';

interface TriggerEvent {
  trigger: AutomationTrigger;
  entityType: string;
  entityId: string;
  data: Record<string, any>;
  userId?: string;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectModel(AutomationRule.name) private ruleModel: Model<AutomationRule>,
    @InjectModel(AutomationLog.name) private logModel: Model<AutomationLog>,
    @InjectQueue('automation') private automationQueue: Queue,
    private tasksService: TasksService,
    private notificationsService: NotificationsService,
  ) {}

  // Викликається при події в системі
  async emit(event: TriggerEvent): Promise<void> {
    this.logger.log(`Automation trigger: ${event.trigger} for ${event.entityType}:${event.entityId}`);
    
    // Знаходимо активні правила для цього тригера
    const rules = await this.ruleModel.find({
      trigger: event.trigger,
      isActive: true,
    }).sort({ priority: -1 });

    for (const rule of rules) {
      // Перевіряємо умови
      if (this.checkConditions(rule.triggerConditions, event.data)) {
        if (rule.delayMinutes > 0) {
          // Відкладена дія через чергу
          await this.automationQueue.add('execute-rule', {
            ruleId: rule.id,
            event,
          }, { delay: rule.delayMinutes * 60 * 1000 });
        } else {
          // Негайне виконання
          await this.executeRule(rule, event);
        }
      }
    }
  }

  private checkConditions(conditions: Record<string, any> | undefined, data: Record<string, any>): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
        return false;
      }
    }
    return true;
  }

  async executeRule(rule: AutomationRule, event: TriggerEvent): Promise<void> {
    const log = new this.logModel({
      id: generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      trigger: event.trigger,
      entityType: event.entityType,
      entityId: event.entityId,
      actionsExecuted: [],
      status: 'running',
      executedAt: new Date(),
    });

    try {
      for (const actionDef of rule.actions) {
        const actionResult = await this.executeAction(actionDef.action, actionDef.params, event);
        log.actionsExecuted.push({
          action: actionDef.action,
          status: actionResult.success ? 'success' : 'failed',
          result: actionResult.data,
          error: actionResult.error,
        });
      }

      log.status = 'completed';
      
      // Оновлюємо лічильник правила
      await this.ruleModel.findOneAndUpdate(
        { id: rule.id },
        { $inc: { executionCount: 1 }, $set: { lastExecutedAt: new Date() } }
      );
    } catch (error) {
      log.status = 'failed';
      log.error = error.message;
      this.logger.error(`Automation rule ${rule.id} failed: ${error.message}`);
    }

    await log.save();
  }

  private async executeAction(
    action: AutomationAction,
    params: Record<string, any>,
    event: TriggerEvent
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      switch (action) {
        case AutomationAction.CREATE_TASK:
          const task = await this.tasksService.create({
            title: this.interpolate(params.title, event.data),
            description: this.interpolate(params.description, event.data),
            priority: params.priority || 'medium',
            dueDate: params.dueDateMinutes 
              ? new Date(Date.now() + params.dueDateMinutes * 60 * 1000)
              : undefined,
            assignedTo: params.assignTo === 'lead_owner' 
              ? event.data.assignedTo 
              : params.assignTo,
            relatedEntityType: event.entityType,
            relatedEntityId: event.entityId,
          }, event.userId || 'system');
          return { success: true, data: { taskId: task.id } };

        case AutomationAction.SEND_NOTIFICATION:
          await this.notificationsService.create({
            userId: params.userId || event.data.assignedTo || event.userId,
            type: params.notificationType || NotificationType.SYSTEM,
            title: this.interpolate(params.title, event.data),
            message: this.interpolate(params.message, event.data),
            entityType: event.entityType,
            entityId: event.entityId,
          });
          return { success: true };

        case AutomationAction.ESCALATE_TO_ADMIN:
          // Знаходимо всіх адмінів і відправляємо нотифікацію
          // Тут має бути логіка отримання адмінів
          this.logger.warn(`Escalation triggered for ${event.entityType}:${event.entityId}`);
          return { success: true, data: { escalated: true } };

        case AutomationAction.SCHEDULE_CALLBACK:
          const callbackTask = await this.tasksService.create({
            title: `Callback: ${event.data.firstName || ''} ${event.data.lastName || ''}`,
            description: `Зателефонувати клієнту. Телефон: ${event.data.phone || 'не вказано'}`,
            priority: 'high',
            dueDate: new Date(Date.now() + (params.delayMinutes || 10) * 60 * 1000),
            assignedTo: event.data.assignedTo,
            relatedEntityType: event.entityType,
            relatedEntityId: event.entityId,
            isReminder: true,
          }, event.userId || 'system');
          return { success: true, data: { taskId: callbackTask.id } };

        case AutomationAction.SCHEDULE_FOLLOW_UP:
          const followUpTask = await this.tasksService.create({
            title: `Follow-up: ${event.data.firstName || ''} ${event.data.lastName || ''}`,
            description: params.message || 'Повторний контакт з клієнтом',
            priority: 'medium',
            dueDate: new Date(Date.now() + (params.delayMinutes || 2880) * 60 * 1000), // 2 дні за замовч.
            assignedTo: event.data.assignedTo,
            relatedEntityType: event.entityType,
            relatedEntityId: event.entityId,
          }, event.userId || 'system');
          return { success: true, data: { taskId: followUpTask.id } };

        default:
          this.logger.warn(`Unknown action: ${action}`);
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private interpolate(template: string, data: Record<string, any>): string {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }

  // CRUD для правил автоматизації
  async createRule(data: Partial<AutomationRule>): Promise<any> {
    const rule = new this.ruleModel({ id: generateId(), ...data });
    return toObjectResponse(await rule.save());
  }

  async findAllRules(): Promise<any[]> {
    const rules = await this.ruleModel.find().sort({ priority: -1 });
    return toArrayResponse(rules);
  }

  async updateRule(id: string, data: Partial<AutomationRule>): Promise<any> {
    const rule = await this.ruleModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    );
    return rule ? toObjectResponse(rule) : null;
  }

  async deleteRule(id: string): Promise<boolean> {
    const result = await this.ruleModel.findOneAndDelete({ id });
    return !!result;
  }

  async findLogs(query: { ruleId?: string; entityType?: string; entityId?: string; limit?: number }): Promise<any[]> {
    const filter: any = {};
    if (query.ruleId) filter.ruleId = query.ruleId;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;

    const logs = await this.logModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit || 100);
    return toArrayResponse(logs);
  }

  // Дефолтні правила автоматизації
  async bootstrapDefaultRules(): Promise<void> {
    const existingRules = await this.ruleModel.countDocuments();
    if (existingRules > 0) return;

    const defaultRules = [
      {
        name: 'Новий лід - створити задачу на дзвінок',
        description: 'Коли створюється новий лід, автоматично створюється задача зателефонувати протягом 10 хвилин',
        trigger: AutomationTrigger.LEAD_CREATED,
        actions: [
          {
            action: AutomationAction.SCHEDULE_CALLBACK,
            params: { delayMinutes: 10 }
          },
          {
            action: AutomationAction.SEND_NOTIFICATION,
            params: {
              notificationType: NotificationType.NEW_LEAD,
              title: 'Новий лід',
              message: 'Новий лід: {{firstName}} {{lastName}}. Зателефонуйте протягом 10 хвилин.'
            }
          }
        ],
        isActive: true,
        priority: 100,
      },
      {
        name: 'Прострочена задача - ескалація',
        description: 'Якщо задача прострочена, ескалювати адміну',
        trigger: AutomationTrigger.TASK_OVERDUE,
        actions: [
          {
            action: AutomationAction.ESCALATE_TO_ADMIN,
            params: {}
          },
          {
            action: AutomationAction.SEND_NOTIFICATION,
            params: {
              notificationType: NotificationType.TASK_OVERDUE,
              title: 'Прострочена задача',
              message: 'Задача "{{title}}" прострочена!'
            }
          }
        ],
        isActive: true,
        priority: 90,
      },
      {
        name: 'Пропущений дзвінок - follow-up через 2 години',
        description: 'Якщо клієнт не відповів, створити follow-up задачу',
        trigger: AutomationTrigger.CALL_MISSED,
        actions: [
          {
            action: AutomationAction.SCHEDULE_FOLLOW_UP,
            params: { delayMinutes: 120, message: 'Повторний дзвінок - клієнт не відповів раніше' }
          }
        ],
        isActive: true,
        priority: 80,
      },
      {
        name: 'Депозит отримано - повідомлення',
        description: 'Коли отримано депозит, повідомити менеджера',
        trigger: AutomationTrigger.DEPOSIT_RECEIVED,
        actions: [
          {
            action: AutomationAction.SEND_NOTIFICATION,
            params: {
              notificationType: NotificationType.DEPOSIT_RECEIVED,
              title: 'Депозит отримано',
              message: 'Клієнт вніс депозит: ${{amount}}'
            }
          }
        ],
        isActive: true,
        priority: 95,
      },
    ];

    for (const rule of defaultRules) {
      await this.createRule(rule);
    }

    this.logger.log(`Created ${defaultRules.length} default automation rules`);
  }
}
