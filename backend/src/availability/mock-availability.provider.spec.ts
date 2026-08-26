import { MockAvailabilityProvider } from './mock-availability.provider';

describe('MockAvailabilityProvider', () => {
  let provider: MockAvailabilityProvider;

  beforeEach(() => {
    provider = new MockAvailabilityProvider();
  });

  it('returns bookable requested-date slots when availability fits the group', async () => {
    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-25',
      travellers: 3,
    });

    expect(result.providerError).toBe(false);

    expect(result.available).toBe(true);

    expect(result.requestedDateSlots.length).toBeGreaterThan(0);

    expect(
      result.requestedDateSlots.every((slot) => slot.availableTickets >= 3),
    ).toBe(true);
  });

  it('filters out requested-date slots that cannot fit the traveller count', async () => {
    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-25',
      travellers: 10,
    });

    expect(result.providerError).toBe(false);

    expect(result.requestedDateSlots.length).toBe(1);

    expect(
      result.requestedDateSlots[0].availableTickets,
    ).toBeGreaterThanOrEqual(10);
  });

  it('reports no requested-date availability when the group is too large', async () => {
    const result = await provider.getAvailability({
      experienceId: 'pompeii',
      requestedDate: '2026-08-25',
      travellers: 20,
    });

    expect(result.providerError).toBe(false);

    expect(result.available).toBe(false);

    expect(result.requestedDateSlots).toEqual([]);

    expect(result.largestAvailableGroupSize).toBe(12);
  });

  it('returns alternate dates when later inventory can fit the requested group', async () => {
    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: '2026-08-25',
      travellers: 6,
    });

    expect(result.providerError).toBe(false);

    expect(result.alternateDates.length).toBeGreaterThan(0);

    expect(
      result.alternateDates.every((date) =>
        date.slots.every((slot) => slot.availableTickets >= 6),
      ),
    ).toBe(true);
  });

  it('returns providerError for an invalid requested date', async () => {
    const result = await provider.getAvailability({
      experienceId: 'vatican-museums',
      requestedDate: 'not-a-date',
      travellers: 2,
    });

    expect(result.providerError).toBe(true);

    expect(result.available).toBe(false);

    expect(result.requestedDateSlots).toEqual([]);

    expect(result.alternateDates).toEqual([]);

    expect(result.largestAvailableGroupSize).toBe(0);
  });

  it('uses the expected booking URL for known experiences', async () => {
    const result = await provider.getAvailability({
      experienceId: 'colosseum',
      requestedDate: '2026-08-25',
      travellers: 2,
    });

    expect(result.requestedDateSlots.length).toBeGreaterThan(0);

    expect(
      result.requestedDateSlots.every(
        (slot) => slot.bookingUrl === 'https://ticketing.colosseo.it/',
      ),
    ).toBe(true);
  });
});
