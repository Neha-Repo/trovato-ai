import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  PushNotificationActionPerformed,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

import {
  PushPermissionStatus,
} from '../models/push-permission-status';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  constructor(
    private readonly router:
      Router,
  ) {}

  async getPermissionStatus():
    Promise<PushPermissionStatus> {
    const permission =
      await PushNotifications
        .checkPermissions();

    switch (permission.receive) {
      case 'granted':
        return 'granted';

      case 'denied':
        return 'denied';

      case 'prompt':
      case 'prompt-with-rationale':
        return 'default';

      default:
        return 'unsupported';
    }
  }

  async requestPermission():
    Promise<PushPermissionStatus> {
    const permission =
      await PushNotifications
        .requestPermissions();

    switch (permission.receive) {
      case 'granted':
        return 'granted';

      case 'denied':
        return 'denied';

      case 'prompt':
      case 'prompt-with-rationale':
        return 'default';

      default:
        return 'unsupported';
    }
  }

  async register():
    Promise<string | null> {
    const permission =
      await PushNotifications
        .checkPermissions();

    let receive =
      permission.receive;

    if (
      receive === 'prompt' ||
      receive ===
        'prompt-with-rationale'
    ) {
      const requested =
        await PushNotifications
          .requestPermissions();

      receive =
        requested.receive;
    }

    if (
      receive !== 'granted'
    ) {
      return null;
    }

    return new Promise<
      string | null
    >(
      async (
        resolve,
        reject,
      ) => {
        const registrationListener =
          await PushNotifications
            .addListener(
              'registration',
              (
                token: Token,
              ) => {
                

                void registrationListener
                  .remove();

                void errorListener
                  .remove();

                resolve(
                  token.value,
                );
              },
            );

        const errorListener =
          await PushNotifications
            .addListener(
              'registrationError',
              (error) => {
                console.error(
                  'Push registration failed',
                  error,
                );

                void errorListener
                  .remove();

                void registrationListener
                  .remove();

                reject(error);
              },
            );

        await PushNotifications
          .register();
      },
    );
  }
  async initializeAndroidChannel():
  Promise<void> {
  try {
    await PushNotifications.createChannel({
      id: 'availability-alerts',
      name: 'Availability alerts',
      description:
        'Notifications when requested tickets become available.',
      importance: 5,
      visibility: 1,
      vibration: true,
    });
  } catch (error: unknown) {
    console.error(
      'Could not create notification channel',
      error,
    );
  }
}

  async initializeNotificationActions():
    Promise<void> {
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async (
        action:
          PushNotificationActionPerformed,
      ) => {
        const data =
          action.notification.data;

        if (
          data?.['type'] !==
          'availability-match'
        ) {
          return;
        }

        const experience =
          data[
            'experienceTitle'
          ];

        const requestedDate =
          data[
            'requestedDate'
          ];

        const travellers =
          Number(
            data[
              'travellers'
            ],
          );

        if (
          typeof experience !==
            'string' ||
          typeof requestedDate !==
            'string' ||
          !Number.isInteger(
            travellers,
          ) ||
          travellers <= 0
        ) {
          console.error(
            'Invalid availability notification payload',
            data,
          );

          return;
        }

        await this.router.navigate(
  [
    '/results',
    'notification',
    data['watchId'],
  ],
  {
            state: {
              search: {
                experience,
                city: '',
                date:
                  requestedDate,
                travellers,
              },
            },
          },
        );
      },
    );
  }
}