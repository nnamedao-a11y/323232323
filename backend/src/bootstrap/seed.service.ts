import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { generateId } from '../shared/utils';
import { 
  UserRole, 
  LeadStatus, 
  LeadSource, 
  ContactStatus,
  AutomationTrigger,
  AutomationAction,
  NotificationType,
  CommunicationChannel,
} from '../shared/enums';

/**
 * Seed Service - Створення початкових даних
 * 
 * Викликається при:
 * 1. Першому запуску системи
 * 2. Cold start (після очищення БД)
 * 3. Development environment setup
 */

interface SeedResult {
  users: number;
  leads: number;
  automationRules: number;
  messageTemplates: number;
  settings: number;
}

export { SeedResult };

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Lead') private leadModel: Model<any>,
    @InjectModel('AutomationRule') private automationRuleModel: Model<any>,
    @InjectModel('MessageTemplate') private messageTemplateModel: Model<any>,
    @InjectModel('Setting') private settingsModel: Model<any>,
  ) {}

  /**
   * Запуск повного seed
   */
  async seedAll(): Promise<SeedResult> {
    this.logger.log('🌱 Starting database seed...');

    const result: SeedResult = {
      users: 0,
      leads: 0,
      automationRules: 0,
      messageTemplates: 0,
      settings: 0,
    };

    try {
      result.users = await this.seedUsers();
      result.automationRules = await this.seedAutomationRules();
      result.messageTemplates = await this.seedMessageTemplates();
      result.settings = await this.seedSettings();
      
      this.logger.log(`✅ Seed completed: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`❌ Seed failed: ${error.message}`);
      throw error;
    }

    return result;
  }

  /**
   * Seed користувачів (admin)
   */
  async seedUsers(): Promise<number> {
    const existingAdmin = await this.userModel.findOne({ email: 'admin@crm.com' });
    if (existingAdmin) {
      this.logger.log('Admin user already exists');
      return 0;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const users = [
      {
        id: generateId(),
        email: 'admin@crm.com',
        password: hashedPassword,
        firstName: 'Master',
        lastName: 'Admin',
        role: UserRole.MASTER_ADMIN,
        isActive: true,
      },
      {
        id: generateId(),
        email: 'manager@crm.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Manager',
        role: UserRole.MANAGER,
        isActive: true,
      },
    ];

    await this.userModel.insertMany(users);
    this.logger.log(`Created ${users.length} users`);
    return users.length;
  }

  /**
   * Seed правил автоматизації
   */
  async seedAutomationRules(): Promise<number> {
    const existingRules = await this.automationRuleModel.countDocuments();
    if (existingRules > 0) {
      this.logger.log(`Automation rules already exist (${existingRules})`);
      return 0;
    }

    const rules = [
      // Lead Lifecycle
      {
        id: generateId(),
        name: 'Новий лід - створити задачу на дзвінок',
        description: 'Коли створюється новий лід, автоматично створюється задача зателефонувати протягом 10 хвилин',
        trigger: AutomationTrigger.LEAD_CREATED,
        actions: [
          { action: AutomationAction.SCHEDULE_CALLBACK, params: { delayMinutes: 10 } },
          { action: AutomationAction.SEND_NOTIFICATION, params: { notificationType: NotificationType.NEW_LEAD, title: 'Новий лід', message: 'Новий лід: {{firstName}} {{lastName}}. Зателефонуйте протягом 10 хвилин.' } }
        ],
        isActive: true,
        priority: 100,
      },
      // No-Answer Workflow
      {
        id: generateId(),
        name: 'Перший no_answer - follow-up через 2 години',
        description: 'Якщо клієнт не відповів на перший дзвінок, створити follow-up задачу через 2 години',
        trigger: AutomationTrigger.CALL_MISSED,
        triggerConditions: { callAttempts: 1 },
        actions: [
          { action: AutomationAction.SCHEDULE_FOLLOW_UP, params: { delayMinutes: 120, message: 'Повторний дзвінок - клієнт не відповів (спроба 1)' } }
        ],
        isActive: true,
        priority: 85,
      },
      {
        id: generateId(),
        name: 'Другий no_answer - follow-up через 2 дні',
        description: 'Якщо клієнт не відповів вдруге, створити follow-up через 2 дні',
        trigger: AutomationTrigger.CALL_MISSED,
        triggerConditions: { callAttempts: 2 },
        actions: [
          { action: AutomationAction.SCHEDULE_FOLLOW_UP, params: { delayMinutes: 2880, message: 'Повторний дзвінок - клієнт не відповів (спроба 2)' } }
        ],
        isActive: true,
        priority: 84,
      },
      {
        id: generateId(),
        name: 'Третій no_answer - відправити SMS',
        description: 'Після 2 невдалих спроб відправити SMS клієнту',
        trigger: AutomationTrigger.CALL_MISSED,
        triggerConditions: { callAttempts: 3 },
        actions: [
          { action: AutomationAction.SEND_SMS, params: { templateType: 'no_answer', message: 'Доброго дня, {{firstName}}! Ми намагалися зв\'язатися з вами. Зателефонуйте нам: {{managerPhone}} або напишіть.' } },
          { action: AutomationAction.SCHEDULE_FOLLOW_UP, params: { delayMinutes: 4320, message: 'Фінальна спроба контакту після SMS (3 дні)' } }
        ],
        isActive: true,
        priority: 83,
      },
      {
        id: generateId(),
        name: 'Четвертий no_answer - перевести в cold/unreachable',
        description: 'Якщо клієнт не відповів після SMS, перевести в unreachable статус',
        trigger: AutomationTrigger.CALL_MISSED,
        triggerConditions: { callAttempts: 4 },
        actions: [
          { action: AutomationAction.SEND_NOTIFICATION, params: { notificationType: NotificationType.SYSTEM, title: 'Лід unreachable', message: 'Лід {{firstName}} {{lastName}} переведено в статус unreachable після 4 спроб контакту' } }
        ],
        isActive: true,
        priority: 82,
      },
      // Task Management
      {
        id: generateId(),
        name: 'Прострочена задача - ескалація',
        description: 'Якщо задача прострочена, ескалювати адміну',
        trigger: AutomationTrigger.TASK_OVERDUE,
        actions: [
          { action: AutomationAction.ESCALATE_TO_ADMIN, params: {} },
          { action: AutomationAction.SEND_NOTIFICATION, params: { notificationType: NotificationType.TASK_OVERDUE, title: 'Прострочена задача', message: 'Задача "{{title}}" прострочена!' } }
        ],
        isActive: true,
        priority: 90,
      },
      // Deposit
      {
        id: generateId(),
        name: 'Депозит отримано - повідомлення',
        description: 'Коли отримано депозит, повідомити менеджера',
        trigger: AutomationTrigger.DEPOSIT_RECEIVED,
        actions: [
          { action: AutomationAction.SEND_NOTIFICATION, params: { notificationType: NotificationType.DEPOSIT_RECEIVED, title: 'Депозит отримано', message: 'Клієнт вніс депозит: {{amount}} USD' } }
        ],
        isActive: true,
        priority: 95,
      },
      // No Response
      {
        id: generateId(),
        name: 'Немає відповіді 24 години - нагадування',
        description: 'Якщо лід не контактував 24 години, нагадати менеджеру',
        trigger: AutomationTrigger.NO_RESPONSE_24H,
        actions: [
          { action: AutomationAction.SEND_NOTIFICATION, params: { notificationType: NotificationType.SYSTEM, title: 'Нагадування', message: 'Лід {{firstName}} {{lastName}} не контактував більше 24 годин' } },
          { action: AutomationAction.SCHEDULE_CALLBACK, params: { delayMinutes: 30 } }
        ],
        isActive: true,
        priority: 70,
      },
      {
        id: generateId(),
        name: 'Немає відповіді 48 годин - ескалація',
        description: 'Якщо лід не контактував 48 годин, ескалювати',
        trigger: AutomationTrigger.NO_RESPONSE_48H,
        actions: [
          { action: AutomationAction.ESCALATE_TO_ADMIN, params: {} },
          { action: AutomationAction.SEND_NOTIFICATION, params: { notificationType: NotificationType.SYSTEM, title: 'Ескалація: немає контакту', message: 'Лід {{firstName}} {{lastName}} не контактував більше 48 годин. Потрібна увага!' } }
        ],
        isActive: true,
        priority: 75,
      },
    ];

    await this.automationRuleModel.insertMany(rules);
    this.logger.log(`Created ${rules.length} automation rules`);
    return rules.length;
  }

  /**
   * Seed шаблонів повідомлень
   */
  async seedMessageTemplates(): Promise<number> {
    const existingTemplates = await this.messageTemplateModel.countDocuments();
    if (existingTemplates > 0) {
      this.logger.log(`Message templates already exist (${existingTemplates})`);
      return 0;
    }

    const templates = [
      // Email templates
      {
        id: generateId(),
        name: 'Новий лід',
        description: 'Нотифікація менеджеру про нового ліда',
        channel: CommunicationChannel.EMAIL,
        type: 'new_lead',
        subject: 'Новий лід: {{firstName}} {{lastName}}',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0A0A0B;">Новий лід в системі</h2>
          <p>Ім'я: <strong>{{firstName}} {{lastName}}</strong></p>
          <p>Email: {{email}}</p>
          <p>Телефон: {{phone}}</p>
          <p>Джерело: {{source}}</p>
          <hr style="border: 1px solid #E4E4E7; margin: 20px 0;">
          <p style="color: #71717A; font-size: 14px;">Зателефонуйте клієнту протягом 10 хвилин для найкращого результату.</p>
        </div>`,
        isActive: true,
      },
      {
        id: generateId(),
        name: 'Нагадування про задачу',
        description: 'Нагадування про прострочену або наближену задачу',
        channel: CommunicationChannel.EMAIL,
        type: 'task_reminder',
        subject: 'Нагадування: {{taskTitle}}',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Нагадування про задачу</h2>
          <p><strong>{{taskTitle}}</strong></p>
          <p>{{taskDescription}}</p>
          <p>Термін: {{dueDate}}</p>
          <hr style="border: 1px solid #E4E4E7; margin: 20px 0;">
          <p style="color: #71717A; font-size: 14px;">AutoCRM</p>
        </div>`,
        isActive: true,
      },
      {
        id: generateId(),
        name: 'Депозит отримано',
        description: 'Повідомлення про отримання депозиту',
        channel: CommunicationChannel.EMAIL,
        type: 'deposit_alert',
        subject: 'Депозит отримано: {{amount}} USD',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16A34A;">Депозит підтверджено</h2>
          <p>Клієнт: <strong>{{customerName}}</strong></p>
          <p>Сума: <strong>{{amount}} USD</strong></p>
          <p>Угода: {{dealTitle}}</p>
          <hr style="border: 1px solid #E4E4E7; margin: 20px 0;">
          <p style="color: #71717A; font-size: 14px;">AutoCRM</p>
        </div>`,
        isActive: true,
      },
      // SMS templates (Bulgaria multilingual)
      {
        id: generateId(),
        name: 'Follow-up SMS (UA)',
        description: 'SMS нагадування для follow-up - українська',
        channel: CommunicationChannel.SMS,
        type: 'follow_up',
        subject: 'Follow-up',
        content: 'Доброго дня, {{firstName}}! Це {{managerName}} з AutoCRM. Нагадую про нашу розмову. Зателефонуйте, будь ласка: {{managerPhone}}',
        contentLocalized: {
          uk: 'Доброго дня, {{firstName}}! Це {{managerName}} з AutoCRM. Нагадую про нашу розмову. Зателефонуйте, будь ласка: {{managerPhone}}',
          en: 'Hello {{firstName}}! This is {{managerName}} from AutoCRM. Following up on our conversation. Please call: {{managerPhone}}',
          bg: 'Здравейте {{firstName}}! Това е {{managerName}} от AutoCRM. Напомняме за нашия разговор. Моля, обадете се: {{managerPhone}}',
        },
        isActive: true,
      },
      {
        id: generateId(),
        name: 'No Answer SMS',
        description: 'SMS після невдалих спроб дзвінка',
        channel: CommunicationChannel.SMS,
        type: 'no_answer',
        subject: 'No Answer',
        content: 'Доброго дня, {{firstName}}! Ми намагалися зв\'язатися з вами. Зателефонуйте нам: {{managerPhone}} або напишіть на email.',
        contentLocalized: {
          uk: 'Доброго дня, {{firstName}}! Ми намагалися зв\'язатися з вами. Зателефонуйте нам: {{managerPhone}} або напишіть на email.',
          en: 'Hello {{firstName}}! We tried to reach you. Please call us: {{managerPhone}} or send an email.',
          bg: 'Здравейте {{firstName}}! Опитахме се да се свържем с вас. Моля, обадете се: {{managerPhone}} или ни пишете на email.',
        },
        isActive: true,
      },
      {
        id: generateId(),
        name: 'Callback Reminder SMS',
        description: 'SMS нагадування про зворотний дзвінок',
        channel: CommunicationChannel.SMS,
        type: 'callback',
        subject: 'Callback',
        content: 'Доброго дня! Залишили заявку на {{companyName}}? Ми зателефонуємо вам сьогодні. Дякуємо!',
        contentLocalized: {
          uk: 'Доброго дня! Залишили заявку на {{companyName}}? Ми зателефонуємо вам сьогодні. Дякуємо!',
          en: 'Hello! Left a request at {{companyName}}? We will call you today. Thank you!',
          bg: 'Здравейте! Оставихте заявка в {{companyName}}? Ще ви се обадим днес. Благодарим!',
        },
        isActive: true,
      },
      {
        id: generateId(),
        name: 'Welcome SMS',
        description: 'SMS привітання для нового ліда',
        channel: CommunicationChannel.SMS,
        type: 'welcome',
        subject: 'Welcome',
        content: 'Дякуємо за звернення до {{companyName}}! Наш менеджер зв\'яжеться з вами найближчим часом.',
        contentLocalized: {
          uk: 'Дякуємо за звернення до {{companyName}}! Наш менеджер зв\'яжеться з вами найближчим часом.',
          en: 'Thank you for contacting {{companyName}}! Our manager will reach you shortly.',
          bg: 'Благодарим ви, че се свързахте с {{companyName}}! Нашият мениджър ще се свърже с вас скоро.',
        },
        isActive: true,
      },
    ];

    await this.messageTemplateModel.insertMany(templates);
    this.logger.log(`Created ${templates.length} message templates`);
    return templates.length;
  }

  /**
   * Seed системних налаштувань
   */
  async seedSettings(): Promise<number> {
    const existingSettings = await this.settingsModel.countDocuments();
    if (existingSettings > 0) {
      this.logger.log('Settings already exist');
      return 0;
    }

    const settings = {
      id: generateId(),
      key: 'system_settings',
      description: 'Main system settings',
      value: {
        companyName: 'AutoCRM',
        defaultLanguage: 'uk',
        timezone: 'Europe/Sofia', // Bulgaria
        currency: 'USD',
        workingHours: {
          start: '09:00',
          end: '18:00',
          timezone: 'Europe/Sofia',
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: false,
        },
        automation: {
          enabled: true,
          maxRetries: 3,
          retryDelayMinutes: [5, 15, 30],
        },
        sms: {
          provider: 'twilio',
          defaultCountryCode: '+359', // Bulgaria
          senderName: 'AutoCRM',
        },
      },
    };

    await this.settingsModel.create(settings);
    this.logger.log('Created system settings');
    return 1;
  }

  /**
   * Seed тестових лідів (dev only)
   */
  async seedTestLeads(count: number = 5): Promise<number> {
    const existingLeads = await this.leadModel.countDocuments();
    if (existingLeads >= count) {
      this.logger.log(`Test leads already exist (${existingLeads})`);
      return 0;
    }

    const sources = Object.values(LeadSource);
    const statuses = Object.values(LeadStatus);
    const contactStatuses = Object.values(ContactStatus);

    const leads: any[] = [];
    for (let i = 0; i < count; i++) {
      leads.push({
        id: generateId(),
        firstName: `Test${i + 1}`,
        lastName: `Lead${i + 1}`,
        email: `test.lead${i + 1}@example.com`,
        phone: `+359888${100000 + i}`,
        company: i % 2 === 0 ? `Company ${i + 1}` : undefined,
        status: statuses[i % statuses.length],
        contactStatus: contactStatuses[i % contactStatuses.length],
        source: sources[i % sources.length],
        value: Math.floor(Math.random() * 10000),
        callAttempts: i % 4,
        escalationLevel: i % 4,
        isDeleted: false,
      });
    }

    await this.leadModel.insertMany(leads);
    this.logger.log(`Created ${leads.length} test leads`);
    return leads.length;
  }

  /**
   * Очистка тестових даних
   */
  async clearTestData(): Promise<void> {
    await this.leadModel.deleteMany({ email: { $regex: /^test\.lead/ } });
    this.logger.log('Cleared test data');
  }
}
