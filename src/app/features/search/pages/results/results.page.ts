import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

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
  ) {
    this.result = this.searchResultsService.getAvailableResult();
    this.selectedDate = this.result.requestedDate;
    this.selectedSlots = this.result.requestedDateSlots;
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
}