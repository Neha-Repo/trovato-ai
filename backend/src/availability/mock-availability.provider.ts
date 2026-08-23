import { Injectable } from '@nestjs/common';

import {
  AvailabilityCheckResult,
  AvailabilityProvider,
  AvailabilityRequest,
  AvailabilitySlot,
  AvailableDate,
} from './availability-provider';

interface MockSlotTemplate {
  time: string;
  availableTickets: number;
  pricePerPerson: number;
}

interface MockDayTemplate {
  daysFromRequestedDate: number;
  slots: MockSlotTemplate[];
}

@Injectable()
export class MockAvailabilityProvider implements AvailabilityProvider {
  readonly id = 'mock';

  supports(): boolean {
    return true;
  }

  getAvailability(
    request: AvailabilityRequest,
  ): Promise<AvailabilityCheckResult> {
    const requestedDate = this.parseDate(request.requestedDate);

    if (!requestedDate) {
      return Promise.resolve({
        providerId: this.id,

        requestedDate: request.requestedDate,

        providerError: true,

        requestedDateSlots: [],

        alternateDates: [],

        largestAvailableGroupSize: 0,

        available: false,
      });
    }

    const inventory = this.createInventory(request.experienceId, requestedDate);

    const requestedDateKey = this.formatDateKey(requestedDate);

    const rawRequestedSlots = inventory[requestedDateKey] ?? [];

    const requestedDateSlots = this.filterBookableSlots(
      rawRequestedSlots,
      request.travellers,
    );

    const alternateDates = this.createAlternateDates(
      inventory,
      requestedDateKey,
      request.travellers,
    );

    const allSlots = Object.values(inventory).flat();

    const largestAvailableGroupSize =
      this.getLargestAvailableGroupSize(allSlots);

    return Promise.resolve({
      providerId: this.id,

      requestedDate: this.formatDisplayDate(requestedDate),

      providerError: false,

      requestedDateSlots,

      alternateDates,

      largestAvailableGroupSize,

      available: requestedDateSlots.length > 0,
    });
  }

  private createInventory(
    experienceId: string,
    requestedDate: Date,
  ): Record<string, AvailabilitySlot[]> {
    const template = this.getTemplate(experienceId);

    const inventory: Record<string, AvailabilitySlot[]> = {};

    for (const day of template) {
      const date = new Date(requestedDate);

      date.setDate(date.getDate() + day.daysFromRequestedDate);

      const dateKey = this.formatDateKey(date);

      inventory[dateKey] = day.slots.map((slot, index) => ({
        id: `${experienceId}-${dateKey}-${index}`,

        time: slot.time,

        availableTickets: slot.availableTickets,

        pricePerPerson: slot.pricePerPerson,

        bookingUrl: this.getBookingUrl(experienceId),
      }));
    }

    return inventory;
  }

  private getTemplate(experienceId: string): MockDayTemplate[] {
    switch (experienceId) {
      case 'vatican-museums':
        return [
          {
            daysFromRequestedDate: 0,

            slots: [
              {
                time: '9:00 AM',

                availableTickets: 4,

                pricePerPerson: 25,
              },
              {
                time: '11:30 AM',

                availableTickets: 12,

                pricePerPerson: 29,
              },
            ],
          },
          {
            daysFromRequestedDate: 1,

            slots: [
              {
                time: '10:00 AM',

                availableTickets: 6,

                pricePerPerson: 27,
              },
            ],
          },
          {
            daysFromRequestedDate: 2,

            slots: [],
          },
          {
            daysFromRequestedDate: 3,

            slots: [
              {
                time: '1:30 PM',

                availableTickets: 10,

                pricePerPerson: 30,
              },
            ],
          },
        ];

      case 'uffizi-gallery':
        return [
          {
            daysFromRequestedDate: 0,

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
            daysFromRequestedDate: 1,

            slots: [
              {
                time: '9:15 AM',

                availableTickets: 5,

                pricePerPerson: 25,
              },
            ],
          },
          {
            daysFromRequestedDate: 2,

            slots: [],
          },
          {
            daysFromRequestedDate: 3,

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
            daysFromRequestedDate: 0,

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
            daysFromRequestedDate: 1,

            slots: [
              {
                time: '10:00 AM',

                availableTickets: 12,

                pricePerPerson: 20,
              },
            ],
          },
          {
            daysFromRequestedDate: 2,

            slots: [
              {
                time: '3:30 PM',

                availableTickets: 4,

                pricePerPerson: 24,
              },
            ],
          },
        ];

      case 'pompeii':
        return [
          {
            daysFromRequestedDate: 0,

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
            daysFromRequestedDate: 1,

            slots: [
              {
                time: '10:00 AM',

                availableTickets: 6,

                pricePerPerson: 20,
              },
            ],
          },
          {
            daysFromRequestedDate: 2,

            slots: [],
          },
          {
            daysFromRequestedDate: 3,

            slots: [
              {
                time: '1:00 PM',

                availableTickets: 12,

                pricePerPerson: 24,
              },
            ],
          },
        ];

      default:
        return [
          {
            daysFromRequestedDate: 0,

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
            daysFromRequestedDate: 1,

            slots: [
              {
                time: '10:00 AM',

                availableTickets: 10,

                pricePerPerson: 22,
              },
            ],
          },
          {
            daysFromRequestedDate: 2,

            slots: [],
          },
          {
            daysFromRequestedDate: 3,

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

  private createAlternateDates(
    inventory: Record<string, AvailabilitySlot[]>,

    requestedDateKey: string,

    travellers: number,
  ): AvailableDate[] {
    return Object.entries(inventory)
      .filter(([dateKey]) => dateKey !== requestedDateKey)
      .map(([dateKey, slots]) => ({
        date: this.displayDateFromKey(dateKey),

        slots: this.filterBookableSlots(slots, travellers),
      }))
      .filter((date) => date.slots.length > 0)
      .slice(0, 3);
  }

  private filterBookableSlots(
    slots: AvailabilitySlot[],

    travellers: number,
  ): AvailabilitySlot[] {
    return slots.filter((slot) => slot.availableTickets >= travellers);
  }

  private getLargestAvailableGroupSize(slots: AvailabilitySlot[]): number {
    if (slots.length === 0) {
      return 0;
    }

    return Math.max(...slots.map((slot) => slot.availableTickets));
  }

  private parseDate(value: string): Date | null {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private formatDateKey(date: Date): string {
    return [
      date.getFullYear(),

      String(date.getMonth() + 1).padStart(2, '0'),

      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private displayDateFromKey(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);

    return this.formatDisplayDate(new Date(year, month - 1, day));
  }

  private formatDisplayDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',

      month: 'long',

      year: 'numeric',
    }).format(date);
  }

  private getBookingUrl(experienceId: string): string {
    switch (experienceId) {
      case 'vatican-museums':
        return 'https://tickets.museivaticani.va/';

      case 'uffizi-gallery':
        return 'https://www.uffizi.it/';

      case 'colosseum':
        return 'https://ticketing.colosseo.it/';

      case 'pompeii':
        return 'https://www.ticketone.it/';

      default:
        return 'https://example.com/';
    }
  }
}
