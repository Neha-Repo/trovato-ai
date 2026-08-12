import { Experience } from '../services/experience-catalog.service';
import {
  AvailabilitySlot,
  AvailableDate,
} from '../models/search-result.model';

export interface ProviderAvailabilityRequest {
  experience: Experience;
  requestedDate: string;
}

export interface ProviderAvailability {
  providerError: boolean;

  requestedDate: string;

  requestedDateSlots: AvailabilitySlot[];

  alternateDates: AvailableDate[];
}

export interface AvailabilityProvider {
  readonly id: string;

  supports(
    experience: Experience,
  ): boolean;

  getAvailability(
    request: ProviderAvailabilityRequest,
  ): ProviderAvailability;
}