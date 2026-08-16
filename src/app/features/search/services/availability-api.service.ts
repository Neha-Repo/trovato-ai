import {
  Injectable,
  inject,
} from '@angular/core';
import {
  HttpClient,
} from '@angular/common/http';
import {
  firstValueFrom,
} from 'rxjs';

export interface BackendAvailabilityRequest {
  experienceId: string;
  requestedDate: string;
  travellers: number;
}

export interface BackendAvailabilitySlot {
  id: string;
  time: string;
  availableTickets: number;
  pricePerPerson: number;
  bookingUrl: string;
}

export interface BackendAvailableDate {
  date: string;
  slots: BackendAvailabilitySlot[];
}

export interface BackendAvailabilityResponse {
  providerId: string;

  requestedDate: string;

  providerError: boolean;

  requestedDateSlots:
    BackendAvailabilitySlot[];

  alternateDates:
    BackendAvailableDate[];

  largestAvailableGroupSize:
    number;

  available: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AvailabilityApiService {
  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/availability/check';

  async checkAvailability(
    request: BackendAvailabilityRequest,
  ): Promise<BackendAvailabilityResponse> {
    return firstValueFrom(
      this.http.post<BackendAvailabilityResponse>(
        this.apiUrl,
        request,
      ),
    );
  }
}