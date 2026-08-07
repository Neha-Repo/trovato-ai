import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { SearchRequest } from '../../../../core/services/chat-api.service';
import {
  AvailabilitySlot,
  AvailableDate,
  SearchResult,
  SuggestedExperience,
} from '../../models/search-result.model';
import { SearchResultsService } from '../../services/search-results.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
  standalone: true,
  imports: [IonContent],
})
export class ResultsPage {
  private readonly searchStorageKey =
    'trovato-active-search';

  result: SearchResult;

  selectedDate: string;
  selectedSlots: AvailabilitySlot[];

  constructor(
    private readonly searchResultsService:
      SearchResultsService,
    private readonly router: Router,
  ) {
    const navigation =
      this.router.getCurrentNavigation();

    const navigationSearch =
      navigation?.extras.state?.[
        'search'
      ] as SearchRequest | undefined;

    const search =
      navigationSearch ??
      this.readStoredSearch();

    if (search) {
      this.storeSearch(search);
    }

    this.result =
      this.searchResultsService.search(
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
      this.result.requestedDateSlots;
  }

  get hasAlternateDates(): boolean {
    return this.result.alternateDates.some(
      (date) =>
        date.slots.length > 0,
    );
  }

  get hasSuggestedExperiences(): boolean {
    return (
      this.result
        .suggestedExperiences
        ?.length ?? 0
    ) > 0;
  }

  get isRequestedDateSelected(): boolean {
    return (
      this.selectedDate ===
      this.result.requestedDate
    );
  }

  selectRequestedDate(): void {
    this.selectedDate =
      this.result.requestedDate;

    this.selectedSlots =
      this.result.requestedDateSlots;
  }

  selectAlternateDate(
    date: AvailableDate,
  ): void {
    this.selectedDate = date.date;
    this.selectedSlots = date.slots;
  }

  selectSuggestedExperience(
    experience: SuggestedExperience,
  ): void {
    const nextSearch: SearchRequest = {
      experience:
        experience.title,

      city:
        experience.city,

      date:
        this.result.requestedDate,

      travellers:
        this.result
          .requestedTicketCount,
    };

    this.storeSearch(nextSearch);

    const nextResult =
      this.searchResultsService.search({
        experience:
          nextSearch.experience,

        city:
          nextSearch.city,

        requestedDate:
          nextSearch.date,

        requestedTicketCount:
          nextSearch.travellers,
      });

    this.result = nextResult;

    if (
      nextResult.state ===
        'alternate-dates' &&
      nextResult.alternateDates.length > 0
    ) {
      const firstAvailableDate =
        nextResult.alternateDates[0];

      this.selectedDate =
        firstAvailableDate.date;

      this.selectedSlots =
        firstAvailableDate.slots;
    } else {
      this.selectedDate =
        nextResult.requestedDate;

      this.selectedSlots =
        nextResult.requestedDateSlots;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  continueBooking(
    slot: AvailabilitySlot,
  ): void {
    window.open(
      slot.bookingUrl,
      '_blank',
      'noopener,noreferrer',
    );
  }

  notifyMe(): void {
    console.log(
      'Notification requested',
      {
        experienceId:
          this.result.id,

        date:
          this.result.requestedDate,

        ticketCount:
          this.result
            .requestedTicketCount,
      },
    );
  }

  retryAvailability(): void {
    if (
      this.result.state ===
      'unsupported-experience'
    ) {
      this.goBackToChat();
      return;
    }

    const search: SearchRequest = {
      experience:
        this.result.title,

      city:
        this.result.city,

      date:
        this.result.requestedDate,

      travellers:
        this.result
          .requestedTicketCount,
    };

    this.storeSearch(search);

    const nextResult =
      this.searchResultsService.search({
        experience:
          search.experience,

        city:
          search.city,

        requestedDate:
          search.date,

        requestedTicketCount:
          search.travellers,
      });

    this.result = nextResult;

    this.selectedDate =
      nextResult.requestedDate;

    this.selectedSlots =
      nextResult.requestedDateSlots;
  }

  goBackToChat(): void {
    void this.router.navigate([
      '/chat',
    ]);
  }

  private storeSearch(
    search: SearchRequest,
  ): void {
    try {
      sessionStorage.setItem(
        this.searchStorageKey,
        JSON.stringify(search),
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