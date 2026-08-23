import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { FirebasePushService } from './firebase-push.service';
import { PushDeviceService } from './push-device.service';

@Module({
  imports: [SupabaseModule],
  providers: [FirebasePushService, PushDeviceService],
  exports: [FirebasePushService, PushDeviceService],
})
export class PushModule {}
