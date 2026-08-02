import { Injectable } from '@angular/core';

import { SearchResult } from '../models/search-result.model';

@Injectable({
  providedIn: 'root',
})
export class SearchResultsService {
  getAvailableResult(): SearchResult {
    return {
      id: 'vatican-museums',
      title: 'Vatican Museums',
      location: 'Vatican City, Rome',
      imageUrl: 'assets/images/vatican-museums.jpg',

      requestedDate: '3 August 2026',
      requestedTicketCount: 3,
      status: 'available',

      requestedDateSlots: [
        {
          id: 'vatican-2026-08-03-1100',
          time: '11:00 AM',
          availableTickets: 5,
          pricePerPerson: 20,
          bookingUrl:
            'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
        },
        {
          id: 'vatican-2026-08-03-1400',
          time: '2:00 PM',
          availableTickets: 8,
          pricePerPerson: 24,
          bookingUrl:
            'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
        },
      ],

      alternateDates: [
        {
          date: '4 August 2026',
          slots: [
            {
              id: 'vatican-2026-08-04-0900',
              time: '9:00 AM',
              availableTickets: 6,
              pricePerPerson: 20,
              bookingUrl:
                'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
            },
            {
              id: 'vatican-2026-08-04-1300',
              time: '1:00 PM',
              availableTickets: 10,
              pricePerPerson: 22,
              bookingUrl:
                'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
            },
          ],
        },
        {
          date: '5 August 2026',
          slots: [
            {
              id: 'vatican-2026-08-05-1030',
              time: '10:30 AM',
              availableTickets: 4,
              pricePerPerson: 20,
              bookingUrl:
                'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
            },
          ],
        },
        {
          date: '6 August 2026',
          slots: [
            {
              id: 'vatican-2026-08-06-1200',
              time: '12:00 PM',
              availableTickets: 12,
              pricePerPerson: 24,
              bookingUrl:
                'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
            },
          ],
        },
      ],
    };
  }

  getUnavailableResult(): SearchResult {
    return {
      id: 'vatican-museums',
      title: 'Vatican Museums',
      location: 'Vatican City, Rome',
      imageUrl: 'assets/images/vatican-museums.jpg',

      requestedDate: '3 August 2026',
      requestedTicketCount: 3,
      status: 'unavailable',

      requestedDateSlots: [],

      alternateDates: [
        {
          date: '4 August 2026',
          slots: [
            {
              id: 'vatican-2026-08-04-0900',
              time: '9:00 AM',
              availableTickets: 6,
              pricePerPerson: 20,
              bookingUrl:
                'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
            },
          ],
        },
        {
          date: '5 August 2026',
          slots: [
            {
              id: 'vatican-2026-08-05-1030',
              time: '10:30 AM',
              availableTickets: 4,
              pricePerPerson: 20,
              bookingUrl:
                'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
            },
          ],
        },
        {
          date: '6 August 2026',
          slots: [
            {
              id: 'vatican-2026-08-06-1200',
              time: '12:00 PM',
              availableTickets: 12,
              pricePerPerson: 24,
              bookingUrl:
                'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
            },
          ],
        },
      ],

      suggestedExperiences: [
        {
          id: 'castel-sant-angelo',
          title: 'Castel Sant’Angelo',
          location: 'Rome',
          imageUrl: 'assets/images/castel-sant-angelo.jpg',
        },
        {
          id: 'borghese-gallery',
          title: 'Borghese Gallery',
          location: 'Rome',
          imageUrl: 'assets/images/borghese-gallery.jpg',
        },
        {
          id: 'capitoline-museums',
          title: 'Capitoline Museums',
          location: 'Rome',
          imageUrl: 'assets/images/capitoline-museums.jpg',
        },
      ],
    };
  }
}