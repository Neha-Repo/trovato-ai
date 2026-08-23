import { Injectable } from '@angular/core';

import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class PushDeviceService {
  constructor(
    private readonly supabaseService:
      SupabaseService,
  ) {}

  async saveDevice(
    userId: string,
    token: string,
    platform:
      | 'android'
      | 'ios'
      | 'web',
  ): Promise<void> {
    const {
      error,
    } =
      await this.supabaseService.client
        .from('push_devices')
        .upsert(
          {
            user_id:
              userId,

            token,

            platform,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              'token',
          },
        );

    if (error) {
      throw new Error(
        `Could not save push device: ${error.message}`,
      );
    }
  }
}