export type SearchResultState =
  | 'available'
  | 'alternate-dates'
  | 'no-availability'
  | 'group-too-large'
  | 'provider-error';

export interface AvailabilitySlot {
  id: string;
  time: string;
  availableTickets: number;
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
  location: string;
  imageUrl: string;
}

export interface SearchResult {
  id: string;
  title: string;
  location: string;
  imageUrl: string;

  requestedDate: string;
  requestedTicketCount: number;

  state: SearchResultState;

  requestedDateSlots: AvailabilitySlot[];
  alternateDates: AvailableDate[];

  largestAvailableGroupSize?: number;
  errorMessage?: string;

  suggestedExperiences?: SuggestedExperience[];
}