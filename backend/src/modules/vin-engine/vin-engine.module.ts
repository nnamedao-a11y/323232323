/**
 * VIN Engine Module
 * 
 * VIN Intelligence Engine for 100% coverage
 * Search → Filter → Extract → Merge → Score → Cache
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from '../ingestion/schemas/vehicle.schema';
import { VinCache, VinCacheSchema } from './vin-cache.service';
import { SearchProviderService } from './search.provider';
import { UrlFilterService } from './url-filter.service';
import { ExtractorService } from './extractor.service';
import { VinMergeService } from './vin-merge.service';
import { VinCacheService } from './vin-cache.service';
import { VinSearchService } from './vin-search.service';
import { VinSearchController } from './vin-search.controller';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: VinCache.name, schema: VinCacheSchema },
    ]),
    PipelineModule,
  ],
  controllers: [VinSearchController],
  providers: [
    SearchProviderService,
    UrlFilterService,
    ExtractorService,
    VinMergeService,
    VinCacheService,
    VinSearchService,
  ],
  exports: [VinSearchService, VinCacheService],
})
export class VinEngineModule {}
