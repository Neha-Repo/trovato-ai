import {
  Component,
  OnInit,
} from '@angular/core';
import {
  Router,
} from '@angular/router';
import {
  IonContent,
} from '@ionic/angular/standalone';

import {
  AuthService,
} from '../../../../core/services/auth.service';
import {
  NotificationWatchService,
  PushPermissionStatus,
} from '../../../../core/services/notification-watch.service';
import {
  SearchRequest,
} from '../../../../core/services/chat-api.service';
import {
  MenuButtonComponent,
} from '../../../../shared/components/menu-button/menu-button.component';
import {
  AvailabilitySlot,
  AvailableDate,
  SearchResult,
  SuggestedExperience,
} from '../../models/search-result.model';
import {
  SearchResultsService,
} from '../../services/search-results.service';

type NotifySetupState =
  | 'auth'
  | 'permission'
  | 'denied'
  | 'unsupported'
  | 'active'
  | null;

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    MenuButtonComponent,
  ],
})
export class ResultsPage implements OnInit {
  private readonly searchStorageKey =
    'trovato-active-search';

  private readonly pendingNotifyStorageKey =
    'trovato-pending-notify';

  readonly fallbackImageUrl =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1200"
        height="800"
        viewBox="0 0 1200 800"
      >
        <defs>
          <linearGradient
            id="background"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stop-color="#13203a"
            />
            <stop
              offset="100%"
              stop-color="#07101f"
            />
          </linearGradient>
        </defs>

        <rect
          width="1200"
          height="800"
          fill="url(#background)"
        />

        <circle
          cx="930"
          cy="160"
          r="220"
          fill="#4f7cff"
          opacity="0.18"
        />

        <text
          x="600"
          y="390"
          fill="#ffffff"
          font-family="Arial, sans-serif"
          font-size="56"
          font-weight="700"
          text-anchor="middle"
        >
          Trovato AI
        </text>

        <text
          x="600"
          y="455"
          fill="#aab9d4"
          font-family="Arial, sans-serif"
          font-size="30"
          text-anchor="middle"
        >
          Experience image unavailable
        </text>
      </svg>
    `);

  /*
   * Safe initial value while the first
   * backend availability request is running.
   *
   * The real result replaces this during
   * ngOnInit().
   */
  result: SearchResult = {
    id: 'loading',

    title:
      'Checking availability',

    city: '',

    location: '',

    requestedDate: '',

    requestedTicketCount: 0,

    state:
      'no-availability',

    requestedDateSlots: [],

    alternateDates: [],
  };

  selectedDate = '';

  selectedSlots:
    AvailabilitySlot[] = [];

  openingSlotId:
    string | null = null;

  isChangingExperience = false;

  isLoadingResults = true;

  notifySetupState:
    NotifySetupState = null;

  isRequestingPushPermission =
    false;

  isAuthInitializing =
    true;

  hasActiveNotification =
    false;

  constructor(
    private readonly searchResultsService:
      SearchResultsService,

    private readonly router:
      Router,

    private readonly authService:
      AuthService,

    private readonly notificationWatchService:
      NotificationWatchService,
  ) {}

  async ngOnInit():
    Promise<void> {
    const navigation =
      this.router
        .getCurrentNavigation();

    const navigationSearch =
      navigation?.extras.state?.[
        'search'
      ] as
        | SearchRequest
        | undefined;

    const search =
      navigationSearch ??
      this.readStoredSearch();

    if (search) {
      this.storeSearch(search);
    }

    try {
      this.result =
        await this.searchResultsService
          .search(
            search
              ? {
                  experience:
                    search.experience,

                  city:
                    search.city,

                  requestedDate:
                    search.date,

                  requestedTicketCount:
                    search.travellers,
                }
              : undefined,
          );

      this.selectedDate =
        this.result.requestedDate;

      this.selectedSlots =
        this.result
          .requestedDateSlots;
    } finally {
      this.isLoadingResults =
        false;
    }

    await this.authService
      .initialize();

    this.isAuthInitializing =
      false;

    await this
      .syncNotificationState();

    if (
      this.authService
        .isAuthenticated() &&
      this.hasPendingNotifyIntent()
    ) {
      this.clearPendingNotifyIntent();

      this.continueNotifySetup();
    }
  }

  get hasAlternateDates():
    boolean {
    return this.result
      .alternateDates
      .some(
        (date) =>
          date.slots.length > 0,
      );
  }

  get hasSuggestedExperiences():
    boolean {
    return (
      this.result
        .suggestedExperiences
        ?.length ?? 0
    ) > 0;
  }

  get isRequestedDateSelected():
    boolean {
    return (
      this.selectedDate ===
      this.result.requestedDate
    );
  }

  get notificationButtonLabel():
    string {
    if (this.isAuthInitializing) {
      return 'Checking account…';
    }

    return this.hasActiveNotification
      ? 'Notification active'
      : 'Notify me';
  }

  selectRequestedDate(): void {
    this.selectedDate =
      this.result.requestedDate;

    this.selectedSlots =
      this.result
        .requestedDateSlots;
  }

  selectAlternateDate(
    date: AvailableDate,
  ): void {
    this.selectedDate =
      date.date;

    this.selectedSlots =
      date.slots;
  }

  async selectSuggestedExperience(
    experience:
      SuggestedExperience,
  ): Promise<void> {
    if (
      this.isChangingExperience
    ) {
      return;
    }

    this.isChangingExperience =
      true;

    const nextSearch:
      SearchRequest = {
      experience:
        experience.title,

      city:
        experience.city,

      date:
        this.result
          .requestedDate,

      travellers:
        this.result
          .requestedTicketCount,
    };

    this.storeSearch(
      nextSearch,
    );

    try {
      const nextResult =
        await this.searchResultsService
          .search({
            experience:
              nextSearch.experience,

            city:
              nextSearch.city,

            requestedDate:
              nextSearch.date,

            requestedTicketCount:
              nextSearch.travellers,
          });

      this.result =
        nextResult;

      if (
        nextResult.state ===
          'alternate-dates' &&
        nextResult
          .alternateDates
          .length > 0
      ) {
        const firstAvailableDate =
          nextResult
            .alternateDates[0];

        this.selectedDate =
          firstAvailableDate.date;

        this.selectedSlots =
          firstAvailableDate.slots;
      } else {
        this.selectedDate =
          nextResult.requestedDate;

        this.selectedSlots =
          nextResult
            .requestedDateSlots;
      }

      this.notifySetupState =
        null;

      await this
        .syncNotificationState();

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } finally {
      this.isChangingExperience =
        false;
    }
  }

  continueBooking(
    slot: AvailabilitySlot,
  ): void {
    if (this.openingSlotId) {
      return;
    }

    this.openingSlotId =
      slot.id;

    window.open(
      slot.bookingUrl,
      '_blank',
      'noopener,noreferrer',
    );

    window.setTimeout(() => {
      this.openingSlotId =
        null;
    }, 900);
  }

  notifyMe(): void {
    if (
      this.isAuthInitializing ||
      this.isLoadingResults
    ) {
      return;
    }

    if (
      this.hasActiveNotification
    ) {
      this.notifySetupState =
        'active';

      return;
    }

    if (
      !this.authService
        .isAuthenticated()
    ) {
      this.notifySetupState =
        'auth';

      return;
    }

    this.continueNotifySetup();
  }

  async signInAndContinue():
    Promise<void> {
    this.storePendingNotifyIntent();

    try {
      await this.authService
        .signInWithGoogle();
    } catch (error) {
      console.error(
        'Google sign-in failed',
        error,
      );

      this.clearPendingNotifyIntent();
    }
  }

  async enablePushNotifications():
    Promise<void> {
    if (
      this.isRequestingPushPermission
    ) {
      return;
    }

    this.isRequestingPushPermission =
      true;

    try {
      const permission =
        await this
          .notificationWatchService
          .requestPushPermission();

      this.handlePushPermission(
        permission,
      );
    } finally {
      this.isRequestingPushPermission =
        false;
    }
  }

  closeNotifySetup(): void {
    this.notifySetupState =
      null;
  }

  async retryAvailability():
    Promise<void> {
    if (
      this.result.state ===
      'unsupported-experience'
    ) {
      this.goBackToChat();
      return;
    }

    const search:
      SearchRequest = {
      experience:
        this.result.title,

      city:
        this.result.city,

      date:
        this.result
          .requestedDate,

      travellers:
        this.result
          .requestedTicketCount,
    };

    this.storeSearch(search);

    this.isLoadingResults =
      true;

    try {
      const nextResult =
        await this.searchResultsService
          .search({
            experience:
              search.experience,

            city:
              search.city,

            requestedDate:
              search.date,

            requestedTicketCount:
              search.travellers,
          });

      this.result =
        nextResult;

      this.selectedDate =
        nextResult.requestedDate;

      this.selectedSlots =
        nextResult
          .requestedDateSlots;

      await this
        .syncNotificationState();
    } finally {
      this.isLoadingResults =
        false;
    }
  }

  changeSearch(): void {
    this.goBackToChat();
  }

  goBackToChat(): void {
    void this.router.navigate([
      '/chat',
    ]);
  }

  handleImageError(
    event: Event,
  ): void {
    const image =
      event.target as
        HTMLImageElement;

    if (
      image.src ===
      this.fallbackImageUrl
    ) {
      return;
    }

    image.src =
      this.fallbackImageUrl;
  }

  private continueNotifySetup():
    void {
    const permission =
      this.notificationWatchService
        .getPushPermissionStatus();

    this.handlePushPermission(
      permission,
    );
  }

  private handlePushPermission(
    permission:
      PushPermissionStatus,
  ): void {
    switch (permission) {
      case 'granted':
        void this
          .activateNotification();
        return;

      case 'default':
        this.notifySetupState =
          'permission';
        return;

      case 'denied':
        this.notifySetupState =
          'denied';
        return;

      case 'unsupported':
        this.notifySetupState =
          'unsupported';
        return;
    }
  }

  private async activateNotification():
    Promise<void> {
    const user =
      this.authService
        .getCurrentUser();

    if (!user) {
      this.notifySetupState =
        'auth';

      return;
    }

    try {
      await this
        .notificationWatchService
        .createWatch({
          userId:
            user.id,

          experienceId:
            this.result.id,

          experienceTitle:
            this.result.title,

          requestedDate:
            this.result
              .requestedDate,

          travellers:
            this.result
              .requestedTicketCount,
        });

      this.hasActiveNotification =
        true;

      this.notifySetupState =
        'active';
    } catch (error) {
      console.error(
        'Could not create availability watch',
        error,
      );

      this.hasActiveNotification =
        false;

      this.notifySetupState =
        null;
    }
  }

  private async syncNotificationState():
    Promise<void> {
    const user =
      this.authService
        .getCurrentUser();

    if (!user) {
      this.hasActiveNotification =
        false;

      return;
    }

    if (
      this.result.id ===
      'loading'
    ) {
      this.hasActiveNotification =
        false;

      return;
    }

    try {
      this.hasActiveNotification =
        await this
          .notificationWatchService
          .hasActiveWatch(
            user.id,

            this.result.id,

            this.result
              .requestedDate,

            this.result
              .requestedTicketCount,
          );
    } catch (error) {
      console.error(
        'Could not load availability watch',
        error,
      );

      this.hasActiveNotification =
        false;
    }
  }

  private storePendingNotifyIntent():
    void {
    try {
      sessionStorage.setItem(
        this.pendingNotifyStorageKey,
        'true',
      );
    } catch {
      // Session storage is optional.
    }
  }

  private hasPendingNotifyIntent():
    boolean {
    try {
      return (
        sessionStorage.getItem(
          this.pendingNotifyStorageKey,
        ) === 'true'
      );
    } catch {
      return false;
    }
  }

  private clearPendingNotifyIntent():
    void {
    try {
      sessionStorage.removeItem(
        this.pendingNotifyStorageKey,
      );
    } catch {
      // Session storage is optional.
    }
  }

  private storeSearch(
    search: SearchRequest,
  ): void {
    try {
      sessionStorage.setItem(
        this.searchStorageKey,
        JSON.stringify(
          search,
        ),
      );
    } catch {
      // Session storage is optional.
    }
  }

  private readStoredSearch():
    | SearchRequest
    | undefined {
    try {
      const storedValue =
        sessionStorage.getItem(
          this.searchStorageKey,
        );

      if (!storedValue) {
        return undefined;
      }

      return JSON.parse(
        storedValue,
      ) as SearchRequest;
    } catch {
      return undefined;
    }
  }
}