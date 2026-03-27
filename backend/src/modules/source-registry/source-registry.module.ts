/**
 * Source Registry Module
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Source, SourceSchema } from './source.schema';
import { SourceRegistryService } from './source-registry.service';
import { SourceRegistryController } from './source-registry.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Source.name, schema: SourceSchema },
    ]),
  ],
  providers: [SourceRegistryService],
  controllers: [SourceRegistryController],
  exports: [SourceRegistryService, MongooseModule],
})
export class SourceRegistryModule {}
