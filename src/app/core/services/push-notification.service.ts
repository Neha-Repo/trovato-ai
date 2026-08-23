import { Injectable } from '@angular/core';
import {
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
                console.log(
                  'FCM TOKEN:',
                  token.value,
                );

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
}