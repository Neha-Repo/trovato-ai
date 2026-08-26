import { Body, Controller, Post } from '@nestjs/common';

import type { AvailabilityCheckResult } from './availability-provider';
import { AvailabilityRequestDto } from './dto/availability-request.dto';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('check')
  async checkAvailability(
    @Body()
    request: AvailabilityRequestDto,
  ): Promise<AvailabilityCheckResult> {
    return this.availabilityService.checkAvailability(request);
  }
}
