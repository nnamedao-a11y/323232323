/**
 * DB VIN Search Provider
 * 
 * Шукає VIN в локальній базі vehicles
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VinSearchCandidate,
  VinSearchContext,
  VinSearchProvider,
} from '../interfaces/vin-search-provider.interface';
import { Vehicle } from '../../ingestion/schemas/vehicle.schema';

@Injectable()
export class DbVinSearchProvider implements VinSearchProvider {
  readonly name = 'local_db';
  readonly priority = 1; // Highest priority

  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<Vehicle>,
  ) {}

  async search(context: VinSearchContext): Promise<VinSearchCandidate[]> {
    const vin = context.vin.trim().toUpperCase();
    
    const vehicle = await this.vehicleModel.findOne({ 
      vin, 
      isDeleted: { $ne: true } 
    }).lean();

    if (!vehicle) return [];

    return [
      {
        vin: vehicle.vin,
        title: vehicle.title,
        price: vehicle.price,
        images: vehicle.images,
        saleDate: vehicle.auctionDate,
        isAuction: true,
        lotNumber: vehicle.lotNumber,
        location: vehicle.auctionLocation,
        mileage: vehicle.mileage?.toString(),
        make: vehicle.make,
        model: vehicle.vehicleModel,
        year: vehicle.year,
        damageType: vehicle.damageType,
        sourceUrl: vehicle.sourceUrl,
        sourceName: this.name,
        confidence: 1.0, // Local DB = 100% confidence
        raw: vehicle,
      },
    ];
  }
}
