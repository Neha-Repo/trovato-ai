import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseMessagingError } from 'firebase-admin/messaging';

import { AvailabilityService } from '../availability/availability.service';
import { FirebasePushService } from '../push/firebase-push.service';
import { PushDeviceService } from '../push/push-device.service';
import {
  AvailabilityWatch,
  AvailabilityWatchService,
} from './availability-watch.service';

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
          experienceId: watch.experienceId,
        });

        return;
      }

      let sentSuccessfully = false;

      for (const token of tokens) {
        try {
          await this.firebasePushService.sendAvailabilityNotification(token, {
            title: 'Availability found',

            body: `${watch.experienceTitle} now shows availability on ${watch.requestedDate}. Check the booking provider for current capacity.`,

            data: {
              type: 'availability-match',
              watchId: watch.id,
              experienceId: watch.experienceId,
              experienceTitle: watch.experienceTitle,
              requestedDate: watch.requestedDate,
              travellers: String(watch.travellers),
            },
          });

          sentSuccessfully = true;
        } catch (error: unknown) {
          if (
            error instanceof FirebaseMessagingError &&
            (error.code === 'messaging/registration-token-not-registered' ||
              error.code === 'messaging/invalid-registration-token')
          ) {
            await this.pushDeviceService.removeToken(token);

            continue;
          }

          console.error('Push notification failed', {
            watchId: watch.id,
            experienceId: watch.experienceId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      if (!sentSuccessfully) {
        return;
      }

      await this.availabilityWatchService.markMatched(watch.id);
    } catch (error: unknown) {
      console.error('Availability watch check failed', {
        watchId: watch.id,
        experienceId: watch.experienceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runScheduledCheck(): Promise<void> {
    await this.checkActiveWatches();
  }
}
