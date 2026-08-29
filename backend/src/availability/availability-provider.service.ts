import { Injectable } from '@nestjs/common';

import { AvailabilityProvider } from './availability-provider';
import { MockAvailabilityProvider } from './mock-availability.provider';
import { ViatorAvailabilityProvider } from './viator-availability.provider';

@Injectable()
export class AvailabilityProviderService {
  private readonly providers: AvailabilityProvider[];

  constructor(
    private readonly viatorProvider: ViatorAvailabilityProvider,
    private readonly mockProvider: MockAvailabilityProvider,
  ) {
    this.providers = [this.viatorProvider, this.mockProvider];
  }

  getProvider(experienceId: string): AvailabilityProvider {
    const provider = this.providers.find((candidate) =>
      candidate.supports(experienceId),
    );

    if (!provider) {
      throw new Error(
        `No availability provider supports experience "${experienceId}".`,
      );
    }

    return provider;
  }
}
