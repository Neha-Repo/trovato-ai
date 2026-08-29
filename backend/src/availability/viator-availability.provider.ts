import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AvailabilityCheckResult,
  AvailabilityProvider,
  AvailabilityRequest,
  AvailabilitySlot,
  AvailableDate,
} from './availability-provider';

interface ViatorProductMapping {
  productCode: string;
  bookingUrl: string;
}

interface ViatorUnavailableDate {
  date: string;
  reason?: string;
}

interface ViatorTimedEntry {
  startTime: string;
  unavailableDates?: ViatorUnavailableDate[];
}

interface ViatorPricingRecord {
  daysOfWeek?: string[];
  timedEntries?: ViatorTimedEntry[];
}

interface ViatorSeason {
  startDate: string;
  endDate: string;
  pricingRecords?: ViatorPricingRecord[];
}

interface ViatorBookableItem {
  productOptionCode: string;
  seasons?: ViatorSeason[];
}

interface ViatorAvailabilitySchedule {
  productCode: string;
  bookableItems?: ViatorBookableItem[];
}

@Injectable()
export class ViatorAvailabilityProvider implements AvailabilityProvider {
  readonly id = 'viator';

  private readonly productMappings: Record<string, ViatorProductMapping> = {
    'vatican-museums': {
      productCode: '3731VATICAN',
      bookingUrl:
        'https://shop.live.rc.viator.com/tours/Rome/Skip-the-Line-Vatican-Museums-and-Sistine-Chapel-Guided-Tour/d511-3731VATICAN?mcid=42383&pid=P00314867&medium=api&api_version=2.0',
    },
  };

  constructor(private readonly configService: ConfigService) {}

  supports(experienceId: string): boolean {
    return experienceId in this.productMappings;
  }

  async getAvailability(
    request: AvailabilityRequest,
  ): Promise<AvailabilityCheckResult> {
    const mapping = this.productMappings[request.experienceId];

    if (!mapping) {
      return this.createErrorResult(request.requestedDate);
    }

    try {
      const schedule = await this.fetchSchedule(mapping.productCode);

      const requestedDateSlots = this.getSlotsForDate(
        schedule,
        request.requestedDate,
        mapping.bookingUrl,
      );

      const alternateDates = this.createAlternateDates(
        schedule,
        request.requestedDate,
        mapping.bookingUrl,
      );

      return {
        providerId: this.id,
        requestedDate: this.formatDisplayDate(request.requestedDate),
        providerError: false,
        requestedDateSlots,
        alternateDates,
        available: requestedDateSlots.length > 0,
      };
    } catch {
      return this.createErrorResult(request.requestedDate);
    }
  }

  private async fetchSchedule(
    productCode: string,
  ): Promise<ViatorAvailabilitySchedule> {
    const baseUrl = this.configService
      .getOrThrow<string>('VIATOR_API_BASE_URL')
      .replace(/\/+$/, '');

    const apiKey = this.configService.getOrThrow<string>('VIATOR_API_KEY');

    const response = await fetch(
      `${baseUrl}/availability/schedules/${encodeURIComponent(productCode)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json;version=2.0',
          'exp-api-key': apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Viator availability request failed with status ${response.status}.`,
      );
    }

    return (await response.json()) as ViatorAvailabilitySchedule;
  }

  private getSlotsForDate(
    schedule: ViatorAvailabilitySchedule,
    date: string,
    bookingUrl: string,
  ): AvailabilitySlot[] {
    const dayOfWeek = this.getDayOfWeek(date);

    if (!dayOfWeek) {
      return [];
    }

    const slots: AvailabilitySlot[] = [];

    for (const item of schedule.bookableItems ?? []) {
      for (const season of item.seasons ?? []) {
        if (!this.isDateInSeason(date, season)) {
          continue;
        }

        for (const pricingRecord of season.pricingRecords ?? []) {
          if (!pricingRecord.daysOfWeek?.includes(dayOfWeek)) {
            continue;
          }

          for (const timedEntry of pricingRecord.timedEntries ?? []) {
            if (this.isTimedEntryUnavailable(timedEntry, date)) {
              continue;
            }

            slots.push({
              id: [
                schedule.productCode,
                item.productOptionCode,
                date,
                timedEntry.startTime,
              ].join('-'),
              time: timedEntry.startTime,
              bookingUrl,
            });
          }
        }
      }
    }

    return this.deduplicateAndSortSlots(slots);
  }

  private createAlternateDates(
    schedule: ViatorAvailabilitySchedule,
    requestedDate: string,
    bookingUrl: string,
  ): AvailableDate[] {
    const requested = this.parseDate(requestedDate);

    if (!requested) {
      return [];
    }

    const alternateDates: AvailableDate[] = [];

    for (let offset = 1; offset <= 14; offset += 1) {
      const candidate = new Date(requested);

      candidate.setUTCDate(candidate.getUTCDate() + offset);

      const dateKey = this.formatDateKey(candidate);

      const slots = this.getSlotsForDate(schedule, dateKey, bookingUrl);

      if (slots.length === 0) {
        continue;
      }

      alternateDates.push({
        date: this.formatDisplayDate(dateKey),
        slots,
      });

      if (alternateDates.length === 3) {
        break;
      }
    }

    return alternateDates;
  }

  private isDateInSeason(date: string, season: ViatorSeason): boolean {
    return date >= season.startDate && date <= season.endDate;
  }

  private isTimedEntryUnavailable(
    timedEntry: ViatorTimedEntry,
    date: string,
  ): boolean {
    return (
      timedEntry.unavailableDates?.some(
        (unavailableDate) =>
          unavailableDate.date === date &&
          unavailableDate.reason === 'SOLD_OUT',
      ) ?? false
    );
  }

  private deduplicateAndSortSlots(
    slots: AvailabilitySlot[],
  ): AvailabilitySlot[] {
    const uniqueSlots = new Map<string, AvailabilitySlot>();

    for (const slot of slots) {
      if (!uniqueSlots.has(slot.id)) {
        uniqueSlots.set(slot.id, slot);
      }
    }

    return [...uniqueSlots.values()].sort((left, right) =>
      left.time.localeCompare(right.time),
    );
  }

  private getDayOfWeek(date: string): string | null {
    const parsed = this.parseDate(date);

    if (!parsed) {
      return null;
    }

    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    return days[parsed.getUTCDay()];
  }

  private parseDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);

    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  private formatDateKey(date: Date): string {
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  private formatDisplayDate(date: string): string {
    const parsed = this.parseDate(date);

    if (!parsed) {
      return date;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed);
  }

  private createErrorResult(requestedDate: string): AvailabilityCheckResult {
    return {
      providerId: this.id,
      requestedDate: this.formatDisplayDate(requestedDate),
      providerError: true,
      requestedDateSlots: [],
      alternateDates: [],
      available: false,
    };
  }
}
