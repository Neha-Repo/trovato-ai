export type SearchResultState =
  | 'available'
  | 'alternate-dates'
  | 'no-availability'
  | 'group-too-large'
  | 'provider-error'
  | 'unsupported-experience';

export type SuggestedExperienceState =
  | 'available'
  | 'alternate-dates';

export interface AvailabilitySlot {
  id: string;
  time: string;
  availableTickets?: number;
  pricePerPerson: number;
  bookingUrl: string;
}

export interface AvailableDate {
  date: string;
  slots: AvailabilitySlot[];
}

export interface SuggestedExperience {
  id: string;
  title: string;
  city: string;
  location: string;
  imageUrl: string;

  state: SuggestedExperienceState;

  requestedDate: string;
  requestedDateSlots: AvailabilitySlot[];
  alternateDates: AvailableDate[];
}

export interface SearchResult {
  id: string;
  title: string;
  city: string;
  location: string;
  imageUrl?: string;

  requestedDate: string;
  requestedTicketCount: number;

  state: SearchResultState;

  requestedDateSlots: AvailabilitySlot[];
  alternateDates: AvailableDate[];

  largestAvailableGroupSize?: number;
  errorMessage?: string;

  suggestedExperiences?: SuggestedExperience[];
}