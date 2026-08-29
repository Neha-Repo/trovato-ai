import { AvailabilityProvider } from './availability-provider';
import { AvailabilityProviderService } from './availability-provider.service';
import { MockAvailabilityProvider } from './mock-availability.provider';
import { ViatorAvailabilityProvider } from './viator-availability.provider';

describe('AvailabilityProviderService', () => {
  it('returns the Viator provider before the mock fallback', () => {
    const viatorProvider = {
      id: 'viator',

      supports: jest.fn().mockReturnValue(true),

      getAvailability: jest.fn(),
    } as unknown as ViatorAvailabilityProvider;

    const mockProvider = {
      id: 'mock',

      supports: jest.fn().mockReturnValue(true),

      getAvailability: jest.fn(),
    } as unknown as MockAvailabilityProvider;

    const service = new AvailabilityProviderService(
      viatorProvider,
      mockProvider,
    );

    const provider = service.getProvider('vatican-museums');

    expect(provider).toBe(viatorProvider);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(viatorProvider.supports).toHaveBeenCalledWith('vatican-museums');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockProvider.supports).not.toHaveBeenCalled();
  });

  it('falls back to the mock provider when Viator does not support the experience', () => {
    const viatorProvider = {
      id: 'viator',

      supports: jest.fn().mockReturnValue(false),

      getAvailability: jest.fn(),
    } as unknown as ViatorAvailabilityProvider;

    const mockProvider = {
      id: 'mock',

      supports: jest.fn().mockReturnValue(true),

      getAvailability: jest.fn(),
    } as unknown as MockAvailabilityProvider;

    const service = new AvailabilityProviderService(
      viatorProvider,
      mockProvider,
    );

    const provider = service.getProvider('colosseum');

    expect(provider).toBe(mockProvider);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(viatorProvider.supports).toHaveBeenCalledWith('colosseum');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockProvider.supports).toHaveBeenCalledWith('colosseum');
  });

  it('throws when no provider supports the experience', () => {
    const viatorProvider = {
      id: 'viator',

      supports: jest.fn().mockReturnValue(false),

      getAvailability: jest.fn(),
    } as unknown as AvailabilityProvider & ViatorAvailabilityProvider;

    const mockProvider = {
      id: 'mock',

      supports: jest.fn().mockReturnValue(false),

      getAvailability: jest.fn(),
    } as unknown as AvailabilityProvider & MockAvailabilityProvider;

    const service = new AvailabilityProviderService(
      viatorProvider,
      mockProvider,
    );

    expect(() => service.getProvider('unsupported-experience')).toThrow(
      'No availability provider supports experience "unsupported-experience".',
    );
  });
});
