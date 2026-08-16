import { Injectable } from '@nestjs/common';

import { AvailabilityService } from '../availability/availability.service';
import {
  AvailabilityWatch,
  AvailabilityWatchService,
} from './availability-watch.service';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runScheduledCheck(): Promise<void> {
    console.log('Running scheduled availability watch check');

    await this.checkActiveWatches();
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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error,
      });
    }
  }
}
