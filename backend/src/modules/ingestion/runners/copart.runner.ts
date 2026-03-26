/**
 * Copart Runner
 * 
 * Парсер для Copart.com з anti-block захистом:
 * - Proxy rotation
 * - Fingerprint randomization
 * - Circuit breaker
 * - Retry з exponential backoff
 * 
 * Flow:
 * Scrape → Raw Storage → Normalize → Dedup (VIN) → Vehicle → Activity
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';

// Schemas
import { ParserRawData } from '../schemas/parser-raw-data.schema';
import { Vehicle } from '../schemas/vehicle.schema';

// Services
import { VehicleService } from '../services/vehicle.service';
import { ActivityService } from '../../activity/services/activity.service';

// Antiblock
import {
  CircuitBreakerService,
  ParserHealthService,
  ParserGuardService,
  HttpFingerprintService,
  withRetry,
  humanPause,
} from '../antiblock';

// Normalizers
import { normalizeCopart, CopartRawItem } from '../normalize/copart.normalize';

// Enums
import { VehicleSource, ProcessingStatus } from '../enums/vehicle.enum';
import { ActivityAction, ActivityEntityType, ActivitySource } from '../../activity/enums/activity-action.enum';
import { generateId } from '../../../shared/utils';

// Scraping (optional - for browser-based scraping)
// import { BrowserSessionManager, universalScrape } from '../scraping-core';

interface CopartApiResponse {
  data?: {
    results?: {
      content?: CopartRawItem[];
    };
    content?: CopartRawItem[];
  };
  results?: CopartRawItem[];
  content?: CopartRawItem[];
  lots?: CopartRawItem[];
}

@Injectable()
export class CopartRunner implements OnModuleInit {
  private readonly logger = new Logger(CopartRunner.name);
  private isRunning = false;
  private lastRunAt: Date | null = null;

  // Copart API endpoints (placeholder - потребує реального API)
  private readonly COPART_SEARCH_URL = 'https://www.copart.com/public/data/lotSearchResults';
  
  constructor(
    @InjectModel(ParserRawData.name) private rawDataModel: Model<ParserRawData>,
    private readonly vehicleService: VehicleService,
    private readonly activityService: ActivityService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly parserHealth: ParserHealthService,
    private readonly parserGuard: ParserGuardService,
    private readonly httpFingerprint: HttpFingerprintService,
  ) {}

  async onModuleInit() {
    this.logger.log('[CopartRunner] Initialized');
  }

  // ========================================
  // CRON JOB
  // ========================================

  @Cron('0 */4 * * *') // Кожні 4 години
  async cronRun() {
    this.logger.log('[CRON] Starting Copart parser...');
    await this.run();
  }

  // ========================================
  // MAIN RUN METHOD
  // ========================================

  async run(): Promise<{
    success: boolean;
    fetched: number;
    created: number;
    updated: number;
    failed: number;
    durationMs: number;
    errors: string[];
  }> {
    if (this.isRunning) {
      return {
        success: false,
        fetched: 0,
        created: 0,
        updated: 0,
        failed: 0,
        durationMs: 0,
        errors: ['Another run is in progress'],
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let fetched = 0;
    let created = 0;
    let updated = 0;
    let failed = 0;

    try {
      // Використовуємо ParserGuard для circuit breaker + health tracking
      const guardResult = await this.parserGuard.runGuarded(
        'copart_main',
        'Copart Main Parser',
        async () => {
          // Fetch raw data from Copart
          const rawItems = await this.fetchCopartData();
          return rawItems;
        }
      );

      if (guardResult.skipped) {
        return {
          success: false,
          fetched: 0,
          created: 0,
          updated: 0,
          failed: 0,
          durationMs: Date.now() - startTime,
          errors: ['Skipped: circuit breaker open'],
        };
      }

      if (!guardResult.success || !guardResult.result) {
        return {
          success: false,
          fetched: 0,
          created: 0,
          updated: 0,
          failed: 0,
          durationMs: Date.now() - startTime,
          errors: [guardResult.error || 'Unknown error'],
        };
      }

      const rawItems = guardResult.result;
      fetched = rawItems.length;

      // Process each item
      for (const item of rawItems) {
        try {
          await this.processItem(item);
          
          // Перевіряємо чи created чи updated
          const vin = item.vin || item.fv || item.vehicle?.vin;
          if (vin) {
            const existing = await this.vehicleService.findByVin(vin).catch(() => null);
            if (existing) {
              updated++;
            } else {
              created++;
            }
          }

          // Human-like pause between items
          await humanPause(100, 300);
        } catch (error) {
          failed++;
          errors.push(`Item ${item.id || item.lotId}: ${error.message}`);
        }
      }

      this.lastRunAt = new Date();

      return {
        success: true,
        fetched,
        created,
        updated,
        failed,
        durationMs: Date.now() - startTime,
        errors,
      };

    } catch (error) {
      this.logger.error(`[CopartRunner] Run failed: ${error.message}`);
      return {
        success: false,
        fetched,
        created,
        updated,
        failed,
        durationMs: Date.now() - startTime,
        errors: [error.message],
      };
    } finally {
      this.isRunning = false;
    }
  }

  // ========================================
  // FETCH DATA
  // ========================================

  private async fetchCopartData(): Promise<CopartRawItem[]> {
    // Метод 1: Direct API (якщо доступний)
    try {
      return await this.fetchViaApi();
    } catch (error) {
      this.logger.warn(`[CopartRunner] API fetch failed: ${error.message}, trying browser...`);
    }

    // Метод 2: Browser scraping (fallback)
    // return await this.fetchViaBrowser();

    // Поки повертаємо пустий масив - потрібна реальна інтеграція
    this.logger.warn('[CopartRunner] No data source configured');
    return [];
  }

  private async fetchViaApi(): Promise<CopartRawItem[]> {
    const headers = this.httpFingerprint.buildHeaders({ kind: 'json' });
    
    // Приклад запиту до Copart API
    // Реальний API може вимагати автентифікації або інший формат
    const response = await withRetry(
      async () => {
        const res = await fetch(this.COPART_SEARCH_URL, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter: {},
            sort: [{ field: 'auction_date_utc', direction: 'asc' }],
            page: 0,
            size: 100,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        return res.json() as Promise<CopartApiResponse>;
      },
      { retries: 3, baseDelayMs: 2000 }
    );

    // Extract items from response
    return this.extractItemsFromResponse(response);
  }

  private extractItemsFromResponse(response: CopartApiResponse): CopartRawItem[] {
    // Handle different response structures
    if (response.data?.results?.content) {
      return response.data.results.content;
    }
    if (response.data?.content) {
      return response.data.content;
    }
    if (response.results) {
      return response.results;
    }
    if (response.content) {
      return response.content;
    }
    if (response.lots) {
      return response.lots;
    }
    return [];
  }

  // ========================================
  // PROCESS SINGLE ITEM
  // ========================================

  private async processItem(item: CopartRawItem): Promise<void> {
    const rawId = generateId();

    // 1. Save raw data
    await this.saveRawData(rawId, item);

    // 2. Normalize
    const normalized = normalizeCopart(item);

    if (!normalized) {
      await this.updateRawStatus(rawId, ProcessingStatus.FAILED, 'Normalization failed (invalid VIN)');
      return;
    }

    // 3. Upsert vehicle (dedup by VIN)
    const result = await this.vehicleService.upsertByVin(normalized);

    // 4. Update raw status
    await this.updateRawStatus(rawId, ProcessingStatus.PROCESSED, undefined, result.id);

    // 5. Log activity
    this.activityService.logAsync({
      userId: 'system',
      userRole: 'system',
      userName: 'Copart Parser',
      action: result.isNew ? ActivityAction.VEHICLE_CREATED : ActivityAction.VEHICLE_UPDATED,
      entityType: ActivityEntityType.VEHICLE,
      entityId: result.id,
      meta: {
        vin: normalized.vin,
        source: 'copart',
        externalId: normalized.externalId,
        runner: 'copart',
      },
      context: {
        source: ActivitySource.AUTOMATION,
      },
    });
  }

  // ========================================
  // RAW DATA STORAGE
  // ========================================

  private async saveRawData(id: string, item: CopartRawItem): Promise<void> {
    await this.rawDataModel.create({
      id,
      source: VehicleSource.COPART,
      externalId: String(item.id || item.lotId || item.ln || ''),
      vin: item.vin || item.fv || item.vehicle?.vin,
      payload: item,
      processingStatus: ProcessingStatus.PENDING,
      receivedAt: new Date(),
    });
  }

  private async updateRawStatus(
    id: string,
    status: ProcessingStatus,
    error?: string,
    vehicleId?: string,
  ): Promise<void> {
    await this.rawDataModel.updateOne(
      { id },
      {
        processingStatus: status,
        processingError: error,
        vehicleId,
        processedAt: new Date(),
        $inc: { processingAttempts: 1 },
      },
    );
  }

  // ========================================
  // STATUS
  // ========================================

  getStatus(): {
    isRunning: boolean;
    lastRunAt: Date | null;
    health: any;
    circuitBreaker: any;
  } {
    return {
      isRunning: this.isRunning,
      lastRunAt: this.lastRunAt,
      health: this.parserHealth.getHealth('copart_main'),
      circuitBreaker: this.circuitBreaker.getState('copart_main'),
    };
  }

  // ========================================
  // MANUAL TRIGGER
  // ========================================

  async runManual(): Promise<any> {
    return this.run();
  }
}
