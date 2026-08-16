import { Module } from '@nestjs/common';

import { AvailabilityController } from './availability.controller';
import { AvailabilityProviderService } from './availability-provider.service';
import { AvailabilityService } from './availability.service';
import { MockAvailabilityProvider } from './mock-availability.provider';

@Module({
  controllers: [AvailabilityController],

  providers: [
    MockAvailabilityProvider,
    AvailabilityProviderService,
    AvailabilityService,
  ],

  exports: [AvailabilityService],
})
export class AvailabilityModule {}
