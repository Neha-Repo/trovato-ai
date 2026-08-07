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

interface ExperienceEvaluation {
  providerError: boolean;

  requestedDate: string;
  requestedDateSlots: AvailabilitySlot[];

  alternateDates: AvailableDate[];

  largestAvailableGroupSize: number;

  state: Exclude<
    SearchResultState,
    'unsupported-experience'
  >;
}

interface MockSlotTemplate {
  time: string;
  availableTickets: number;
  pricePerPerson: number;
}

interface MockDayTemplate {
  daysFromToday: number;
  slots: MockSlotTemplate[];
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

  search(
    request: SearchRequest = this.defaultRequest,
  ): SearchResult {
    const experience = this.resolveExperience(
      request.experience,
    );

    if (!experience) {
      return this.createUnsupportedResult(request);
    }

    /*
     * The catalog owns the canonical location.
     *
     * If somebody asks for "Uffizi in Rome", the
     * experience still resolves to Florence.
     */
    const normalizedRequest: SearchRequest = {
      ...request,
      experience: experience.title,
      city: experience.city,
    };

    const evaluation = this.evaluateExperience(
      experience,
      normalizedRequest.requestedDate,
      normalizedRequest.requestedTicketCount,
    );

    normalizedRequest.requestedDate =
      evaluation.requestedDate;

    if (evaluation.providerError) {
      return this.createResult({
        experience,
        request: normalizedRequest,
        evaluation,
        errorMessage:
          'We could not retrieve live availability right now. Please try again shortly.',
      });
    }

    const shouldSuggestAlternatives =
      evaluation.state === 'no-availability' ||
      evaluation.state === 'group-too-large';

    const suggestedExperiences =
      shouldSuggestAlternatives
        ? this.getSuggestedExperiences(
            experience,
            normalizedRequest,
          )
        : undefined;

    return this.createResult({
      experience,
      request: normalizedRequest,
      evaluation,
      suggestedExperiences,
    });
  }

  private evaluateExperience(
    experience: Experience,
    requestedDate: string,
    requestedTicketCount: number,
  ): ExperienceEvaluation {
    const providerAvailability =
      this.getMockProviderAvailability(
        requestedDate,
        experience.bookingUrl,
        experience.id,
      );

    if (providerAvailability.providerError) {
      return {
        providerError: true,
        requestedDate:
          providerAvailability.requestedDate,
        requestedDateSlots: [],
        alternateDates: [],
        largestAvailableGroupSize: 0,
        state: 'provider-error',
      };
    }

    const requestedDateSlots =
      this.filterBookableSlots(
        providerAvailability.requestedDateSlots,
        requestedTicketCount,
      );

    const alternateDates =
      providerAvailability.alternateDates
        .map((availableDate) => ({
          ...availableDate,
          slots: this.filterBookableSlots(
            availableDate.slots,
            requestedTicketCount,
          ),
        }))
        .filter(
          (availableDate) =>
            availableDate.slots.length > 0,
        );

    const allProviderSlots = [
      ...providerAvailability.requestedDateSlots,
      ...providerAvailability.alternateDates.reduce<
        AvailabilitySlot[]
      >(
        (slots, availableDate) => [
          ...slots,
          ...availableDate.slots,
        ],
        [],
      ),
    ];

    const largestAvailableGroupSize =
      this.getLargestAvailableGroupSize(
        allProviderSlots,
      );

    const state = this.determineState({
      requestedDateSlots,
      alternateDates,
      largestAvailableGroupSize,
      requestedTicketCount,
    });

    return {
      providerError: false,
      requestedDate:
        providerAvailability.requestedDate,
      requestedDateSlots,
      alternateDates,
      largestAvailableGroupSize,
      state,
    };
  }

  private getSuggestedExperiences(
    requestedExperience: Experience,
    request: SearchRequest,
  ): SuggestedExperience[] {
    /*
     * Ask for more than we intend to display because
     * some candidates may fail the availability test.
     */
    const geographicCandidates =
      this.experienceCatalogService.getAlternatives(
        requestedExperience.id,
        requestedExperience.city,
        10,
      );

    const sameDateSuggestions: SuggestedExperience[] =
      [];

    const alternateDateSuggestions: SuggestedExperience[] =
      [];

    for (const candidate of geographicCandidates) {
      const evaluation = this.evaluateExperience(
        candidate,
        request.requestedDate,
        request.requestedTicketCount,
      );

      /*
       * Never recommend:
       *
       * - provider failures
       * - experiences that cannot fit the full group
       * - experiences with no useful availability
       */
      if (
        evaluation.providerError ||
        (
          evaluation.state !== 'available' &&
          evaluation.state !== 'alternate-dates'
        )
      ) {
        continue;
      }

      const suggestion: SuggestedExperience = {
        id: candidate.id,
        title: candidate.title,
        city: candidate.city,
        location: candidate.location,
        imageUrl: candidate.imageUrl,

        state: evaluation.state,

        requestedDate: evaluation.requestedDate,
        requestedDateSlots:
          evaluation.requestedDateSlots,

        alternateDates:
          evaluation.alternateDates,
      };

      /*
       * Requested-date availability always ranks before
       * alternatives that require changing the date.
       *
       * Geographic priority is still preserved because
       * ExperienceCatalogService already ordered the
       * candidate list.
       */
      if (evaluation.state === 'available') {
        sameDateSuggestions.push(suggestion);
      } else {
        alternateDateSuggestions.push(suggestion);
      }
    }

    return [
      ...sameDateSuggestions,
      ...alternateDateSuggestions,
    ].slice(0, 3);
  }

  private resolveExperience(
    title?: string,
  ): Experience | null {
    if (!title?.trim()) {
      return null;
    }

    return this.experienceCatalogService.getByTitle(
      title,
    );
  }

  private createUnsupportedResult(
    request: SearchRequest,
  ): SearchResult {
    const requestedTitle =
      request.experience?.trim() ||
      'Requested experience';

    return {
      id: 'unsupported-experience',

      title: requestedTitle,

      city: request.city?.trim() ?? '',
      location:
        request.city?.trim() ??
        'Experience not yet supported',

      requestedDate: request.requestedDate,

      requestedTicketCount:
        request.requestedTicketCount,

      state: 'unsupported-experience',

      requestedDateSlots: [],
      alternateDates: [],

      errorMessage:
        `We do not currently have booking information for ${requestedTitle}. Try another attraction or return to chat.`,
    };
  }

  private determineState(options: {
    requestedDateSlots: AvailabilitySlot[];
    alternateDates: AvailableDate[];
    largestAvailableGroupSize: number;
    requestedTicketCount: number;
  }): Exclude<
    SearchResultState,
    'provider-error' | 'unsupported-experience'
  > {
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
      largestAvailableGroupSize <
        requestedTicketCount
    ) {
      return 'group-too-large';
    }

    return 'no-availability';
  }

  private createResult(options: {
    experience: Experience;
    request: SearchRequest;
    evaluation: ExperienceEvaluation;
    errorMessage?: string;
    suggestedExperiences?: SuggestedExperience[];
  }): SearchResult {
    return {
      id: options.experience.id,
      title: options.experience.title,

      city: options.experience.city,
      location: options.experience.location,

      imageUrl: options.experience.imageUrl,

      requestedDate:
        options.evaluation.requestedDate,

      requestedTicketCount:
        options.request.requestedTicketCount,

      state: options.evaluation.state,

      requestedDateSlots:
        options.evaluation.requestedDateSlots,

      alternateDates:
        options.evaluation.alternateDates,

      largestAvailableGroupSize:
        options.evaluation
          .largestAvailableGroupSize,

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
        slot.availableTickets >=
        requestedTicketCount,
    );
  }

  private getLargestAvailableGroupSize(
    slots: AvailabilitySlot[],
  ): number {
    if (slots.length === 0) {
      return 0;
    }

    return Math.max(
      ...slots.map(
        (slot) => slot.availableTickets,
      ),
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
    if (
      normalizedDate.key ===
      '1-january-2027'
    ) {
      return {
        providerError: true,

        requestedDate:
          normalizedDate.displayDate,

        requestedDateSlots: [],
        alternateDates: [],
      };
    }

    /*
     * Temporary deterministic complete
     * no-availability test.
     */
    if (
      normalizedDate.key ===
      '31-december-2026'
    ) {
      return {
        providerError: false,

        requestedDate:
          normalizedDate.displayDate,

        requestedDateSlots: [],
        alternateDates: [],
      };
    }

    const inventory =
      this.createMockInventory(
        bookingUrl,
        experienceId,
      );

    return {
      providerError: false,

      requestedDate:
        normalizedDate.displayDate,

      requestedDateSlots:
        inventory[normalizedDate.key] ?? [],

      alternateDates:
        this.getAlternateDates(
          normalizedDate.key,
          inventory,
        ),
    };
  }

  private createMockInventory(
    bookingUrl: string,
    experienceId: string,
  ): Record<string, AvailabilitySlot[]> {
    const template =
      this.getMockInventoryTemplate(
        experienceId,
      );

    const inventory: Record<
      string,
      AvailabilitySlot[]
    > = {};

    for (const day of template) {
      const dateInfo =
        this.createDateInfo(
          this.getFutureDate(
            day.daysFromToday,
          ),
        );

      inventory[dateInfo.key] =
        day.slots.map((slot, index) =>
          this.createSlot(
            `${experienceId}-${dateInfo.key}-${index}`,
            slot.time,
            slot.availableTickets,
            slot.pricePerPerson,
            bookingUrl,
          ),
        );
    }

    return inventory;
  }

  private getMockInventoryTemplate(
    experienceId: string,
  ): MockDayTemplate[] {
    switch (experienceId) {
      case 'uffizi-gallery':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '8:30 AM',
                availableTickets: 4,
                pricePerPerson: 25,
              },
              {
                time: '10:45 AM',
                availableTickets: 7,
                pricePerPerson: 29,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '9:15 AM',
                availableTickets: 5,
                pricePerPerson: 25,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '11:30 AM',
                availableTickets: 8,
                pricePerPerson: 29,
              },
            ],
          },
        ];

      case 'colosseum':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '9:00 AM',
                availableTickets: 10,
                pricePerPerson: 18,
              },
              {
                time: '12:30 PM',
                availableTickets: 6,
                pricePerPerson: 22,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '10:00 AM',
                availableTickets: 12,
                pricePerPerson: 20,
              },
              {
                time: '3:30 PM',
                availableTickets: 4,
                pricePerPerson: 24,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [
              {
                time: '11:00 AM',
                availableTickets: 3,
                pricePerPerson: 20,
              },
            ],
          },
          {
            daysFromToday: 4,
            slots: [],
          },
        ];

      case 'pompeii':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '9:00 AM',
                availableTickets: 8,
                pricePerPerson: 20,
              },
              {
                time: '11:30 AM',
                availableTickets: 10,
                pricePerPerson: 22,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '10:00 AM',
                availableTickets: 6,
                pricePerPerson: 20,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '1:00 PM',
                availableTickets: 12,
                pricePerPerson: 24,
              },
            ],
          },
        ];

      /*
       * Campania alternatives deliberately have larger
       * capacities so a large Pompeii group can receive
       * genuinely useful alternatives.
       */
      case 'herculaneum':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '9:30 AM',
                availableTickets: 16,
                pricePerPerson: 18,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '11:00 AM',
                availableTickets: 18,
                pricePerPerson: 20,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '2:00 PM',
                availableTickets: 16,
                pricePerPerson: 20,
              },
            ],
          },
        ];

      case 'naples-archaeological-museum':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '10:00 AM',
                availableTickets: 24,
                pricePerPerson: 18,
              },
              {
                time: '1:00 PM',
                availableTickets: 22,
                pricePerPerson: 18,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '11:00 AM',
                availableTickets: 24,
                pricePerPerson: 18,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '3:00 PM',
                availableTickets: 20,
                pricePerPerson: 18,
              },
            ],
          },
        ];

      case 'mount-vesuvius':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '9:00 AM',
                availableTickets: 30,
                pricePerPerson: 15,
              },
              {
                time: '12:00 PM',
                availableTickets: 26,
                pricePerPerson: 15,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '10:30 AM',
                availableTickets: 28,
                pricePerPerson: 15,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '2:30 PM',
                availableTickets: 25,
                pricePerPerson: 15,
              },
            ],
          },
        ];

      case 'amalfi-coast':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '8:00 AM',
                availableTickets: 25,
                pricePerPerson: 45,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '9:00 AM',
                availableTickets: 28,
                pricePerPerson: 45,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '8:30 AM',
                availableTickets: 25,
                pricePerPerson: 48,
              },
            ],
          },
        ];

      case 'accademia-gallery':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '8:45 AM',
                availableTickets: 5,
                pricePerPerson: 18,
              },
              {
                time: '11:00 AM',
                availableTickets: 7,
                pricePerPerson: 22,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '9:30 AM',
                availableTickets: 6,
                pricePerPerson: 20,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '2:30 PM',
                availableTickets: 8,
                pricePerPerson: 22,
              },
            ],
          },
        ];

      case 'borghese-gallery':
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '9:00 AM',
                availableTickets: 4,
                pricePerPerson: 17,
              },
              {
                time: '1:00 PM',
                availableTickets: 6,
                pricePerPerson: 20,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '11:00 AM',
                availableTickets: 5,
                pricePerPerson: 19,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '3:00 PM',
                availableTickets: 8,
                pricePerPerson: 21,
              },
            ],
          },
        ];

      default:
        return [
          {
            daysFromToday: 1,
            slots: [
              {
                time: '9:00 AM',
                availableTickets: 5,
                pricePerPerson: 20,
              },
              {
                time: '11:00 AM',
                availableTickets: 8,
                pricePerPerson: 24,
              },
            ],
          },
          {
            daysFromToday: 2,
            slots: [
              {
                time: '10:00 AM',
                availableTickets: 10,
                pricePerPerson: 22,
              },
            ],
          },
          {
            daysFromToday: 3,
            slots: [],
          },
          {
            daysFromToday: 4,
            slots: [
              {
                time: '12:00 PM',
                availableTickets: 9,
                pricePerPerson: 24,
              },
            ],
          },
        ];
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
        new Intl.DateTimeFormat(
          'en-GB',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          },
        ).format(date),
    };
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

    if (
      normalizedValue === 'tomorrow'
    ) {
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
        String(
          new Date().getFullYear(),
        );
    } else if (monthDayMatch) {
      monthInput = monthDayMatch[1];
      day = monthDayMatch[2];

      year =
        monthDayMatch[3] ??
        String(
          new Date().getFullYear(),
        );
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

    const normalizedDay =
      String(Number(day));

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