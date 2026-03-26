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

/**
 * Ingestion Module
 * 
 * Parser Integration Layer:
 * - Webhook endpoints для прийому даних від парсерів (Copart, IAAI, etc)
 * - Raw data storage для debug та повторної обробки
 * - Vehicle normalization та deduplication по VIN
 * - Activity integration
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParserRawData.name, schema: ParserRawDataSchema },
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
  ],
  controllers: [IngestionController],
  providers: [IngestionService, VehicleService],
  exports: [IngestionService, VehicleService],
})
export class IngestionModule {}
