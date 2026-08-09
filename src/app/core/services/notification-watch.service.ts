import { Injectable } from '@angular/core';

export type PushPermissionStatus =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';

export type AvailabilityWatchStatus =
  | 'active'
  | 'matched'
  | 'cancelled';

export interface AvailabilityWatch {
  id: string;

  userId: string;

  experienceId: string;
  experienceTitle: string;

  requestedDate: string;
  travellers: number;

  status: AvailabilityWatchStatus;

  createdAt: string;
}

interface CreateAvailabilityWatch {
  userId: string;

  experienceId: string;
  experienceTitle: string;

  requestedDate: string;
  travellers: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationWatchService {
  private readonly storageKey =
    'trovato-availability-watches';

  getPushPermissionStatus():
    PushPermissionStatus {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    return Notification.permission;
  }

  async requestPushPermission():
    Promise<PushPermissionStatus> {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  createWatch(
    input: CreateAvailabilityWatch,
  ): AvailabilityWatch {
    const existing =
      this.findActiveWatch(
        input.userId,
        input.experienceId,
        input.requestedDate,
        input.travellers,
      );

    if (existing) {
      return existing;
    }

    const watch: AvailabilityWatch = {
      id: crypto.randomUUID(),

      userId: input.userId,

      experienceId:
        input.experienceId,

      experienceTitle:
        input.experienceTitle,

      requestedDate:
        input.requestedDate,

      travellers:
        input.travellers,

      status: 'active',

      createdAt:
        new Date().toISOString(),
    };

    const watches =
      this.readWatches();

    watches.push(watch);

    this.writeWatches(watches);

    return watch;
  }

  hasActiveWatch(
    userId: string,
    experienceId: string,
    requestedDate: string,
    travellers: number,
  ): boolean {
    return (
      this.findActiveWatch(
        userId,
        experienceId,
        requestedDate,
        travellers,
      ) !== null
    );
  }

  cancelWatch(
    userId: string,
    experienceId: string,
    requestedDate: string,
    travellers: number,
  ): void {
    const watches =
      this.readWatches();

    const updated =
      watches.map((watch) => {
        const matches =
          watch.userId === userId &&
          watch.experienceId ===
            experienceId &&
          watch.requestedDate ===
            requestedDate &&
          watch.travellers ===
            travellers &&
          watch.status === 'active';

        return matches
          ? {
              ...watch,
              status:
                'cancelled' as const,
            }
          : watch;
      });

    this.writeWatches(updated);
  }

  private findActiveWatch(
    userId: string,
    experienceId: string,
    requestedDate: string,
    travellers: number,
  ): AvailabilityWatch | null {
    return (
      this.readWatches().find(
        (watch) =>
          watch.userId === userId &&
          watch.experienceId ===
            experienceId &&
          watch.requestedDate ===
            requestedDate &&
          watch.travellers ===
            travellers &&
          watch.status === 'active',
      ) ?? null
    );
  }

  private readWatches():
    AvailabilityWatch[] {
    try {
      const value =
        localStorage.getItem(
          this.storageKey,
        );

      if (!value) {
        return [];
      }

      return JSON.parse(
        value,
      ) as AvailabilityWatch[];
    } catch {
      return [];
    }
  }

  private writeWatches(
    watches: AvailabilityWatch[],
  ): void {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(watches),
      );
    } catch {
      // Local storage is optional.
    }
  }
}