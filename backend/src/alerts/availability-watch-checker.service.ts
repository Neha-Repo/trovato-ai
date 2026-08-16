import { Injectable } from '@nestjs/common';

import { AvailabilityService } from '../availability/availability.service';
import {
  AvailabilityWatch,
  AvailabilityWatchService,
} from './availability-watch.service';

@Injectable()
export class AvailabilityWatchCheckerService {
  constructor(
    private readonly availabilityService: AvailabilityService,

    private readonly availabilityWatchService: AvailabilityWatchService,
  ) {}

  async checkActiveWatches(): Promise<void> {
    const watches = await this.availabilityWatchService.getActiveWatches();

    for (const watch of watches) {
      await this.checkWatch(watch);
    }
  }

  private async checkWatch(watch: AvailabilityWatch): Promise<void> {
    try {
      const result = await this.availabilityService.checkAvailability({
        experienceId: watch.experienceId,

        requestedDate: watch.requestedDate,

        travellers: watch.travellers,
      });

      if (!result.available) {
        return;
      }

      await this.availabilityWatchService.markMatched(watch.id);

      console.log('Availability watch matched', {
        watchId: watch.id,

        experienceId: watch.experienceId,

        requestedDate: watch.requestedDate,

        travellers: watch.travellers,

        availableSlots: result.requestedDateSlots.length,
      });
    } catch (error) {
      console.error('Availability watch check failed', {
        watchId: watch.id,

        experienceId: watch.experienceId,

        error,
      });
    }
  }
}
