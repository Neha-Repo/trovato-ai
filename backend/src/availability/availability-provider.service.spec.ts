import { AvailabilityProvider } from './availability-provider';
import { AvailabilityProviderService } from './availability-provider.service';
import { MockAvailabilityProvider } from './mock-availability.provider';

describe('AvailabilityProviderService', () => {
  it('returns the provider that supports the experience', () => {
    const mockProvider = {
      id: 'mock',

      supports: jest.fn().mockReturnValue(true),

      getAvailability: jest.fn(),
    } as unknown as MockAvailabilityProvider;

    const service = new AvailabilityProviderService(mockProvider);

    const provider = service.getProvider('vatican-museums');

    expect(provider).toBe(mockProvider);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockProvider.supports).toHaveBeenCalledWith('vatican-museums');
  });

  it('throws when no provider supports the experience', () => {
    const mockProvider = {
      id: 'mock',

      supports: jest.fn().mockReturnValue(false),

      getAvailability: jest.fn(),
    } as unknown as AvailabilityProvider & MockAvailabilityProvider;

    const service = new AvailabilityProviderService(mockProvider);

    expect(() => service.getProvider('unsupported-experience')).toThrow(
      'No availability provider supports experience "unsupported-experience".',
    );
  });
});
