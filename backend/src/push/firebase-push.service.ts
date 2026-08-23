import { Injectable, OnModuleInit } from '@nestjs/common';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

interface PushNotificationOptions {
  title: string;
  body: string;

  data?: Record<string, string>;
}

@Injectable()
export class FirebasePushService implements OnModuleInit {
  private app: App | null = null;

  onModuleInit(): void {
    const serviceAccountPath = process.env['FIREBASE_SERVICE_ACCOUNT_PATH'];

    if (!serviceAccountPath) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not configured.');
    }

    const absolutePath = resolve(process.cwd(), serviceAccountPath);

    const raw = readFileSync(absolutePath, 'utf8');

    const serviceAccount = JSON.parse(raw) as FirebaseServiceAccount;

    this.app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert({
              projectId: serviceAccount.project_id,

              clientEmail: serviceAccount.client_email,

              privateKey: serviceAccount.private_key,
            }),
          });
  }

  async sendAvailabilityNotification(
    token: string,
    options: PushNotificationOptions,
  ): Promise<string> {
    if (!this.app) {
      throw new Error('Firebase Admin is not initialized.');
    }

    return getMessaging(this.app).send({
      token,

      notification: {
        title: options.title,

        body: options.body,
      },

      data: options.data,

      android: {
        priority: 'high',

        notification: {
          channelId: 'availability-alerts',
        },
      },
    });
  }
}
