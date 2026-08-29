import { ConfigService } from '@nestjs/config';

import { ViatorAvailabilityProvider } from './viator-availability.provider';

describe('ViatorAvailabilityProvider', () => {
  let provider: ViatorAvailabilityProvider;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        switch (key) {
          case 'VIATOR_API_BASE_URL':
            return 'https://api.sandbox.viator.com/partner';

          case 'VIATOR_API_KEY':
            return 'test-api-key';

          default:
            throw new Error(`Unexpected config key: ${key}`);
        }
      }),
    } as unknown as ConfigService;

    provider = new ViatorAvailabilityProvider(configService);

    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('supports the mapped Vatican Museums experience', () => {
    expect(provider.supports('vatican-museums')).toBe(true);
  });

  it('does not support an unmapped experience', () => {
    expect(provider.supports('colosseum')).toBe(false);
  });

  it('returns scheduled times that are not sold out', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        productCode: '3731VATICAN',

        bookableItems: [
          {
            productOptionCode: 'TG9',

            seasons: [
              {
                startDate: '2026-08-29',
                endDate: '2026-08-29',

                pricingRecords: [
                  {
                    daysOfWeek: ['SATURDAY'],

                    timedEntries: [
                      {
                        startTime: '08:00',

                        unavailableDates: [
                          {
                            date: '2026-08-29',
                            reason: 'SOLD_OUT',
                          },
                        ],
                      },
                      {
                        startTime: '09:30',

                        unavailableDates: [],
                      },
                      {
                        startTime: '10:00',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as unknown as Response);

    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-29',
      travellers: 4,
    });

    expect(result.providerId).toBe('viator');

    expect(result.providerError).toBe(false);

    expect(result.available).toBe(true);

    expect(result.requestedDate).toBe('29 August 2026');

    expect(result.requestedDateSlots).toHaveLength(2);

    expect(result.requestedDateSlots.map((slot) => slot.time)).toEqual([
      '09:30',
      '10:00',
    ]);

    expect(
      result.requestedDateSlots.some((slot) => slot.time === '08:00'),
    ).toBe(false);
  });

  it('does not invent capacity or price information', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        productCode: '3731VATICAN',

        bookableItems: [
          {
            productOptionCode: 'TG9',

            seasons: [
              {
                startDate: '2026-08-29',
                endDate: '2026-08-29',

                pricingRecords: [
                  {
                    daysOfWeek: ['SATURDAY'],

                    timedEntries: [
                      {
                        startTime: '09:30',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as unknown as Response);

    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-29',
      travellers: 10,
    });

    const slot = result.requestedDateSlots[0];

    expect(slot).toBeDefined();

    expect(slot.availableTickets).toBeUndefined();

    expect(slot.pricePerPerson).toBeUndefined();

    expect(result.largestAvailableGroupSize).toBeUndefined();
  });

  it('uses the verified Viator product booking URL', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        productCode: '3731VATICAN',

        bookableItems: [
          {
            productOptionCode: 'TG9',

            seasons: [
              {
                startDate: '2026-08-29',
                endDate: '2026-08-29',

                pricingRecords: [
                  {
                    daysOfWeek: ['SATURDAY'],

                    timedEntries: [
                      {
                        startTime: '09:30',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as unknown as Response);

    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-29',
      travellers: 2,
    });

    expect(result.requestedDateSlots[0].bookingUrl).toContain(
      'd511-3731VATICAN',
    );
  });

  it('returns alternate dates with availability', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        productCode: '3731VATICAN',

        bookableItems: [
          {
            productOptionCode: 'TG9',

            seasons: [
              {
                startDate: '2026-08-29',
                endDate: '2026-08-29',

                pricingRecords: [
                  {
                    daysOfWeek: ['SATURDAY'],

                    timedEntries: [
                      {
                        startTime: '09:00',

                        unavailableDates: [
                          {
                            date: '2026-08-29',
                            reason: 'SOLD_OUT',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                startDate: '2026-08-30',
                endDate: '2026-08-30',

                pricingRecords: [
                  {
                    daysOfWeek: ['SUNDAY'],

                    timedEntries: [
                      {
                        startTime: '10:30',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as unknown as Response);

    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-29',
      travellers: 2,
    });

    expect(result.available).toBe(false);

    expect(result.requestedDateSlots).toEqual([]);

    expect(result.alternateDates).toHaveLength(1);

    expect(result.alternateDates[0].date).toBe('30 August 2026');

    expect(result.alternateDates[0].slots).toHaveLength(1);

    expect(result.alternateDates[0].slots[0].time).toBe('10:30');
  });

  it('merges matching pricing records and sorts the times', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        productCode: '3731VATICAN',

        bookableItems: [
          {
            productOptionCode: 'TG9',

            seasons: [
              {
                startDate: '2026-08-29',
                endDate: '2026-08-29',

                pricingRecords: [
                  {
                    daysOfWeek: ['SATURDAY'],

                    timedEntries: [
                      {
                        startTime: '10:30',
                      },
                      {
                        startTime: '09:00',
                      },
                    ],
                  },
                  {
                    daysOfWeek: ['SATURDAY'],

                    timedEntries: [
                      {
                        startTime: '08:30',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as unknown as Response);

    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-29',
      travellers: 1,
    });

    expect(result.requestedDateSlots.map((slot) => slot.time)).toEqual([
      '08:30',
      '09:00',
      '10:30',
    ]);
  });

  it('returns a provider error when Viator responds with an error', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-29',
      travellers: 2,
    });

    expect(result).toEqual({
      providerId: 'viator',
      requestedDate: '29 August 2026',
      providerError: true,
      requestedDateSlots: [],
      alternateDates: [],
      available: false,
    });
  });

  it('returns a provider error for an unsupported direct request', async () => {
    const result = await provider.getAvailability({
      experienceId: 'unsupported-experience',
      requestedDate: '2026-08-29',
      travellers: 2,
    });

    expect(result.providerId).toBe('viator');

    expect(result.providerError).toBe(true);

    expect(result.available).toBe(false);

    expect(result.requestedDateSlots).toEqual([]);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
