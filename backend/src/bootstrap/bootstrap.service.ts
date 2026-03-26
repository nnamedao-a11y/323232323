import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SeedService } from './seed.service';

/**
 * Bootstrap Service - Централізований сервіс ініціалізації v2.0
 * 
 * Відповідає за:
 * 1. Перевірку з'єднань (MongoDB, Redis)
 * 2. Cold start detection та автоматичний seed
 * 3. Ініціалізацію всіх необхідних даних для поточної версії системи
 * 4. Health checks
 */

export interface BootstrapStatus {
  mongodb: boolean;
  redis: boolean;
  admin: boolean;
  staff: boolean;
  automationRules: boolean;
  routingRules: boolean;
  messageTemplates: boolean;
  settings: boolean;
  slaConfig: boolean;
  ready: boolean;
  startedAt: Date;
  version: string;
  errors: string[];
}

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);
  private readonly VERSION = '2.0.0'; // Версія системи
  
  private status: BootstrapStatus = {
    mongodb: false,
    redis: false,
    admin: false,
    staff: false,
    automationRules: false,
    routingRules: false,
    messageTemplates: false,
    settings: false,
    slaConfig: false,
    ready: false,
    startedAt: new Date(),
    version: this.VERSION,
    errors: [],
  };

  constructor(
    private configService: ConfigService,
    @InjectConnection() private connection: Connection,
    private seedService: SeedService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Starting CRM Bootstrap v2.0...');
    await this.runBootstrap();
  }

  /**
   * Головний метод bootstrap
   */
  async runBootstrap(): Promise<BootstrapStatus> {
    const startTime = Date.now();

    try {
      // 1. Check MongoDB
      await this.checkMongoDB();

      // 2. Check Redis (optional)
      await this.checkRedis();

      // 3. Run cold start initialization if needed
      if (this.status.mongodb) {
        await this.initializeSystemData();
      }

      // System is ready if MongoDB is connected
      if (this.status.mongodb) {
        this.status.ready = true;
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Bootstrap completed in ${duration}ms`);
      this.logStatus();

    } catch (error) {
      this.status.errors.push(error.message);
      this.logger.error(`❌ Bootstrap failed: ${error.message}`);
    }

    return this.status;
  }

  /**
   * Ініціалізація системних даних при cold start
   */
  private async initializeSystemData(): Promise<void> {
    this.logger.log('📦 Checking system data...');

    try {
      // Check if this is a cold start (no admin user)
      const isColdStart = await this.seedService.isColdStart();
      
      if (isColdStart) {
        this.logger.log('🆕 Cold start detected - initializing system...');
        
        // Run full seed
        const result = await this.seedService.seedAll();
        
        this.status.admin = result.users > 0;
        this.status.staff = result.staff > 0;
        this.status.automationRules = result.automationRules > 0;
        this.status.routingRules = result.routingRules > 0;
        this.status.messageTemplates = result.messageTemplates > 0;
        this.status.settings = result.settings > 0;
        this.status.slaConfig = result.slaSettings > 0;
        
        this.logger.log(`✅ System initialized: ${JSON.stringify(result)}`);
      } else {
        this.logger.log('✓ System already initialized');
        
        // Verify data exists
        this.status.admin = true;
        this.status.staff = await this.seedService.hasStaff();
        this.status.automationRules = await this.seedService.hasAutomationRules();
        this.status.routingRules = await this.seedService.hasRoutingRules();
        this.status.messageTemplates = await this.seedService.hasMessageTemplates();
        this.status.settings = await this.seedService.hasSettings();
        this.status.slaConfig = true;
        
        // Run incremental seed for any missing data
        await this.seedService.seedMissing();
      }
    } catch (error) {
      this.logger.error(`System initialization failed: ${error.message}`);
      this.status.errors.push(`Init: ${error.message}`);
    }
  }

  /**
   * Перевірка MongoDB
   */
  private async checkMongoDB(): Promise<void> {
    try {
      const state = this.connection.readyState;
      if (state === 1) {
        this.status.mongodb = true;
        this.logger.log('✓ MongoDB connected');
      } else {
        throw new Error(`MongoDB not connected (state: ${state})`);
      }
    } catch (error) {
      this.status.errors.push(`MongoDB: ${error.message}`);
      this.logger.error(`✗ MongoDB check failed: ${error.message}`);
    }
  }

  /**
   * Перевірка Redis
   */
  private async checkRedis(): Promise<void> {
    try {
      const redisHost = this.configService.get('REDIS_HOST') || 'localhost';
      const redisPort = this.configService.get('REDIS_PORT') || 6379;
      
      const net = require('net');
      const isReachable = await new Promise<boolean>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
        socket.connect(redisPort, redisHost);
      });

      if (isReachable) {
        this.status.redis = true;
        this.logger.log(`✓ Redis reachable at ${redisHost}:${redisPort}`);
      } else {
        this.logger.warn(`⚠ Redis not reachable - queues may not work`);
      }
    } catch (error) {
      this.logger.warn(`⚠ Redis check skipped: ${error.message}`);
    }
  }

  /**
   * Отримати статус bootstrap
   */
  getStatus(): BootstrapStatus {
    return { ...this.status };
  }

  /**
   * Перевірка готовності системи
   */
  isReady(): boolean {
    return this.status.ready;
  }

  /**
   * Логування статусу
   */
  private logStatus(): void {
    this.logger.log('╔══════════════════════════════════════╗');
    this.logger.log('║       BIBI CRM Bootstrap Status      ║');
    this.logger.log('╠══════════════════════════════════════╣');
    this.logger.log(`║ Version:           ${this.VERSION.padEnd(18)}║`);
    this.logger.log(`║ MongoDB:           ${(this.status.mongodb ? '✓ Connected' : '✗ Failed').padEnd(18)}║`);
    this.logger.log(`║ Redis:             ${(this.status.redis ? '✓ Connected' : '⚠ Optional').padEnd(18)}║`);
    this.logger.log(`║ Admin User:        ${(this.status.admin ? '✓ Ready' : '○ Pending').padEnd(18)}║`);
    this.logger.log(`║ Staff:             ${(this.status.staff ? '✓ Ready' : '○ Pending').padEnd(18)}║`);
    this.logger.log(`║ Automation Rules:  ${(this.status.automationRules ? '✓ Ready' : '○ Pending').padEnd(18)}║`);
    this.logger.log(`║ Routing Rules:     ${(this.status.routingRules ? '✓ Ready' : '○ Pending').padEnd(18)}║`);
    this.logger.log(`║ Message Templates: ${(this.status.messageTemplates ? '✓ Ready' : '○ Pending').padEnd(18)}║`);
    this.logger.log(`║ Settings:          ${(this.status.settings ? '✓ Ready' : '○ Pending').padEnd(18)}║`);
    this.logger.log(`║ SLA Config:        ${(this.status.slaConfig ? '✓ Ready' : '○ Pending').padEnd(18)}║`);
    this.logger.log('╠══════════════════════════════════════╣');
    this.logger.log(`║ System Ready:      ${(this.status.ready ? '✓ YES' : '✗ NO').padEnd(18)}║`);
    this.logger.log('╚══════════════════════════════════════╝');
    
    if (this.status.errors.length > 0) {
      this.logger.error(`Errors: ${this.status.errors.join(', ')}`);
    }
  }

  /**
   * Оновити статус
   */
  updateStatus(key: keyof BootstrapStatus, value: boolean): void {
    if (key in this.status && typeof this.status[key] === 'boolean') {
      (this.status as any)[key] = value;
    }
  }
}
