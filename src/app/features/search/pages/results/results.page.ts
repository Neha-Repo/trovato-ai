import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { SearchRequest } from '../../../../core/services/chat-api.service';
import {
  AvailabilitySlot,
  AvailableDate,
  SearchResult,
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
  readonly result: SearchResult;

  selectedDate: string;
  selectedSlots: AvailabilitySlot[];

  constructor(
    private readonly searchResultsService: SearchResultsService,
    private readonly router: Router,
  ) {
    const navigation = this.router.getCurrentNavigation();

    const search = navigation?.extras.state?.['search'] as
      | SearchRequest
      | undefined;

    this.result = this.searchResultsService.search(
      search
        ? {
            experience: search.experience,
            city: search.city,
            requestedDate: search.date,
            requestedTicketCount: search.travellers,
          }
        : undefined,
    );

    this.selectedDate = this.result.requestedDate;
    this.selectedSlots = this.result.requestedDateSlots;
  }

  get hasAlternateDates(): boolean {
    return this.result.alternateDates.some(
      (date) => date.slots.length > 0,
    );
  }

  get hasSuggestedExperiences(): boolean {
    return (this.result.suggestedExperiences?.length ?? 0) > 0;
  }

  get isRequestedDateSelected(): boolean {
    return this.selectedDate === this.result.requestedDate;
  }

  selectRequestedDate(): void {
    this.selectedDate = this.result.requestedDate;
    this.selectedSlots = this.result.requestedDateSlots;
  }

  selectAlternateDate(date: AvailableDate): void {
    this.selectedDate = date.date;
    this.selectedSlots = date.slots;
  }

  continueBooking(slot: AvailabilitySlot): void {
    window.open(slot.bookingUrl, '_blank', 'noopener,noreferrer');
  }

  notifyMe(): void {
    console.log('Notification requested', {
      experienceId: this.result.id,
      date: this.result.requestedDate,
      ticketCount: this.result.requestedTicketCount,
    });
  }

  retryAvailability(): void {
    window.location.reload();
  }

  goBackToChat(): void {
    void this.router.navigate(['/chat']);
  }
}