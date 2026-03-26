import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { BootstrapService, BootstrapStatus } from './bootstrap.service';
import { SeedService } from './seed.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { UserRole } from '../shared/enums';

/**
 * System Controller - Health checks та системні операції
 */
@Controller('system')
export class SystemController {
  constructor(
    private bootstrapService: BootstrapService,
    private seedService: SeedService,
  ) {}

  /**
   * Health check - публічний endpoint
   */
  @Get('health')
  healthCheck() {
    const status = this.bootstrapService.getStatus();
    return {
      status: status.ready ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        mongodb: status.mongodb,
        redis: status.redis,
      },
    };
  }

  /**
   * Detailed status - для адмінів
   */
  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN, UserRole.ADMIN)
  getStatus(): BootstrapStatus {
    return this.bootstrapService.getStatus();
  }

  /**
   * Readiness check - для Kubernetes
   */
  @Get('ready')
  readinessCheck() {
    const isReady = this.bootstrapService.isReady();
    if (!isReady) {
      throw new Error('Service not ready');
    }
    return { ready: true };
  }

  /**
   * Liveness check - для Kubernetes
   */
  @Get('live')
  livenessCheck() {
    return { alive: true, timestamp: new Date().toISOString() };
  }

  /**
   * Re-run bootstrap (admin only)
   */
  @Post('bootstrap')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN)
  async reRunBootstrap() {
    return this.bootstrapService.runBootstrap();
  }

  /**
   * Run seed (admin only)
   */
  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN)
  async runSeed(@Body() body?: { includeTestLeads?: boolean }) {
    const result = await this.seedService.seedAll();
    
    if (body?.includeTestLeads) {
      result.leads = await this.seedService.seedTestLeads(10);
    }
    
    return result;
  }

  /**
   * Clear test data (admin only)
   */
  @Post('clear-test-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MASTER_ADMIN)
  async clearTestData() {
    await this.seedService.clearTestData();
    return { success: true };
  }
}
