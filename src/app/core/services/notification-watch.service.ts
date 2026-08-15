import { Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';

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
  updatedAt: string;
}

interface AvailabilityWatchRow {
  id: string;

  user_id: string;

  experience_id: string;
  experience_title: string;

  requested_date: string;
  travellers: number;

  status: AvailabilityWatchStatus;

  created_at: string;
  updated_at: string;
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
  constructor(
    private readonly supabaseService:
      SupabaseService,
  ) {}

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
      return await Notification
        .requestPermission();
    } catch {
      return 'denied';
    }
  }

  async createWatch(
    input: CreateAvailabilityWatch,
  ): Promise<AvailabilityWatch> {
    const existing =
      await this.findActiveWatch(
        input.userId,
        input.experienceId,
        input.requestedDate,
        input.travellers,
      );

    if (existing) {
      return existing;
    }

    const {
      data,
      error,
    } =
      await this.supabaseService.client
        .from('availability_watches')
        .insert({
          user_id:
            input.userId,

          experience_id:
            input.experienceId,

          experience_title:
            input.experienceTitle,

          requested_date:
            input.requestedDate,

          travellers:
            input.travellers,

          status:
            'active',
        })
        .select()
        .single();

    if (error) {
      /*
       * Another request could have created the
       * same active watch between our lookup
       * and insert. Try reading it once more
       * before treating the operation as failed.
       */
      const existingAfterInsert =
        await this.findActiveWatch(
          input.userId,
          input.experienceId,
          input.requestedDate,
          input.travellers,
        );

      if (existingAfterInsert) {
        return existingAfterInsert;
      }

      throw new Error(
        `Could not create availability watch: ${error.message}`,
      );
    }

    return this.mapRow(
      data as AvailabilityWatchRow,
    );
  }

  async hasActiveWatch(
    userId: string,
    experienceId: string,
    requestedDate: string,
    travellers: number,
  ): Promise<boolean> {
    const watch =
      await this.findActiveWatch(
        userId,
        experienceId,
        requestedDate,
        travellers,
      );

    return watch !== null;
  }

  async cancelWatch(
    userId: string,
    experienceId: string,
    requestedDate: string,
    travellers: number,
  ): Promise<void> {
    const {
      error,
    } =
      await this.supabaseService.client
        .from('availability_watches')
        .update({
          status:
            'cancelled',

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'user_id',
          userId,
        )
        .eq(
          'experience_id',
          experienceId,
        )
        .eq(
          'requested_date',
          requestedDate,
        )
        .eq(
          'travellers',
          travellers,
        )
        .eq(
          'status',
          'active',
        );

    if (error) {
      throw new Error(
        `Could not cancel availability watch: ${error.message}`,
      );
    }
  }

  async getActiveWatches(
    userId: string,
  ): Promise<AvailabilityWatch[]> {
    const {
      data,
      error,
    } =
      await this.supabaseService.client
        .from('availability_watches')
        .select('*')
        .eq(
          'user_id',
          userId,
        )
        .eq(
          'status',
          'active',
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        );

    if (error) {
      throw new Error(
        `Could not load availability watches: ${error.message}`,
      );
    }

    return (
      (
        data ??
        []
      ) as AvailabilityWatchRow[]
    ).map(
      (row) =>
        this.mapRow(row),
    );
  }

  private async findActiveWatch(
    userId: string,
    experienceId: string,
    requestedDate: string,
    travellers: number,
  ): Promise<AvailabilityWatch | null> {
    const {
      data,
      error,
    } =
      await this.supabaseService.client
        .from('availability_watches')
        .select('*')
        .eq(
          'user_id',
          userId,
        )
        .eq(
          'experience_id',
          experienceId,
        )
        .eq(
          'requested_date',
          requestedDate,
        )
        .eq(
          'travellers',
          travellers,
        )
        .eq(
          'status',
          'active',
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        `Could not load availability watch: ${error.message}`,
      );
    }

    if (!data) {
      return null;
    }

    return this.mapRow(
      data as AvailabilityWatchRow,
    );
  }

  private mapRow(
    row: AvailabilityWatchRow,
  ): AvailabilityWatch {
    return {
      id:
        row.id,

      userId:
        row.user_id,

      experienceId:
        row.experience_id,

      experienceTitle:
        row.experience_title,

      requestedDate:
        row.requested_date,

      travellers:
        row.travellers,

      status:
        row.status,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }
}