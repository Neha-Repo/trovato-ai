import { Body, Controller, Post } from '@nestjs/common';

import type {
  AvailabilityCheckResult,
  AvailabilityRequest,
} from './availability-provider';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('check')
  async checkAvailability(
    @Body()
    request: AvailabilityRequest,
  ): Promise<AvailabilityCheckResult> {
    return this.availabilityService.checkAvailability(request);
  }
}
