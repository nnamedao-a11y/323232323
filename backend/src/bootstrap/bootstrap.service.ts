import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Bootstrap Service - Централізований сервіс ініціалізації
 * 
 * Відповідає за:
 * 1. Перевірку з'єднань (MongoDB, Redis)
 * 2. Ініціалізацію дефолтних даних
 * 3. Міграції та seed data
 * 4. Health checks
 */

export interface BootstrapStatus {
  mongodb: boolean;
  redis: boolean;
  admin: boolean;
  automationRules: boolean;
  messageTemplates: boolean;
  settings: boolean;
  ready: boolean;
  startedAt: Date;
  errors: string[];
}

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);
  private status: BootstrapStatus = {
    mongodb: false,
    redis: false,
    admin: false,
    automationRules: false,
    messageTemplates: false,
    settings: false,
    ready: false,
    startedAt: new Date(),
    errors: [],
  };

  constructor(
    private configService: ConfigService,
    @InjectConnection() private connection: Connection,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Starting CRM Bootstrap...');
    await this.runBootstrap();
  }

  /**
   * Головний метод bootstrap
   */
  async runBootstrap(): Promise<BootstrapStatus> {
    const startTime = Date.now();

    try {
      // 1. MongoDB check
      await this.checkMongoDB();

      // 2. Redis check
      await this.checkRedis();

      // Якщо базові сервіси працюють - система готова
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
   * Перевірка MongoDB
   */
  private async checkMongoDB(): Promise<void> {
    try {
      const state = this.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
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
      
      // Simple TCP check
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
        this.logger.warn(`⚠ Redis not reachable at ${redisHost}:${redisPort} - queues may not work`);
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
    this.logger.log('=== Bootstrap Status ===');
    this.logger.log(`MongoDB: ${this.status.mongodb ? '✓' : '✗'}`);
    this.logger.log(`Redis: ${this.status.redis ? '✓' : '⚠ (optional)'}`);
    this.logger.log(`Admin User: ${this.status.admin ? '✓' : 'pending'}`);
    this.logger.log(`Automation Rules: ${this.status.automationRules ? '✓' : 'pending'}`);
    this.logger.log(`Message Templates: ${this.status.messageTemplates ? '✓' : 'pending'}`);
    this.logger.log(`System Ready: ${this.status.ready ? '✓' : '✗'}`);
    if (this.status.errors.length > 0) {
      this.logger.error(`Errors: ${this.status.errors.join(', ')}`);
    }
    this.logger.log('========================');
  }

  /**
   * Оновити статус (викликається з інших сервісів)
   */
  updateStatus(key: keyof BootstrapStatus, value: boolean): void {
    if (key in this.status && typeof this.status[key] === 'boolean') {
      (this.status as any)[key] = value;
    }
  }
}
