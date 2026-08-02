export type SearchResultStatus = 'available' | 'unavailable';

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

  status: SearchResultStatus;

  requestedDateSlots: AvailabilitySlot[];
  alternateDates: AvailableDate[];

  suggestedExperiences?: SuggestedExperience[];
}