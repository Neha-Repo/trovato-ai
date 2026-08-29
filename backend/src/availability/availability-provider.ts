export interface AvailabilityRequest {
  experienceId: string;
  requestedDate: string;
  travellers: number;
}

export interface AvailabilitySlot {
  id: string;
  time: string;
  availableTickets?: number;
  pricePerPerson?: number;
  bookingUrl: string;
}

export interface AvailableDate {
  date: string;
  slots: AvailabilitySlot[];
}

export interface AvailabilityCheckResult {
  providerId: string;

  requestedDate: string;

  providerError: boolean;

  requestedDateSlots: AvailabilitySlot[];

  alternateDates: AvailableDate[];

  largestAvailableGroupSize?: number;

  available: boolean;
}

export interface AvailabilityProvider {
  readonly id: string;

  supports(experienceId: string): boolean;

  getAvailability(
    request: AvailabilityRequest,
  ): Promise<AvailabilityCheckResult>;
}
