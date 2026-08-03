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

@Injectable()
export class ChatService {
  constructor(private readonly ollamaService: OllamaService) {}
  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    const userMessages = messages
      .filter((message) => message.sender === 'user')
      .map((message) => message.text.trim().toLowerCase());

    const latestUserMessage = userMessages.at(-1) ?? '';
    const conversation = userMessages.join(' ');

    let experience = this.extractExperience(conversation);
    let city = this.extractCity(conversation);
    let extractedDate = this.extractDate(userMessages);
    let travellers = this.extractTravellerCount(
      conversation,
      latestUserMessage,
    );

    try {
      const aiSearch = await this.ollamaService.extractSearch(messages);

      experience = aiSearch.experience ?? experience;
      city = aiSearch.city ?? city;
      travellers = aiSearch.travellers ?? travellers;

      if (aiSearch.date) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        extractedDate =
          this.extractDate([aiSearch.date]) ??
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          this.extractIsoLikeDate(aiSearch.date);
      }
    } catch (error) {
      console.warn('Falling back to rule-based extraction.', error);
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

  private extractExperience(conversation: string): string | null {
    if (conversation.includes('vatican')) {
      return 'Vatican Museums';
    }

    if (conversation.includes('museum') || conversation.includes('gallery')) {
      return 'Museums';
    }

    if (conversation.includes('wine') || conversation.includes('vineyard')) {
      return 'Wine tour';
    }

    if (conversation.includes('football') || conversation.includes('match')) {
      return 'Football match';
    }

    return null;
  }

  private extractCity(conversation: string): string | null {
    const cities = [
      'vatican city',
      'rome',
      'florence',
      'milan',
      'venice',
      'siena',
    ];

    const city = cities.find((value) => conversation.includes(value));

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

  private extractTravellerCount(
    conversation: string,
    latestUserMessage: string,
  ): number | null {
    const explicitMatches = [
      ...conversation.matchAll(
        /\b(\d+)\s*(ticket|tickets|traveller|travellers|person|people|adult|adults)\b/gi,
      ),
    ];

    const latestExplicitMatch = explicitMatches.at(-1);

    if (latestExplicitMatch) {
      const count = Number(latestExplicitMatch[1]);

      return count > 0 ? count : null;
    }

    if (/^\d+$/.test(latestUserMessage)) {
      const count = Number(latestUserMessage);

      return count > 0 ? count : null;
    }

    return null;
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
  }
}
