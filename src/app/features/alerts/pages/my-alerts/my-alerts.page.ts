import {
  Component,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
} from '@ionic/angular/standalone';

import {
  AuthService,
} from '../../../../core/services/auth.service';
import {
  AvailabilityWatch,
  NotificationWatchService,
} from '../../../../core/services/notification-watch.service';
import {
  MenuButtonComponent,
} from '../../../../shared/components/menu-button/menu-button.component';

@Component({
  selector: 'app-my-alerts',
  templateUrl: './my-alerts.page.html',
  styleUrls: ['./my-alerts.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    MenuButtonComponent,
  ],
})
export class MyAlertsPage implements OnInit {
  watches: AvailabilityWatch[] = [];

  isLoading = true;

  cancellingWatchId:
    string | null = null;

  errorMessage:
    string | null = null;

  constructor(
    private readonly authService:
      AuthService,

    private readonly notificationWatchService:
      NotificationWatchService,

    private readonly router:
      Router,
  ) {}

  async ngOnInit():
    Promise<void> {
    await this.authService.initialize();

    await this.loadWatches();
  }

  async cancelWatch(
    watch: AvailabilityWatch,
  ): Promise<void> {
    if (this.cancellingWatchId) {
      return;
    }

    this.cancellingWatchId =
      watch.id;

    this.errorMessage =
      null;

    try {
      await this.notificationWatchService
        .cancelWatch(
          watch.userId,
          watch.experienceId,
          watch.requestedDate,
          watch.travellers,
        );

      this.watches =
        this.watches.filter(
          (item) =>
            item.id !== watch.id,
        );
    } catch (error) {
      console.error(
        'Could not cancel availability watch',
        error,
      );

      this.errorMessage =
        'We could not cancel this alert. Please try again.';
    } finally {
      this.cancellingWatchId =
        null;
    }
  }

  goToChat(): void {
    void this.router.navigate([
      '/chat',
    ]);
  }

  formatDate(
    value: string,
  ): string {
    const [
      year,
      month,
      day,
    ] = value
      .split('-')
      .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day,
      );

    return new Intl
      .DateTimeFormat(
        'en-GB',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      )
      .format(date);
  }

  private async loadWatches():
    Promise<void> {
    this.isLoading = true;

    this.errorMessage =
      null;

    const user =
      this.authService
        .getCurrentUser();

    if (!user) {
      this.isLoading = false;

      this.watches = [];

      return;
    }

    try {
      this.watches =
        await this.notificationWatchService
          .getActiveWatches(
            user.id,
          );
    } catch (error) {
      console.error(
        'Could not load availability watches',
        error,
      );

      this.errorMessage =
        'We could not load your alerts. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}