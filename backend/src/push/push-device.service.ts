import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';

interface PushDeviceRow {
  token: string;
  platform: 'android' | 'ios' | 'web';
}

@Injectable()
export class PushDeviceService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getTokensForUser(userId: string): Promise<string[]> {
    const { data, error } = await this.supabaseService.client
      .from('push_devices')
      .select('token, platform')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Could not load push devices: ${error.message}`);
    }

    return ((data ?? []) as PushDeviceRow[])
      .filter(
        (device) => device.platform === 'android' || device.platform === 'ios',
      )
      .map((device) => device.token);
  }
}
