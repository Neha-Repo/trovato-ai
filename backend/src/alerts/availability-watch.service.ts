import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';

export interface AvailabilityWatch {
  id: string;

  userId: string;

  experienceId: string;
  experienceTitle: string;

  requestedDate: string;
  travellers: number;

  status: 'active' | 'matched' | 'cancelled';

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

  status: 'active' | 'matched' | 'cancelled';

  created_at: string;
  updated_at: string;
}

@Injectable()
export class AvailabilityWatchService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getActiveWatches(): Promise<AvailabilityWatch[]> {
    const { data, error } = await this.supabaseService.client
      .from('availability_watches')
      .select('*')
      .eq('status', 'active')
      .order('created_at', {
        ascending: true,
      });

    if (error) {
      throw new Error(
        `Could not load active availability watches: ${error.message}`,
      );
    }

    return ((data ?? []) as AvailabilityWatchRow[]).map((row) =>
      this.mapRow(row),
    );
  }

  async markMatched(watchId: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('availability_watches')
      .update({
        status: 'matched',

        updated_at: new Date().toISOString(),
      })
      .eq('id', watchId)
      .eq('status', 'active');

    if (error) {
      throw new Error(
        `Could not mark availability watch as matched: ${error.message}`,
      );
    }
  }

  private mapRow(row: AvailabilityWatchRow): AvailabilityWatch {
    return {
      id: row.id,

      userId: row.user_id,

      experienceId: row.experience_id,

      experienceTitle: row.experience_title,

      requestedDate: row.requested_date,

      travellers: row.travellers,

      status: row.status,

      createdAt: row.created_at,

      updatedAt: row.updated_at,
    };
  }
}
