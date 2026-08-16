import { Controller, Post } from '@nestjs/common';

import { AvailabilityWatchCheckerService } from './availability-watch-checker.service';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly availabilityWatchCheckerService: AvailabilityWatchCheckerService,
  ) {}

  @Post('check')
  async checkAlerts(): Promise<{
    success: true;
  }> {
    await this.availabilityWatchCheckerService.checkActiveWatches();

    return {
      success: true,
    };
  }
}
