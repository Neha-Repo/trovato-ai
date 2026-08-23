import { Injectable } from '@nestjs/common';

import { AvailabilityService } from '../availability/availability.service';
import { FirebasePushService } from '../push/firebase-push.service';
import { PushDeviceService } from '../push/push-device.service';
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

    private readonly pushDeviceService: PushDeviceService,

    private readonly firebasePushService: FirebasePushService,
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

      const tokens = await this.pushDeviceService.getTokensForUser(
        watch.userId,
      );

      if (tokens.length === 0) {
        console.warn('Availability matched but no push device exists', {
          watchId: watch.id,

          userId: watch.userId,
        });

        return;
      }

      for (const token of tokens) {
        await this.firebasePushService.sendAvailabilityNotification(token, {
          title: 'Tickets available',

          body: `${watch.experienceTitle} now has availability for ${watch.travellers} ${
            watch.travellers === 1 ? 'traveller' : 'travellers'
          } on ${watch.requestedDate}.`,
        });
      }

      await this.availabilityWatchService.markMatched(watch.id);

      console.log('Availability watch matched and notification sent', {
        watchId: watch.id,

        userId: watch.userId,

        experienceId: watch.experienceId,

        requestedDate: watch.requestedDate,

        travellers: watch.travellers,

        pushDevices: tokens.length,
      });
    } catch (error) {
      console.error('Availability watch check failed', {
        watchId: watch.id,

        experienceId: watch.experienceId,

        error,
      });
    }
  }
  @Cron(CronExpression.EVERY_5_MINUTES)
  async runScheduledCheck(): Promise<void> {
    console.log('Running scheduled availability watch check...');

    await this.checkActiveWatches();
  }
}
