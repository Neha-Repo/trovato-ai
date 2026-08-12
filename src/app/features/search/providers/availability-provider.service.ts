import { Injectable } from '@angular/core';

import { Experience } from '../services/experience-catalog.service';
import { AvailabilityProvider } from './availability-provider';
import { MockAvailabilityProvider } from './mock-availability.provider';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityProviderService {
  private readonly providers:
    AvailabilityProvider[];

  constructor(
    private readonly mockProvider:
      MockAvailabilityProvider,
  ) {
    this.providers = [
      this.mockProvider,
    ];
  }

  getProvider(
    experience: Experience,
  ): AvailabilityProvider {
    const provider =
      this.providers.find(
        (candidate) =>
          candidate.supports(
            experience,
          ),
      );

    if (!provider) {
      throw new Error(
        `No availability provider supports experience "${experience.id}".`,
      );
    }

    return provider;
  }
}