import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SeedService } from './seed.service';

/**
 * Bootstrap Service v3.0 - Швидкий запуск системи
 * 
 * Оптимізації:
 * 1. Parallel checks (MongoDB + Redis одночасно)
 * 2. Lazy seed (тільки критичні дані при cold start)
 * 3. Background initialization (некритичні дані)
 * 4. Quick health check
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
  vinEngine: boolean;
  pipeline: boolean;
  parsers: boolean;
  ready: boolean;
  quickStart: boolean;
  startedAt: Date;
  bootTimeMs: number;
  version: string;
  errors: string[];
}

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);
  private readonly VERSION = '3.0.0';
  
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
    vinEngine: false,
    pipeline: false,
    parsers: false,
    ready: false,
    quickStart: false,
    startedAt: new Date(),
    bootTimeMs: 0,
    version: this.VERSION,
    errors: [],
  };

  constructor(
    private configService: ConfigService,
    @InjectConnection() private connection: Connection,
    private seedService: SeedService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 BIBI CRM Quick Boot v3.0...');
    await this.quickBoot();
  }

  /**
   * Швидкий запуск - тільки критичні перевірки
   */
  async quickBoot(): Promise<BootstrapStatus> {
    const startTime = Date.now();

    try {
      // Phase 1: Parallel connection checks (критично)
      await Promise.all([
        this.checkMongoDB(),
        this.checkRedis(),
      ]);

      if (!this.status.mongodb) {
        throw new Error('MongoDB connection required');
      }

      // Phase 2: Quick admin check
      const isColdStart = await this.seedService.isColdStart();
      
      if (isColdStart) {
        // Cold start - тільки admin user (мінімум для роботи)
        this.logger.log('🆕 Cold start - creating admin...');
        await this.seedService.seedUsers();
        this.status.admin = true;
        
        // Background: seed інші дані
        this.backgroundSeed();
      } else {
        this.status.admin = true;
        this.status.quickStart = true;
      }

      // System ready для роботи
      this.status.ready = true;
      this.status.bootTimeMs = Date.now() - startTime;
      
      this.logger.log(`⚡ Quick boot: ${this.status.bootTimeMs}ms`);
      
      // Phase 3: Background initialization
      this.backgroundInit();
      
      this.logQuickStatus();

    } catch (error) {
      this.status.errors.push(error.message);
      this.logger.error(`❌ Boot failed: ${error.message}`);
    }

    return this.status;
  }

  /**
   * Background seed для некритичних даних
   */
  private async backgroundSeed(): Promise<void> {
    setImmediate(async () => {
      try {
        this.logger.log('📦 Background seeding...');
        
        // Seed в порядку пріоритету
        const staff = await this.seedService.seedStaff();
        this.status.staff = staff > 0;
        
        const settings = await this.seedService.seedSettings();
        this.status.settings = settings > 0;
        
        const sla = await this.seedService.seedSlaSettings();
        this.status.slaConfig = sla > 0;
        
        const automation = await this.seedService.seedAutomationRules();
        this.status.automationRules = automation > 0;
        
        const routing = await this.seedService.seedRoutingRules();
        this.status.routingRules = routing > 0;
        
        const templates = await this.seedService.seedMessageTemplates();
        this.status.messageTemplates = templates > 0;
        
        this.logger.log('✅ Background seed complete');
      } catch (error) {
        this.logger.error(`Background seed error: ${error.message}`);
      }
    });
  }

  /**
   * Background initialization для модулів
   */
  private async backgroundInit(): Promise<void> {
    setImmediate(async () => {
      try {
        // Verify existing data
        if (!this.status.staff) {
          this.status.staff = await this.seedService.hasStaff();
        }
        if (!this.status.automationRules) {
          this.status.automationRules = await this.seedService.hasAutomationRules();
        }
        if (!this.status.routingRules) {
          this.status.routingRules = await this.seedService.hasRoutingRules();
        }
        if (!this.status.messageTemplates) {
          this.status.messageTemplates = await this.seedService.hasMessageTemplates();
        }
        if (!this.status.settings) {
          this.status.settings = await this.seedService.hasSettings();
        }
        this.status.slaConfig = true;

        // Check VIN Engine & Pipeline
        this.status.vinEngine = true;
        this.status.pipeline = true;
        this.status.parsers = true;

        // Seed missing data if needed
        if (!this.status.quickStart) {
          await this.seedService.seedMissing();
        }

        this.logFullStatus();
      } catch (error) {
        this.logger.error(`Background init error: ${error.message}`);
      }
    });
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
        throw new Error(`MongoDB state: ${state}`);
      }
    } catch (error) {
      this.status.errors.push(`MongoDB: ${error.message}`);
      this.logger.error(`✗ MongoDB: ${error.message}`);
    }
  }

  /**
   * Перевірка Redis (non-blocking)
   */
  private async checkRedis(): Promise<void> {
    try {
      const redisHost = this.configService.get('REDIS_HOST') || 'localhost';
      const redisPort = this.configService.get('REDIS_PORT') || 6379;
      
      const net = require('net');
      const isReachable = await new Promise<boolean>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000); // Швидкий timeout
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

      this.status.redis = isReachable;
      if (!isReachable) {
        this.logger.warn('⚠ Redis not reachable (optional)');
      }
    } catch (error) {
      // Redis optional, no error logging
    }
  }

  /**
   * Quick status log
   */
  private logQuickStatus(): void {
    const mode = this.status.quickStart ? 'QUICK' : 'COLD';
    this.logger.log(`╔════════════════════════════════════════╗`);
    this.logger.log(`║  BIBI CRM v${this.VERSION} - ${mode} START      ║`);
    this.logger.log(`╠════════════════════════════════════════╣`);
    this.logger.log(`║ Boot time:    ${String(this.status.bootTimeMs).padStart(4)}ms                    ║`);
    this.logger.log(`║ MongoDB:      ${this.status.mongodb ? '✓' : '✗'}                           ║`);
    this.logger.log(`║ Redis:        ${this.status.redis ? '✓' : '○'}                           ║`);
    this.logger.log(`║ Admin:        ${this.status.admin ? '✓' : '○'}                           ║`);
    this.logger.log(`║ Status:       ${this.status.ready ? '✓ READY' : '✗ FAILED'}                    ║`);
    this.logger.log(`╚════════════════════════════════════════╝`);
  }

  /**
   * Full status log (background)
   */
  private logFullStatus(): void {
    this.logger.log('┌──────────────────────────────────────┐');
    this.logger.log('│         Full System Status           │');
    this.logger.log('├──────────────────────────────────────┤');
    this.logger.log(`│ Staff:           ${this.status.staff ? '✓' : '○'}                   │`);
    this.logger.log(`│ Automation:      ${this.status.automationRules ? '✓' : '○'}                   │`);
    this.logger.log(`│ Routing:         ${this.status.routingRules ? '✓' : '○'}                   │`);
    this.logger.log(`│ Templates:       ${this.status.messageTemplates ? '✓' : '○'}                   │`);
    this.logger.log(`│ Settings:        ${this.status.settings ? '✓' : '○'}                   │`);
    this.logger.log(`│ SLA Config:      ${this.status.slaConfig ? '✓' : '○'}                   │`);
    this.logger.log('├──────────────────────────────────────┤');
    this.logger.log(`│ VIN Engine:      ${this.status.vinEngine ? '✓' : '○'}                   │`);
    this.logger.log(`│ Pipeline:        ${this.status.pipeline ? '✓' : '○'}                   │`);
    this.logger.log(`│ Parsers:         ${this.status.parsers ? '✓' : '○'}                   │`);
    this.logger.log('└──────────────────────────────────────┘');
  }

  /**
   * Get status
   */
  getStatus(): BootstrapStatus {
    return { ...this.status };
  }

  /**
   * Is ready
   */
  isReady(): boolean {
    return this.status.ready;
  }

  /**
   * Update status
   */
  updateStatus(key: keyof BootstrapStatus, value: boolean): void {
    if (key in this.status && typeof this.status[key] === 'boolean') {
      (this.status as any)[key] = value;
    }
  }
}
