import { Injectable } from '@angular/core';

import {
  AvailabilitySlot,
  AvailableDate,
  SearchResult,
  SearchResultState,
  SuggestedExperience,
} from '../models/search-result.model';
import {
  Experience,
  ExperienceCatalogService,
} from './experience-catalog.service';

interface SearchRequest {
  experience?: string;
  city?: string;
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
  private readonly defaultRequest: SearchRequest = {
    experience: 'Vatican Museums',
    city: 'Rome',
    requestedDate: 'tomorrow',
    requestedTicketCount: 3,
  };

  constructor(
    private readonly experienceCatalogService: ExperienceCatalogService,
  ) {}

  search(request: SearchRequest = this.defaultRequest): SearchResult {
    const experience = this.resolveExperience(request.experience);

    const providerAvailability = this.getMockProviderAvailability(
      request.requestedDate,
      experience.bookingUrl,
      experience.id,
    );

    const normalizedRequest: SearchRequest = {
      ...request,
      experience: experience.title,
      city: request.city ?? experience.city,
      requestedDate: providerAvailability.requestedDate,
    };

    if (providerAvailability.providerError) {
      return this.createResult({
        experience,
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
      experience,
      request: normalizedRequest,
      state,
      requestedDateSlots,
      alternateDates,
      largestAvailableGroupSize,
      suggestedExperiences:
        state === 'no-availability' ||
        state === 'group-too-large'
          ? this.getSuggestedExperiences(
              experience,
              normalizedRequest.city,
            )
          : undefined,
    });
  }

  private resolveExperience(title?: string): Experience {
    const requestedExperience = title
      ? this.experienceCatalogService.getByTitle(title)
      : null;

    if (requestedExperience) {
      return requestedExperience;
    }

    const defaultExperience =
      this.experienceCatalogService.getByTitle(
        'Vatican Museums',
      );

    if (!defaultExperience) {
      throw new Error(
        'Vatican Museums is missing from the experience catalog.',
      );
    }

    return defaultExperience;
  }

  private getSuggestedExperiences(
    experience: Experience,
    city?: string,
  ): SuggestedExperience[] {
    const alternatives =
      this.experienceCatalogService.getAlternatives(
        experience.id,
        city ?? experience.city,
        3,
      );

    return alternatives.map((alternative) => ({
      id: alternative.id,
      title: alternative.title,
      location: alternative.location,
      imageUrl: alternative.imageUrl,
    }));
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
    experience: Experience;
    request: SearchRequest;
    state: SearchResultState;
    requestedDateSlots: AvailabilitySlot[];
    alternateDates: AvailableDate[];
    largestAvailableGroupSize?: number;
    errorMessage?: string;
    suggestedExperiences?: SuggestedExperience[];
  }): SearchResult {
    return {
      id: options.experience.id,
      title: options.experience.title,
      location: options.experience.location,
      imageUrl: options.experience.imageUrl,

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
    bookingUrl: string,
    experienceId: string,
  ): ProviderAvailability {
    const normalizedDate =
      this.normalizeDate(requestedDate);

    /*
     * Temporary deterministic provider-error test.
     */
    if (normalizedDate.key === '1-january-2027') {
      return {
        providerError: true,
        requestedDate: normalizedDate.displayDate,
        requestedDateSlots: [],
        alternateDates: [],
      };
    }

    /*
     * Temporary deterministic no-availability test.
     */
    if (
      normalizedDate.key === '31-december-2026'
    ) {
      return {
        providerError: false,
        requestedDate: normalizedDate.displayDate,
        requestedDateSlots: [],
        alternateDates: [],
      };
    }

    const inventory = this.createMockInventory(
      bookingUrl,
      experienceId,
    );

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

  private getFutureDate(
    daysFromToday: number,
  ): Date {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(
      date.getDate() + daysFromToday,
    );

    return date;
  }

  private createDateInfo(
    date: Date,
  ): NormalizedDate {
    const day = date.getDate();

    const month =
      new Intl.DateTimeFormat('en-GB', {
        month: 'long',
      })
        .format(date)
        .toLowerCase();

    const year = date.getFullYear();

    return {
      key: `${day}-${month}-${year}`,
      displayDate:
        new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(date),
    };
  }

  private createMockInventory(
    bookingUrl: string,
    experienceId: string,
  ): Record<string, AvailabilitySlot[]> {
    const date1 = this.createDateInfo(
      this.getFutureDate(1),
    );

    const date2 = this.createDateInfo(
      this.getFutureDate(2),
    );

    const date3 = this.createDateInfo(
      this.getFutureDate(3),
    );

    const date4 = this.createDateInfo(
      this.getFutureDate(4),
    );

    switch (experienceId) {
      case 'uffizi-gallery':
        return {
          [date1.key]: [
            this.createSlot(
              `${experienceId}-${date1.key}-0830`,
              '8:30 AM',
              4,
              25,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date1.key}-1045`,
              '10:45 AM',
              7,
              29,
              bookingUrl,
            ),
          ],

          [date2.key]: [
            this.createSlot(
              `${experienceId}-${date2.key}-0915`,
              '9:15 AM',
              5,
              25,
              bookingUrl,
            ),
          ],

          [date3.key]: [],

          [date4.key]: [
            this.createSlot(
              `${experienceId}-${date4.key}-1130`,
              '11:30 AM',
              8,
              29,
              bookingUrl,
            ),
          ],
        };

      case 'colosseum':
        return {
          [date1.key]: [
            this.createSlot(
              `${experienceId}-${date1.key}-0900`,
              '9:00 AM',
              10,
              18,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date1.key}-1230`,
              '12:30 PM',
              6,
              22,
              bookingUrl,
            ),
          ],

          [date2.key]: [
            this.createSlot(
              `${experienceId}-${date2.key}-1000`,
              '10:00 AM',
              12,
              20,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date2.key}-1530`,
              '3:30 PM',
              4,
              24,
              bookingUrl,
            ),
          ],

          [date3.key]: [
            this.createSlot(
              `${experienceId}-${date3.key}-1100`,
              '11:00 AM',
              3,
              20,
              bookingUrl,
            ),
          ],

          [date4.key]: [],
        };

      case 'pompeii':
        return {
          [date1.key]: [
            this.createSlot(
              `${experienceId}-${date1.key}-0900`,
              '9:00 AM',
              8,
              20,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date1.key}-1130`,
              '11:30 AM',
              10,
              22,
              bookingUrl,
            ),
          ],

          [date2.key]: [
            this.createSlot(
              `${experienceId}-${date2.key}-1000`,
              '10:00 AM',
              6,
              20,
              bookingUrl,
            ),
          ],

          [date3.key]: [],

          [date4.key]: [
            this.createSlot(
              `${experienceId}-${date4.key}-1300`,
              '1:00 PM',
              12,
              24,
              bookingUrl,
            ),
          ],
        };

      case 'accademia-gallery':
        return {
          [date1.key]: [
            this.createSlot(
              `${experienceId}-${date1.key}-0845`,
              '8:45 AM',
              5,
              18,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date1.key}-1100`,
              '11:00 AM',
              7,
              22,
              bookingUrl,
            ),
          ],

          [date2.key]: [
            this.createSlot(
              `${experienceId}-${date2.key}-0930`,
              '9:30 AM',
              6,
              20,
              bookingUrl,
            ),
          ],

          [date3.key]: [],

          [date4.key]: [
            this.createSlot(
              `${experienceId}-${date4.key}-1430`,
              '2:30 PM',
              8,
              22,
              bookingUrl,
            ),
          ],
        };

      case 'borghese-gallery':
        return {
          [date1.key]: [
            this.createSlot(
              `${experienceId}-${date1.key}-0900`,
              '9:00 AM',
              4,
              17,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date1.key}-1300`,
              '1:00 PM',
              6,
              20,
              bookingUrl,
            ),
          ],

          [date2.key]: [
            this.createSlot(
              `${experienceId}-${date2.key}-1100`,
              '11:00 AM',
              5,
              19,
              bookingUrl,
            ),
          ],

          [date3.key]: [],

          [date4.key]: [
            this.createSlot(
              `${experienceId}-${date4.key}-1500`,
              '3:00 PM',
              8,
              21,
              bookingUrl,
            ),
          ],
        };

      case 'vatican-museums':
      default:
        return {
          [date1.key]: [
            this.createSlot(
              `${experienceId}-${date1.key}-0900`,
              '9:00 AM',
              2,
              18,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date1.key}-1100`,
              '11:00 AM',
              5,
              20,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date1.key}-1400`,
              '2:00 PM',
              8,
              24,
              bookingUrl,
            ),
          ],

          [date2.key]: [
            this.createSlot(
              `${experienceId}-${date2.key}-0900`,
              '9:00 AM',
              6,
              20,
              bookingUrl,
            ),
            this.createSlot(
              `${experienceId}-${date2.key}-1300`,
              '1:00 PM',
              10,
              22,
              bookingUrl,
            ),
          ],

          [date3.key]: [],

          [date4.key]: [
            this.createSlot(
              `${experienceId}-${date4.key}-1200`,
              '12:00 PM',
              9,
              24,
              bookingUrl,
            ),
          ],
        };
    }
  }

  private getAlternateDates(
    requestedDateKey: string,
    inventory: Record<
      string,
      AvailabilitySlot[]
    >,
  ): AvailableDate[] {
    return Object.entries(inventory)
      .filter(
        ([dateKey, slots]) =>
          dateKey !== requestedDateKey &&
          slots.length > 0,
      )
      .map(([dateKey, slots]) => ({
        date:
          this.displayDateFromKey(dateKey),
        slots,
      }))
      .slice(0, 3);
  }

  private displayDateFromKey(
    dateKey: string,
  ): string {
    const [day, month, year] =
      dateKey.split('-');

    return `${Number(day)} ${
      month.charAt(0).toUpperCase() +
      month.slice(1)
    } ${year}`;
  }

  private normalizeDate(
    value: string,
  ): NormalizedDate {
    const normalizedValue = value
      .trim()
      .toLowerCase()
      .replace(/,/g, '')
      .replace(/\s+/g, ' ');

    if (normalizedValue === 'today') {
      return this.createDateInfo(
        this.getFutureDate(0),
      );
    }

    if (normalizedValue === 'tomorrow') {
      return this.createDateInfo(
        this.getFutureDate(1),
      );
    }

    const monthNames: Record<
      string,
      string
    > = {
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

    const dayMonthMatch =
      normalizedValue.match(
        /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/,
      );

    const monthDayMatch =
      normalizedValue.match(
        /^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/,
      );

    let day: string;
    let monthInput: string;
    let year: string;

    if (dayMonthMatch) {
      day = dayMonthMatch[1];
      monthInput = dayMonthMatch[2];
      year =
        dayMonthMatch[3] ??
        String(new Date().getFullYear());
    } else if (monthDayMatch) {
      monthInput = monthDayMatch[1];
      day = monthDayMatch[2];
      year =
        monthDayMatch[3] ??
        String(new Date().getFullYear());
    } else {
      return {
        key:
          normalizedValue.replace(
            /\s+/g,
            '-',
          ),
        displayDate: value,
      };
    }

    const month =
      monthNames[monthInput];

    if (!month) {
      return {
        key:
          normalizedValue.replace(
            /\s+/g,
            '-',
          ),
        displayDate: value,
      };
    }

    const normalizedDay = String(
      Number(day),
    );

    const capitalizedMonth =
      month.charAt(0).toUpperCase() +
      month.slice(1);

    return {
      key:
        `${normalizedDay}-${month}-${year}`,
      displayDate:
        `${normalizedDay} ${capitalizedMonth} ${year}`,
    };
  }

  private createSlot(
    id: string,
    time: string,
    availableTickets: number,
    pricePerPerson: number,
    bookingUrl: string,
  ): AvailabilitySlot {
    return {
      id,
      time,
      availableTickets,
      pricePerPerson,
      bookingUrl,
    };
  }
}