import { Injectable } from '@nestjs/common';
import { OllamaService } from './ollama.service';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

interface SearchRequest {
  experience: string;
  city: string;
  date: string;
  travellers: number;
}

interface ChatResponse {
  reply: string;
  searchReady: boolean;
  search?: SearchRequest;
}

interface ExtractedDate {
  value: string;
  parsedDate: Date;
}

interface ExperienceAlias {
  canonicalName: string;
  aliases: string[];
}

@Injectable()
export class ChatService {
  private readonly experienceAliases: ExperienceAlias[] = [
    {
      canonicalName: 'Vatican Museums',
      aliases: ['vatican museums', 'vatican museum', 'vatican'],
    },
    {
      canonicalName: 'Uffizi Gallery',
      aliases: ['uffizi gallery', 'uffizi galleries', 'uffizi'],
    },
    {
      canonicalName: 'Accademia Gallery',
      aliases: [
        'accademia gallery',
        'galleria dell accademia',
        "galleria dell'accademia",
        'accademia',
      ],
    },
    {
      canonicalName: 'Colosseum',
      aliases: ['colosseum', 'coliseum', 'colosseo'],
    },
    {
      canonicalName: 'Borghese Gallery',
      aliases: ['borghese gallery', 'galleria borghese', 'borghese'],
    },
    {
      canonicalName: 'Pompeii Archaeological Park',
      aliases: ['pompeii archaeological park', 'pompeii ruins', 'pompeii'],
    },
    {
      canonicalName: 'Herculaneum Archaeological Park',
      aliases: [
        'herculaneum archaeological park',
        'herculaneum ruins',
        'herculaneum',
        'ercolano',
      ],
    },
    {
      canonicalName: 'National Archaeological Museum of Naples',
      aliases: [
        'national archaeological museum of naples',
        'naples national archaeological museum',
        'naples archaeological museum',
        'museo archeologico nazionale di napoli',
        'mann',
      ],
    },
    {
      canonicalName: 'Mount Vesuvius',
      aliases: ['mount vesuvius', 'vesuvius', 'vesuvio'],
    },
    {
      canonicalName: 'Amalfi Coast',
      aliases: ['amalfi coast', 'amalfi'],
    },
  ];

  private readonly knownCities = [
    'vatican city',
    'rome',
    'florence',
    'milan',
    'venice',
    'siena',
    'pompeii',
    'naples',
    'herculaneum',
    'amalfi',
  ];

  constructor(private readonly ollamaService: OllamaService) {}

  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    const userMessages = messages
      .filter((message) => message.sender === 'user')
      .map((message) => message.text.trim().toLowerCase());

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const latestUserMessage = userMessages.at(-1) ?? '';

    /*
     * Extract conversational fields using
     * newest-message-first precedence.
     *
     * This prevents an old attraction or city
     * from overriding a newer correction.
     */
    let experience = this.extractExperienceFromMessages(userMessages);

    let city = this.extractCityFromMessages(userMessages);

    let extractedDate = this.extractDate(userMessages);

    let travellers = this.extractTravellerCountFromMessages(userMessages);

    try {
      const aiSearch = await this.ollamaService.extractSearch(messages);

      /*
       * Deterministic extraction wins only
       * when it found a relevant value using
       * newest-message-first precedence.
       *
       * Ollama fills remaining gaps.
       */
      experience = experience ?? aiSearch.experience;

      city = city ?? aiSearch.city;

      travellers = travellers ?? aiSearch.travellers;

      if (!extractedDate && aiSearch.date) {
        extractedDate = this.extractDate([aiSearch.date]);
      }
    } catch (error: unknown) {
      console.warn(
        'Falling back to rule-based extraction.',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    if (!experience) {
      return {
        reply: 'What attraction or type of experience would you like to visit?',
        searchReady: false,
      };
    }

    if (!city) {
      return {
        reply: 'Which city are you visiting?',
        searchReady: false,
      };
    }

    if (!extractedDate) {
      return {
        reply: 'What date would you like to visit?',
        searchReady: false,
      };
    }

    if (this.isPastDate(extractedDate.parsedDate)) {
      return {
        reply:
          'That date has already passed. What future date would you like to visit?',
        searchReady: false,
      };
    }

    if (!travellers) {
      return {
        reply: 'How many people are travelling with you?',
        searchReady: false,
      };
    }

    return {
      reply:
        'Perfect! I have everything I need. Let me check the available time slots for your group.',

      searchReady: true,

      search: {
        experience,
        city,
        date: extractedDate.value,
        travellers,
      },
    };
  }

  private extractExperienceFromMessages(userMessages: string[]): string | null {
    for (let index = userMessages.length - 1; index >= 0; index -= 1) {
      const experience = this.extractExperienceFromText(userMessages[index]);

      if (experience) {
        return experience;
      }
    }

    return null;
  }

  private extractExperienceFromText(text: string): string | null {
    for (const experience of this.experienceAliases) {
      const matched = experience.aliases.some((alias) => text.includes(alias));

      if (matched) {
        return experience.canonicalName;
      }
    }

    if (text.includes('wine') || text.includes('vineyard')) {
      return 'Wine tour';
    }

    if (text.includes('football') || text.includes('match')) {
      return 'Football match';
    }

    return null;
  }

  private extractCityFromMessages(userMessages: string[]): string | null {
    for (let index = userMessages.length - 1; index >= 0; index -= 1) {
      const city = this.extractCityFromText(userMessages[index]);

      if (city) {
        return city;
      }
    }

    return null;
  }

  private extractCityFromText(text: string): string | null {
    const city = this.knownCities.find((value) => text.includes(value));

    if (!city) {
      return null;
    }

    return city
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private extractDate(userMessages: string[]): ExtractedDate | null {
    for (let index = userMessages.length - 1; index >= 0; index -= 1) {
      const extractedDate = this.extractDateFromText(userMessages[index]);

      if (extractedDate) {
        return extractedDate;
      }
    }

    return null;
  }

  private extractDateFromText(text: string): ExtractedDate | null {
    const today = this.startOfDay(new Date());

    if (/\btoday\b/i.test(text)) {
      return {
        value: this.formatDate(today),

        parsedDate: today,
      };
    }

    if (/\btomorrow\b/i.test(text)) {
      const tomorrow = new Date(today);

      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        value: this.formatDate(tomorrow),

        parsedDate: tomorrow,
      };
    }

    const dayMonthMatch = text.match(
      /\b(\d{1,2})\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)(?:\s+(\d{4}))?\b/i,
    );

    if (dayMonthMatch) {
      return this.createExtractedDate(
        Number(dayMonthMatch[1]),

        dayMonthMatch[2],

        dayMonthMatch[3] ? Number(dayMonthMatch[3]) : today.getFullYear(),
      );
    }

    const monthDayMatch = text.match(
      /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:\s+(\d{4}))?\b/i,
    );

    if (monthDayMatch) {
      return this.createExtractedDate(
        Number(monthDayMatch[2]),

        monthDayMatch[1],

        monthDayMatch[3] ? Number(monthDayMatch[3]) : today.getFullYear(),
      );
    }

    return null;
  }

  private createExtractedDate(
    day: number,
    monthInput: string,
    year: number,
  ): ExtractedDate | null {
    const monthIndex = this.getMonthIndex(monthInput);

    if (monthIndex === null) {
      return null;
    }

    const parsedDate = new Date(year, monthIndex, day);

    const isValidDate =
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === monthIndex &&
      parsedDate.getDate() === day;

    if (!isValidDate) {
      return null;
    }

    return {
      value: this.formatDate(parsedDate),

      parsedDate: this.startOfDay(parsedDate),
    };
  }

  private getMonthIndex(monthInput: string): number | null {
    const monthIndexes: Record<string, number> = {
      jan: 0,
      january: 0,

      feb: 1,
      february: 1,

      mar: 2,
      march: 2,

      apr: 3,
      april: 3,

      may: 4,

      jun: 5,
      june: 5,

      jul: 6,
      july: 6,

      aug: 7,
      august: 7,

      sep: 8,
      september: 8,

      oct: 9,
      october: 9,

      nov: 10,
      november: 10,

      dec: 11,
      december: 11,
    };

    return monthIndexes[monthInput.toLowerCase()] ?? null;
  }

  private isPastDate(date: Date): boolean {
    const today = this.startOfDay(new Date());

    return date.getTime() < today.getTime();
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private extractTravellerCountFromMessages(
    userMessages: string[],
  ): number | null {
    for (let index = userMessages.length - 1; index >= 0; index -= 1) {
      const count = this.extractTravellerCountFromText(userMessages[index]);

      if (count) {
        return count;
      }
    }

    return null;
  }

  private extractTravellerCountFromText(text: string): number | null {
    /*
     * Direct forms:
     *
     * "2 tickets"
     * "4 people"
     * "3 travellers"
     */
    const directMatches = [
      ...text.matchAll(
        /\b(\d+)\s*(ticket|tickets|traveller|travellers|traveler|travelers|person|people|adult|adults)\b/gi,
      ),
    ];

    const latestDirectMatch = directMatches.at(-1);

    if (latestDirectMatch) {
      const count = Number(latestDirectMatch[1]);

      return count > 0 ? count : null;
    }

    /*
     * Attraction-between-number-and-ticket forms:
     *
     * "2 Vatican Museums tickets"
     * "3 Uffizi Gallery tickets"
     * "4 Colosseum tickets"
     *
     * The month guard prevents dates such as
     * "25 August ... tickets" from becoming
     * traveller counts.
     */
    const attractionTicketMatches = [
      ...text.matchAll(
        /\b(\d+)(?!\s+(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\b)(?:\s+[a-z][a-z'-]*){1,5}\s+tickets?\b/gi,
      ),
    ];

    const latestAttractionTicketMatch = attractionTicketMatches.at(-1);

    if (latestAttractionTicketMatch) {
      const count = Number(latestAttractionTicketMatch[1]);

      return count > 0 ? count : null;
    }

    /*
     * Conversational follow-up:
     *
     * User: "How many?"
     * User: "4"
     */
    if (/^\d+$/.test(text.trim())) {
      const count = Number(text.trim());

      return count > 0 ? count : null;
    }

    return null;
  }
}
