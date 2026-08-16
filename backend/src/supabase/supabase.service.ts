import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env['SUPABASE_URL'];

    const supabaseSecretKey = process.env['SUPABASE_SECRET_KEY'];

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured.');
    }

    if (!supabaseSecretKey) {
      throw new Error('SUPABASE_SECRET_KEY is not configured.');
    }

    this.client = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
}
