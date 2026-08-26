import { Module } from '@nestjs/common';

import { AvailabilityModule } from '../availability/availability.module';
import { PushModule } from '../push/push.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AvailabilityWatchCheckerService } from './availability-watch-checker.service';
import { AvailabilityWatchService } from './availability-watch.service';

@Module({
  imports: [SupabaseModule, AvailabilityModule, PushModule],
  providers: [AvailabilityWatchService, AvailabilityWatchCheckerService],
  exports: [AvailabilityWatchService, AvailabilityWatchCheckerService],
})
export class AlertsModule {}
