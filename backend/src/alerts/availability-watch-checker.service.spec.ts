/// <reference types="jest" />

import { AvailabilityService } from '../availability/availability.service';
import { FirebasePushService } from '../push/firebase-push.service';
import { PushDeviceService } from '../push/push-device.service';
import {
  AvailabilityWatch,
  AvailabilityWatchService,
} from './availability-watch.service';
import { AvailabilityWatchCheckerService } from './availability-watch-checker.service';
import { FirebaseMessagingError } from 'firebase-admin/messaging';

describe('AvailabilityWatchCheckerService', () => {
  let service: AvailabilityWatchCheckerService;

  let checkAvailability: jest.MockedFunction<
    AvailabilityService['checkAvailability']
  >;

  let getActiveWatches: jest.MockedFunction<
    AvailabilityWatchService['getActiveWatches']
  >;

  let markMatched: jest.MockedFunction<AvailabilityWatchService['markMatched']>;

  let getTokensForUser: jest.MockedFunction<
    PushDeviceService['getTokensForUser']
  >;
  let removeToken: jest.MockedFunction<PushDeviceService['removeToken']>;

  let sendAvailabilityNotification: jest.MockedFunction<
    FirebasePushService['sendAvailabilityNotification']
  >;

  const watch: AvailabilityWatch = {
    id: 'watch-1',
    userId: 'user-1',
    experienceId: 'vatican-museums',
    experienceTitle: 'Vatican Museums',
    requestedDate: '24 August 2026',
    travellers: 2,
    status: 'active',
    createdAt: '2026-08-23T10:00:00.000Z',
    updatedAt: '2026-08-23T10:00:00.000Z',
  };

  beforeEach(() => {
    checkAvailability = jest.fn();
    getActiveWatches = jest.fn();
    markMatched = jest.fn();
    getTokensForUser = jest.fn();
    removeToken = jest.fn();
    sendAvailabilityNotification = jest.fn();

    const availabilityService = {
      checkAvailability,
    } as unknown as AvailabilityService;

    const availabilityWatchService = {
      getActiveWatches,
      markMatched,
    } as unknown as AvailabilityWatchService;

    const pushDeviceService = {
      getTokensForUser,
      removeToken,
    } as unknown as PushDeviceService;

    const firebasePushService = {
      sendAvailabilityNotification,
    } as unknown as FirebasePushService;

    service = new AvailabilityWatchCheckerService(
      availabilityService,
      availabilityWatchService,
      pushDeviceService,
      firebasePushService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('leaves the watch active when availability is not found', async () => {
    getActiveWatches.mockResolvedValue([watch]);

    checkAvailability.mockResolvedValue({
      providerId: 'mock',
      requestedDate: watch.requestedDate,
      providerError: false,
      requestedDateSlots: [],
      alternateDates: [],
      largestAvailableGroupSize: 0,
      available: false,
    });

    await service.checkActiveWatches();

    expect(checkAvailability).toHaveBeenCalledWith({
      experienceId: watch.experienceId,
      requestedDate: watch.requestedDate,
      travellers: watch.travellers,
    });

    expect(getTokensForUser).not.toHaveBeenCalled();

    expect(sendAvailabilityNotification).not.toHaveBeenCalled();

    expect(markMatched).not.toHaveBeenCalled();
  });

  it('sends a push and marks the watch as matched when availability exists', async () => {
    getActiveWatches.mockResolvedValue([watch]);

    checkAvailability.mockResolvedValue({
      providerId: 'mock',
      requestedDate: watch.requestedDate,
      providerError: false,

      requestedDateSlots: [
        {
          id: 'slot-1',
          time: '9:00 AM',
          availableTickets: 4,
          pricePerPerson: 25,
          bookingUrl: 'https://example.com',
        },
      ],

      alternateDates: [],

      largestAvailableGroupSize: 4,

      available: true,
    });

    getTokensForUser.mockResolvedValue(['token-1']);

    sendAvailabilityNotification.mockResolvedValue('message-id-1');

    await service.checkActiveWatches();

    expect(getTokensForUser).toHaveBeenCalledWith(watch.userId);

    expect(sendAvailabilityNotification).toHaveBeenCalledWith('token-1', {
      title: 'Tickets available',

      body: 'Vatican Museums now has availability for 2 travellers on 24 August 2026.',

      data: {
        type: 'availability-match',
        watchId: 'watch-1',
        experienceId: 'vatican-museums',
        experienceTitle: 'Vatican Museums',
        requestedDate: '24 August 2026',
        travellers: '2',
      },
    });

    expect(markMatched).toHaveBeenCalledWith(watch.id);
  });

  it('sends a push to every registered device', async () => {
    getActiveWatches.mockResolvedValue([watch]);

    checkAvailability.mockResolvedValue({
      providerId: 'mock',
      requestedDate: watch.requestedDate,
      providerError: false,

      requestedDateSlots: [
        {
          id: 'slot-1',
          time: '9:00 AM',
          availableTickets: 4,
          pricePerPerson: 25,
          bookingUrl: 'https://example.com',
        },
      ],

      alternateDates: [],

      largestAvailableGroupSize: 4,

      available: true,
    });

    getTokensForUser.mockResolvedValue(['token-1', 'token-2']);

    sendAvailabilityNotification.mockResolvedValue('message-id');

    await service.checkActiveWatches();

    expect(sendAvailabilityNotification).toHaveBeenCalledTimes(2);

    expect(markMatched).toHaveBeenCalledTimes(1);
  });

  it('does not mark a watch as matched when the user has no push device', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    getActiveWatches.mockResolvedValue([watch]);

    checkAvailability.mockResolvedValue({
      providerId: 'mock',
      requestedDate: watch.requestedDate,
      providerError: false,

      requestedDateSlots: [
        {
          id: 'slot-1',
          time: '9:00 AM',
          availableTickets: 4,
          pricePerPerson: 25,
          bookingUrl: 'https://example.com',
        },
      ],

      alternateDates: [],

      largestAvailableGroupSize: 4,

      available: true,
    });

    getTokensForUser.mockResolvedValue([]);

    await service.checkActiveWatches();

    expect(sendAvailabilityNotification).not.toHaveBeenCalled();

    expect(markMatched).not.toHaveBeenCalled();
  });

  it('continues checking other watches when one watch fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const secondWatch: AvailabilityWatch = {
      ...watch,
      id: 'watch-2',
      experienceId: 'uffizi-gallery',
      experienceTitle: 'Uffizi Gallery',
    };

    getActiveWatches.mockResolvedValue([watch, secondWatch]);

    checkAvailability
      .mockRejectedValueOnce(new Error('Provider failed'))
      .mockResolvedValueOnce({
        providerId: 'mock',
        requestedDate: secondWatch.requestedDate,
        providerError: false,

        requestedDateSlots: [
          {
            id: 'slot-2',
            time: '10:00 AM',
            availableTickets: 6,
            pricePerPerson: 29,
            bookingUrl: 'https://example.com',
          },
        ],

        alternateDates: [],

        largestAvailableGroupSize: 6,

        available: true,
      });

    getTokensForUser.mockResolvedValue(['token-2']);

    sendAvailabilityNotification.mockResolvedValue('message-id-2');

    await service.checkActiveWatches();

    expect(checkAvailability).toHaveBeenCalledTimes(2);

    expect(markMatched).toHaveBeenCalledWith(secondWatch.id);

    expect(markMatched).not.toHaveBeenCalledWith(watch.id);
  });
  it('removes an invalid push token and keeps the watch active when no notification succeeds', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    getActiveWatches.mockResolvedValue([watch]);

    checkAvailability.mockResolvedValue({
      providerId: 'mock',
      requestedDate: watch.requestedDate,
      providerError: false,

      requestedDateSlots: [
        {
          id: 'slot-1',
          time: '9:00 AM',
          availableTickets: 4,
          pricePerPerson: 25,
          bookingUrl: 'https://example.com',
        },
      ],

      alternateDates: [],

      largestAvailableGroupSize: 4,

      available: true,
    });

    getTokensForUser.mockResolvedValue(['invalid-token']);

    const firebaseError = new Error(
      'Registration token is not registered',
    ) as FirebaseMessagingError;

    Object.setPrototypeOf(firebaseError, FirebaseMessagingError.prototype);

    Object.defineProperty(firebaseError, 'code', {
      value: 'messaging/registration-token-not-registered',
    });

    sendAvailabilityNotification.mockRejectedValue(firebaseError);

    await service.checkActiveWatches();

    expect(removeToken).toHaveBeenCalledWith('invalid-token');

    expect(markMatched).not.toHaveBeenCalled();
  });

  it('removes an invalid token but still matches the watch when another device receives the push', async () => {
    getActiveWatches.mockResolvedValue([watch]);

    checkAvailability.mockResolvedValue({
      providerId: 'mock',
      requestedDate: watch.requestedDate,
      providerError: false,

      requestedDateSlots: [
        {
          id: 'slot-1',
          time: '9:00 AM',
          availableTickets: 4,
          pricePerPerson: 25,
          bookingUrl: 'https://example.com',
        },
      ],

      alternateDates: [],

      largestAvailableGroupSize: 4,

      available: true,
    });

    getTokensForUser.mockResolvedValue(['invalid-token', 'valid-token']);

    const firebaseError = new Error(
      'Registration token is not registered',
    ) as FirebaseMessagingError;

    Object.setPrototypeOf(firebaseError, FirebaseMessagingError.prototype);

    Object.defineProperty(firebaseError, 'code', {
      value: 'messaging/registration-token-not-registered',
    });

    sendAvailabilityNotification
      .mockRejectedValueOnce(firebaseError)
      .mockResolvedValueOnce('message-id-valid');

    await service.checkActiveWatches();

    expect(removeToken).toHaveBeenCalledWith('invalid-token');

    expect(sendAvailabilityNotification).toHaveBeenCalledTimes(2);

    expect(markMatched).toHaveBeenCalledWith(watch.id);
  });
});
