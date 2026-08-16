import { Injectable } from '@nestjs/common';

import {
  AvailabilityCheckResult,
  AvailabilityRequest,
} from './availability-provider';
import { AvailabilityProviderService } from './availability-provider.service';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityProviderService: AvailabilityProviderService,
  ) {}

  async checkAvailability(
    request: AvailabilityRequest,
  ): Promise<AvailabilityCheckResult> {
    const provider = this.availabilityProviderService.getProvider(
      request.experienceId,
    );

    return provider.getAvailability(request);
  }
}
