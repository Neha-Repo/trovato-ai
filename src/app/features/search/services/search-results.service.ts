import { Injectable } from '@angular/core';

import {
  AvailabilitySlot,
  AvailableDate,
  SearchResult,
  SearchResultState,
  SuggestedExperience,
} from '../models/search-result.model';

interface SearchRequest {
  requestedDate: string;
  requestedTicketCount: number;
}

interface ProviderAvailability {
  providerError: boolean;
  requestedDate: string;
  requestedDateSlots: AvailabilitySlot[];
  alternateDates: AvailableDate[];
}

interface NormalizedDate {
  key: string;
  displayDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class SearchResultsService {
  private readonly bookingUrl =
    'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei';

  private readonly defaultRequest: SearchRequest = {
    requestedDate: '3 August 2026',
    requestedTicketCount: 3,
  };

  private readonly suggestedExperiences: SuggestedExperience[] = [
    {
      id: 'castel-sant-angelo',
      title: 'Castel Sant’Angelo',
      location: 'Rome',
      imageUrl: 'assets/images/castel-sant-angelo.jpg',
    },
    {
      id: 'borghese-gallery',
      title: 'Borghese Gallery',
      location: 'Rome',
      imageUrl: 'assets/images/borghese-gallery.jpg',
    },
    {
      id: 'capitoline-museums',
      title: 'Capitoline Museums',
      location: 'Rome',
      imageUrl: 'assets/images/capitoline-museums.jpg',
    },
  ];

  search(request: SearchRequest = this.defaultRequest): SearchResult {
    const providerAvailability =
      this.getMockProviderAvailability(request.requestedDate);

    const normalizedRequest: SearchRequest = {
      requestedDate: providerAvailability.requestedDate,
      requestedTicketCount: request.requestedTicketCount,
    };

    if (providerAvailability.providerError) {
      return this.createResult({
        request: normalizedRequest,
        state: 'provider-error',
        requestedDateSlots: [],
        alternateDates: [],
        errorMessage:
          'We could not retrieve live availability right now. Please try again shortly.',
      });
    }

    const requestedDateSlots = this.filterBookableSlots(
      providerAvailability.requestedDateSlots,
      request.requestedTicketCount,
    );

    const alternateDates = providerAvailability.alternateDates
      .map((availableDate) => ({
        ...availableDate,
        slots: this.filterBookableSlots(
          availableDate.slots,
          request.requestedTicketCount,
        ),
      }))
      .filter((availableDate) => availableDate.slots.length > 0);

    const alternateDateSlots =
      providerAvailability.alternateDates.reduce<AvailabilitySlot[]>(
        (slots, availableDate) => [
          ...slots,
          ...availableDate.slots,
        ],
        [],
      );

    const allProviderSlots = [
      ...providerAvailability.requestedDateSlots,
      ...alternateDateSlots,
    ];

    const largestAvailableGroupSize =
      this.getLargestAvailableGroupSize(allProviderSlots);

    const state = this.determineState({
      requestedDateSlots,
      alternateDates,
      largestAvailableGroupSize,
      requestedTicketCount: request.requestedTicketCount,
    });

    return this.createResult({
      request: normalizedRequest,
      state,
      requestedDateSlots,
      alternateDates,
      largestAvailableGroupSize,
      suggestedExperiences:
        state === 'no-availability' ||
        state === 'group-too-large'
          ? this.suggestedExperiences
          : undefined,
    });
  }

  private determineState(options: {
    requestedDateSlots: AvailabilitySlot[];
    alternateDates: AvailableDate[];
    largestAvailableGroupSize: number;
    requestedTicketCount: number;
  }): SearchResultState {
    const {
      requestedDateSlots,
      alternateDates,
      largestAvailableGroupSize,
      requestedTicketCount,
    } = options;

    if (requestedDateSlots.length > 0) {
      return 'available';
    }

    if (alternateDates.length > 0) {
      return 'alternate-dates';
    }

    if (
      largestAvailableGroupSize > 0 &&
      largestAvailableGroupSize < requestedTicketCount
    ) {
      return 'group-too-large';
    }

    return 'no-availability';
  }

  private createResult(options: {
    request: SearchRequest;
    state: SearchResultState;
    requestedDateSlots: AvailabilitySlot[];
    alternateDates: AvailableDate[];
    largestAvailableGroupSize?: number;
    errorMessage?: string;
    suggestedExperiences?: SuggestedExperience[];
  }): SearchResult {
    return {
      id: 'vatican-museums',
      title: 'Vatican Museums',
      location: 'Vatican City, Rome',
      imageUrl: 'assets/images/vatican-museums.jpg',

      requestedDate: options.request.requestedDate,
      requestedTicketCount:
        options.request.requestedTicketCount,

      state: options.state,

      requestedDateSlots: options.requestedDateSlots,
      alternateDates: options.alternateDates,

      largestAvailableGroupSize:
        options.largestAvailableGroupSize,
      errorMessage: options.errorMessage,
      suggestedExperiences:
        options.suggestedExperiences,
    };
  }

  private filterBookableSlots(
    slots: AvailabilitySlot[],
    requestedTicketCount: number,
  ): AvailabilitySlot[] {
    return slots.filter(
      (slot) =>
        slot.availableTickets >= requestedTicketCount,
    );
  }

  private getLargestAvailableGroupSize(
    slots: AvailabilitySlot[],
  ): number {
    if (slots.length === 0) {
      return 0;
    }

    return Math.max(
      ...slots.map((slot) => slot.availableTickets),
    );
  }

  private getMockProviderAvailability(
    requestedDate: string,
  ): ProviderAvailability {
    const normalizedDate = this.normalizeDate(requestedDate);

    if (normalizedDate.key === '1-january-2027') {
      return {
        providerError: true,
        requestedDate: normalizedDate.displayDate,
        requestedDateSlots: [],
        alternateDates: [],
      };
    }

    if (normalizedDate.key === '31-december-2026') {
      return {
        providerError: false,
        requestedDate: normalizedDate.displayDate,
        requestedDateSlots: [],
        alternateDates: [],
      };
    }

    const inventory = this.createMockInventory();

    const requestedDateSlots =
      inventory[normalizedDate.key] ?? [];

    const alternateDates = this.getAlternateDates(
      normalizedDate.key,
      inventory,
    );

    return {
      providerError: false,
      requestedDate: normalizedDate.displayDate,
      requestedDateSlots,
      alternateDates,
    };
  }

  private createMockInventory(): Record<
    string,
    AvailabilitySlot[]
  > {
    return {
      '3-august-2026': [
        this.createSlot(
          'vatican-2026-08-03-0900',
          '9:00 AM',
          2,
          18,
        ),
        this.createSlot(
          'vatican-2026-08-03-1100',
          '11:00 AM',
          5,
          20,
        ),
        this.createSlot(
          'vatican-2026-08-03-1400',
          '2:00 PM',
          8,
          24,
        ),
      ],

      '4-august-2026': [
        this.createSlot(
          'vatican-2026-08-04-0900',
          '9:00 AM',
          6,
          20,
        ),
        this.createSlot(
          'vatican-2026-08-04-1300',
          '1:00 PM',
          10,
          22,
        ),
      ],

      '5-august-2026': [],

      '6-august-2026': [
        this.createSlot(
          'vatican-2026-08-06-1200',
          '12:00 PM',
          9,
          24,
        ),
      ],
    };
  }

  private getAlternateDates(
    requestedDateKey: string,
    inventory: Record<string, AvailabilitySlot[]>,
  ): AvailableDate[] {
    const dateOrder = [
      {
        key: '3-august-2026',
        displayDate: '3 August 2026',
      },
      {
        key: '4-august-2026',
        displayDate: '4 August 2026',
      },
      {
        key: '5-august-2026',
        displayDate: '5 August 2026',
      },
      {
        key: '6-august-2026',
        displayDate: '6 August 2026',
      },
    ];

    return dateOrder
      .filter((date) => date.key !== requestedDateKey)
      .map((date) => ({
        date: date.displayDate,
        slots: inventory[date.key] ?? [],
      }))
      .filter((date) => date.slots.length > 0)
      .slice(0, 3);
  }

  private normalizeDate(value: string): NormalizedDate {
    const normalizedValue = value
      .trim()
      .toLowerCase()
      .replace(/,/g, '')
      .replace(/\s+/g, ' ');

    if (normalizedValue === 'today') {
      return {
        key: '3-august-2026',
        displayDate: '3 August 2026',
      };
    }

    if (normalizedValue === 'tomorrow') {
      return {
        key: '4-august-2026',
        displayDate: '4 August 2026',
      };
    }

    const monthNames: Record<string, string> = {
      jan: 'january',
      january: 'january',
      feb: 'february',
      february: 'february',
      mar: 'march',
      march: 'march',
      apr: 'april',
      april: 'april',
      may: 'may',
      jun: 'june',
      june: 'june',
      jul: 'july',
      july: 'july',
      aug: 'august',
      august: 'august',
      sep: 'september',
      september: 'september',
      oct: 'october',
      october: 'october',
      nov: 'november',
      november: 'november',
      dec: 'december',
      december: 'december',
    };

    const dayMonthMatch = normalizedValue.match(
      /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/,
    );

    const monthDayMatch = normalizedValue.match(
      /^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/,
    );

    let day: string;
    let monthInput: string;
    let year: string;

    if (dayMonthMatch) {
      day = dayMonthMatch[1];
      monthInput = dayMonthMatch[2];
      year = dayMonthMatch[3] ?? '2026';
    } else if (monthDayMatch) {
      monthInput = monthDayMatch[1];
      day = monthDayMatch[2];
      year = monthDayMatch[3] ?? '2026';
    } else {
      return {
        key: normalizedValue.replace(/\s+/g, '-'),
        displayDate: value,
      };
    }

    const month = monthNames[monthInput];

    if (!month) {
      return {
        key: normalizedValue.replace(/\s+/g, '-'),
        displayDate: value,
      };
    }

    const normalizedDay = String(Number(day));
    const capitalizedMonth =
      month.charAt(0).toUpperCase() + month.slice(1);

    return {
      key: `${normalizedDay}-${month}-${year}`,
      displayDate: `${normalizedDay} ${capitalizedMonth} ${year}`,
    };
  }

  private createSlot(
    id: string,
    time: string,
    availableTickets: number,
    pricePerPerson: number,
  ): AvailabilitySlot {
    return {
      id,
      time,
      availableTickets,
      pricePerPerson,
      bookingUrl: this.bookingUrl,
    };
  }
}