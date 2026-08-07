import { Injectable } from '@angular/core';

export interface Experience {
  id: string;
  title: string;
  aliases: string[];
  city: string;
  region: string;
  nearbyCities: string[];
  location: string;
  imageUrl: string;
  bookingUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExperienceCatalogService {
  private readonly experiences: Experience[] = [
    // ---------------------------------------------------------
    // ROME / LAZIO
    // ---------------------------------------------------------

    {
      id: 'vatican-museums',
      title: 'Vatican Museums',
      aliases: [
        'Vatican',
        'Vatican Museum',
        'Vatican Museums',
        'Vatican City',
        'Vatican City Museums',
        'Sistine Chapel',
      ],
      city: 'Rome',
      region: 'Lazio',
      nearbyCities: [],
      location: 'Vatican City, Rome',
      imageUrl: 'assets/images/vatican-museums.jpg',
      bookingUrl:
        'https://tickets.museivaticani.va/home/calendar/visit/Biglietti-Musei',
    },
    {
      id: 'colosseum',
      title: 'Colosseum',
      aliases: [
        'Colosseum',
        'Colosseum Rome',
        'Roman Colosseum',
        'Coliseum',
        'Coliseum Rome',
      ],
      city: 'Rome',
      region: 'Lazio',
      nearbyCities: [],
      location: 'Rome',
      imageUrl: 'assets/images/colosseum.jpg',
      bookingUrl:
        'https://ticketing.colosseo.it/en/',
    },
    {
      id: 'borghese-gallery',
      title: 'Borghese Gallery',
      aliases: [
        'Borghese',
        'Borghese Gallery',
        'Galleria Borghese',
        'Borghese Museum',
      ],
      city: 'Rome',
      region: 'Lazio',
      nearbyCities: [],
      location: 'Rome',
      imageUrl: 'assets/images/borghese-gallery.jpg',
      bookingUrl:
        'https://galleriaborghese.beniculturali.it/en/',
    },
    {
      id: 'castel-sant-angelo',
      title: 'Castel Sant’Angelo',
      aliases: [
        'Castel Sant Angelo',
        'Castel Sant’Angelo',
        'Castle Sant Angelo',
        'Mausoleum of Hadrian',
        'Hadrians Mausoleum',
      ],
      city: 'Rome',
      region: 'Lazio',
      nearbyCities: [],
      location: 'Rome',
      imageUrl: 'assets/images/castel-sant-angelo.jpg',
      bookingUrl:
        'https://direzionemuseiroma.cultura.gov.it/musei/castel-santangelo/',
    },
    {
      id: 'capitoline-museums',
      title: 'Capitoline Museums',
      aliases: [
        'Capitoline',
        'Capitoline Museum',
        'Capitoline Museums',
        'Musei Capitolini',
      ],
      city: 'Rome',
      region: 'Lazio',
      nearbyCities: [],
      location: 'Rome',
      imageUrl: 'assets/images/capitoline-museums.jpg',
      bookingUrl:
        'https://www.museicapitolini.org/',
    },

    // ---------------------------------------------------------
    // FLORENCE / TUSCANY
    // ---------------------------------------------------------

    {
      id: 'uffizi-gallery',
      title: 'Uffizi Gallery',
      aliases: [
        'Uffizi',
        'Uffizi Gallery',
        'Uffizi Museum',
        'Uffizi Museums',
        'Galleria degli Uffizi',
      ],
      city: 'Florence',
      region: 'Tuscany',
      nearbyCities: [],
      location: 'Florence',
      imageUrl: 'assets/images/uffizi-gallery.jpg',
      bookingUrl:
        'https://www.uffizi.it/en/tickets',
    },
    {
      id: 'accademia-gallery',
      title: 'Accademia Gallery',
      aliases: [
        'Accademia',
        'Accademia Gallery',
        'Accademia Museum',
        'Galleria dell Accademia',
        'Galleria dell’Accademia',
        'David Museum',
        'Michelangelo David',
      ],
      city: 'Florence',
      region: 'Tuscany',
      nearbyCities: [],
      location: 'Florence',
      imageUrl: 'assets/images/accademia-gallery.jpg',
      bookingUrl:
        'https://www.galleriaaccademiafirenze.it/en/tickets/',
    },
    {
      id: 'pitti-palace',
      title: 'Pitti Palace',
      aliases: [
        'Pitti',
        'Pitti Palace',
        'Palazzo Pitti',
      ],
      city: 'Florence',
      region: 'Tuscany',
      nearbyCities: [],
      location: 'Florence',
      imageUrl: 'assets/images/pitti-palace.jpg',
      bookingUrl:
        'https://www.uffizi.it/en/pitti-palace',
    },
    {
      id: 'boboli-gardens',
      title: 'Boboli Gardens',
      aliases: [
        'Boboli',
        'Boboli Garden',
        'Boboli Gardens',
        'Giardino di Boboli',
      ],
      city: 'Florence',
      region: 'Tuscany',
      nearbyCities: [],
      location: 'Florence',
      imageUrl: 'assets/images/boboli-gardens.jpg',
      bookingUrl:
        'https://www.uffizi.it/en/boboli-garden',
    },

    // ---------------------------------------------------------
    // CAMPANIA
    // ---------------------------------------------------------

    {
      id: 'pompeii',
      title: 'Pompeii Archaeological Park',
      aliases: [
        'Pompeii',
        'Pompei',
        'Pompeii ruins',
        'Pompei ruins',
        'Pompeii Archaeological Park',
        'Pompeii archaeological site',
        'Pompeii ruins tour',
      ],
      city: 'Pompeii',
      region: 'Campania',
      nearbyCities: [
        'Herculaneum',
        'Naples',
        'Mount Vesuvius',
        'Amalfi Coast',
      ],
      location: 'Pompeii',
      imageUrl: 'assets/images/pompeii.jpg',
      bookingUrl:
        'https://pompeiisites.org/en/visiting-info/timetables-and-tickets/',
    },
    {
      id: 'herculaneum',
      title: 'Herculaneum Archaeological Park',
      aliases: [
        'Herculaneum',
        'Herculaneum ruins',
        'Herculaneum Archaeological Park',
        'Ercolano',
        'Ercolano ruins',
      ],
      city: 'Herculaneum',
      region: 'Campania',
      nearbyCities: [
        'Pompeii',
        'Naples',
        'Mount Vesuvius',
      ],
      location: 'Herculaneum',
      imageUrl: 'assets/images/herculaneum.jpg',
      bookingUrl:
        'https://ercolano.cultura.gov.it/',
    },
    {
      id: 'naples-archaeological-museum',
      title: 'National Archaeological Museum of Naples',
      aliases: [
        'Naples Archaeological Museum',
        'National Archaeological Museum Naples',
        'National Archaeological Museum of Naples',
        'Naples Museum',
        'MANN',
        'MANN Naples',
      ],
      city: 'Naples',
      region: 'Campania',
      nearbyCities: [
        'Pompeii',
        'Herculaneum',
        'Mount Vesuvius',
        'Amalfi Coast',
      ],
      location: 'Naples',
      imageUrl:
        'assets/images/naples-archaeological-museum.jpg',
      bookingUrl:
        'https://mann-napoli.it/en/',
    },
    {
      id: 'mount-vesuvius',
      title: 'Mount Vesuvius',
      aliases: [
        'Vesuvius',
        'Mount Vesuvius',
        'Vesuvius Volcano',
        'Vesuvius tour',
        'Mount Vesuvius tour',
      ],
      city: 'Mount Vesuvius',
      region: 'Campania',
      nearbyCities: [
        'Pompeii',
        'Herculaneum',
        'Naples',
      ],
      location: 'Campania',
      imageUrl: 'assets/images/mount-vesuvius.jpg',
      bookingUrl:
        'https://www.parconazionaledelvesuvio.it/',
    },
    {
      id: 'amalfi-coast',
      title: 'Amalfi Coast',
      aliases: [
        'Amalfi',
        'Amalfi Coast',
        'Amalfi Coast tour',
        'Amalfi tour',
        'Costiera Amalfitana',
      ],
      city: 'Amalfi Coast',
      region: 'Campania',
      nearbyCities: [
        'Pompeii',
        'Naples',
      ],
      location: 'Campania',
      imageUrl: 'assets/images/amalfi-coast.jpg',
      bookingUrl:
        'https://www.italia.it/en/campania/amalfi-coast',
    },
  ];

  getByTitle(title: string): Experience | null {
    const normalizedSearch = this.normalize(title);

    if (!normalizedSearch) {
      return null;
    }

    /*
     * First try an exact canonical-title or alias match.
     */
    const exactMatch = this.experiences.find(
      (experience) => {
        if (
          this.normalize(experience.title) ===
          normalizedSearch
        ) {
          return true;
        }

        return experience.aliases.some(
          (alias) =>
            this.normalize(alias) === normalizedSearch,
        );
      },
    );

    if (exactMatch) {
      return exactMatch;
    }

    /*
     * Then allow a contained alias.
     *
     * This helps when Ollama returns values such as:
     *
     * "Pompeii ruins tour"
     * "tickets for the Uffizi Gallery"
     * "Rome Colosseum"
     */
    const partialMatch = this.experiences.find(
      (experience) => {
        const searchableNames = [
          experience.title,
          ...experience.aliases,
        ];

        return searchableNames.some((name) => {
          const normalizedName = this.normalize(name);

          if (normalizedName.length < 4) {
            return false;
          }

          return (
            normalizedSearch.includes(normalizedName) ||
            normalizedName.includes(normalizedSearch)
          );
        });
      },
    );

    return partialMatch ?? null;
  }

  getById(id: string): Experience | null {
    return (
      this.experiences.find(
        (experience) => experience.id === id,
      ) ?? null
    );
  }

  getByCity(city: string): Experience[] {
    const normalizedCity = this.normalize(city);

    return this.experiences.filter(
      (experience) =>
        this.normalize(experience.city) ===
        normalizedCity,
    );
  }

  getAlternatives(
    experienceId: string,
    city: string,
    limit = 3,
  ): Experience[] {
    const currentExperience =
      this.getById(experienceId);

    if (!currentExperience) {
      return [];
    }

    const results: Experience[] = [];

    /*
     * Use the catalog's canonical city when possible.
     *
     * The supplied city remains useful when the request
     * contains a valid city that differs from the title.
     */
    const requestedCity =
      city?.trim() || currentExperience.city;

    /*
     * Priority 1:
     * Same city.
     */
    const sameCityExperiences =
      this.experiences.filter(
        (experience) =>
          experience.id !== currentExperience.id &&
          this.normalize(experience.city) ===
            this.normalize(requestedCity),
      );

    this.addUniqueExperiences(
      results,
      sameCityExperiences,
      limit,
    );

    if (results.length >= limit) {
      return results.slice(0, limit);
    }

    /*
     * If Ollama supplied a broader/different location,
     * also try the experience's canonical city.
     */
    if (
      this.normalize(requestedCity) !==
      this.normalize(currentExperience.city)
    ) {
      const canonicalCityExperiences =
        this.experiences.filter(
          (experience) =>
            experience.id !== currentExperience.id &&
            this.normalize(experience.city) ===
              this.normalize(currentExperience.city),
        );

      this.addUniqueExperiences(
        results,
        canonicalCityExperiences,
        limit,
      );
    }

    if (results.length >= limit) {
      return results.slice(0, limit);
    }

    /*
     * Priority 2:
     * Explicit nearby destinations.
     */
    const nearbyCities =
      currentExperience.nearbyCities.map(
        (nearbyCity) =>
          this.normalize(nearbyCity),
      );

    const nearbyExperiences =
      this.experiences.filter(
        (experience) =>
          experience.id !== currentExperience.id &&
          nearbyCities.includes(
            this.normalize(experience.city),
          ),
      );

    this.addUniqueExperiences(
      results,
      nearbyExperiences,
      limit,
    );

    if (results.length >= limit) {
      return results.slice(0, limit);
    }

    /*
     * Priority 3:
     * Same region.
     *
     * This gives us a useful fallback while preventing
     * unrelated recommendations elsewhere in Italy.
     */
    const sameRegionExperiences =
      this.experiences.filter(
        (experience) =>
          experience.id !== currentExperience.id &&
          this.normalize(experience.region) ===
            this.normalize(currentExperience.region),
      );

    this.addUniqueExperiences(
      results,
      sameRegionExperiences,
      limit,
    );

    return results.slice(0, limit);
  }

  getAll(): Experience[] {
    return [...this.experiences];
  }

  private addUniqueExperiences(
    target: Experience[],
    candidates: Experience[],
    limit: number,
  ): void {
    for (const candidate of candidates) {
      if (target.length >= limit) {
        return;
      }

      const alreadyAdded = target.some(
        (experience) =>
          experience.id === candidate.id,
      );

      if (!alreadyAdded) {
        target.push(candidate);
      }
    }
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}