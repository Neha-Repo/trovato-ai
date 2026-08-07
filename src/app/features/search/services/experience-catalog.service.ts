import { Injectable } from '@angular/core';

export interface Experience {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  bookingUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExperienceCatalogService {
  private readonly experiences: Experience[] = [
    {
      id: 'vatican-museums',
      title: 'Vatican Museums',
      location: 'Vatican City, Rome',
      imageUrl: 'assets/images/vatican-museums.jpg',
      bookingUrl:
        'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
    },
    {
      id: 'uffizi-gallery',
      title: 'Uffizi Gallery',
      location: 'Florence',
      imageUrl: 'assets/images/uffizi-gallery.jpg',
      bookingUrl:
        'https://www.uffizi.it/en/tickets',
    },
    {
      id: 'colosseum',
      title: 'Colosseum',
      location: 'Rome',
      imageUrl: 'assets/images/colosseum.jpg',
      bookingUrl:
        'https://ticketing.colosseo.it/en/',
    },
    {
      id: 'borghese-gallery',
      title: 'Borghese Gallery',
      location: 'Rome',
      imageUrl: 'assets/images/borghese-gallery.jpg',
      bookingUrl:
        'https://galleriaborghese.beniculturali.it/en/',
    },
    {
      id: 'accademia-gallery',
      title: 'Accademia Gallery',
      location: 'Florence',
      imageUrl: 'assets/images/accademia-gallery.jpg',
      bookingUrl:
        'https://www.galleriaaccademiafirenze.it/en/tickets/',
    },
    {
      id: 'pompeii',
      title: 'Pompeii Archaeological Park',
      location: 'Pompeii',
      imageUrl: 'assets/images/pompeii.jpg',
      bookingUrl:
        'https://www.ticketone.it/en/artist/scavi-pompei/',
    },
  ];

  getByTitle(title: string): Experience | null {
    const normalizedTitle = title.trim().toLowerCase();

    return (
      this.experiences.find(
        (experience) =>
          experience.title.toLowerCase() === normalizedTitle,
      ) ?? null
    );
  }

  getAll(): Experience[] {
    return [...this.experiences];
  }
}