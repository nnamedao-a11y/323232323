import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { ParserRawData, ParserRawDataSchema } from './schemas/parser-raw-data.schema';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';

// Services
import { IngestionService } from './services/ingestion.service';
import { VehicleService } from './services/vehicle.service';

// Controllers
import { IngestionController } from './controllers/ingestion.controller';

// Antiblock Services
import {
  HttpFingerprintService,
  ProxyPoolService,
  EnhancedProxyPoolService,
  CircuitBreakerService,
  ParserHealthService,
  ParserGuardService,
  ResilientFetchService,
} from './antiblock';

// Runners
import { CopartRunner } from './runners/copart.runner';
import { IAAIRunner } from './runners/iaai.runner';

/**
 * Ingestion Module
 * 
 * Parser Integration Layer з anti-block захистом:
 * 
 * 1. Antiblock Layer:
 *    - Proxy pool з failover
 *    - HTTP fingerprint ротація
 *    - Circuit breaker
 *    - Retry з exponential backoff
 *    - Parser health monitoring
 * 
 * 2. Scraping Core:
 *    - Browser session management
 *    - Universal XHR interceptor
 *    - Network interceptor
 * 
 * 3. Runners:
 *    - Copart runner
 *    - IAAI runner
 * 
 * 4. Data Flow:
 *    Parser → Raw Storage → Normalize → Dedup (VIN) → Vehicle → Activity → Dashboard
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParserRawData.name, schema: ParserRawDataSchema },
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
  ],
  controllers: [IngestionController],
  providers: [
    // Core services
    IngestionService,
    VehicleService,
    
    // Antiblock services
    HttpFingerprintService,
    ProxyPoolService,
    EnhancedProxyPoolService,
    CircuitBreakerService,
    ParserHealthService,
    ParserGuardService,
    ResilientFetchService,
    
    // Runners
    CopartRunner,
    IAAIRunner,
  ],
  exports: [
    IngestionService, 
    VehicleService,
    CopartRunner,
    IAAIRunner,
    ParserHealthService,
    CircuitBreakerService,
  ],
})
export class IngestionModule {}
