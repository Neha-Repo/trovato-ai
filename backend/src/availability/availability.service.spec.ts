import { Test } from '@nestjs/testing';

import {
  AvailabilityCheckResult,
  AvailabilityRequest,
} from './availability-provider';
import { AvailabilityProviderService } from './availability-provider.service';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  let providerService: {
    getProvider: jest.Mock;
  };

  let provider: {
    getAvailability: jest.Mock;
  };

  beforeEach(async () => {
    provider = {
      getAvailability: jest.fn(),
    };

    providerService = {
      getProvider: jest
        .fn()
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        .mockReturnValue(provider as unknown as AvailabilityProvider),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: AvailabilityProviderService,
          useValue: providerService,
        },
      ],
    }).compile();

    service = moduleRef.get(AvailabilityService);
  });

  it('uses the provider selected for the requested experience', async () => {
    const request: AvailabilityRequest = {
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-25',
      travellers: 2,
    };

    const result: AvailabilityCheckResult = {
      providerId: 'mock',

      requestedDate: '25 August 2026',

      providerError: false,

      requestedDateSlots: [],

      alternateDates: [],

      largestAvailableGroupSize: 12,

      available: false,
    };

    provider.getAvailability.mockResolvedValue(result);

    await expect(service.checkAvailability(request)).resolves.toEqual(result);

    expect(providerService.getProvider).toHaveBeenCalledWith('vatican-museums');

    expect(provider.getAvailability).toHaveBeenCalledWith(request);
  });

  it('propagates provider selection errors', async () => {
    providerService.getProvider.mockImplementation(() => {
      throw new Error('No availability provider supports experience.');
    });

    const request: AvailabilityRequest = {
      experienceId: 'unsupported-experience',
      requestedDate: '2026-08-25',
      travellers: 2,
    };

    await expect(service.checkAvailability(request)).rejects.toThrow(
      'No availability provider supports experience.',
    );

    expect(provider.getAvailability).not.toHaveBeenCalled();
  });

  it('propagates provider availability failures', async () => {
    provider.getAvailability.mockRejectedValue(
      new Error('Provider unavailable'),
    );

    const request: AvailabilityRequest = {
      experienceId: 'pompeii',
      requestedDate: '2026-08-25',
      travellers: 4,
    };

    await expect(service.checkAvailability(request)).rejects.toThrow(
      'Provider unavailable',
    );
  });
});
