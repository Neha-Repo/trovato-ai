import { Injectable } from '@nestjs/common';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

interface ChatResponse {
  reply: string;
  searchReady: boolean;
}

@Injectable()
export class ChatService {
  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    await this.simulateDelay();

    const userMessages = messages
      .filter((message) => message.sender === 'user')
      .map((message) => message.text.trim().toLowerCase());

    const latestUserMessage = userMessages.at(-1) ?? '';

    const conversation = userMessages.join(' ');

    const hasExperience =
      conversation.includes('museum') ||
      conversation.includes('vatican') ||
      conversation.includes('gallery');

    const hasCity =
      conversation.includes('rome') ||
      conversation.includes('florence') ||
      conversation.includes('milan') ||
      conversation.includes('venice') ||
      conversation.includes('vatican city') ||
      conversation.includes('vatican');

    const hasDate =
      conversation.includes('today') ||
      conversation.includes('tomorrow') ||
      /\b\d{1,2}\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\b/i.test(
        conversation,
      ) ||
      /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+\d{1,2}\b/i.test(
        conversation,
      );

    const numericTravellerCount = Number(latestUserMessage);

    const hasTicketCount =
      /\b\d+\s*(ticket|tickets|traveller|travellers|person|people|adult|adults)\b/i.test(
        conversation,
      ) ||
      (/^\d+$/.test(latestUserMessage) && numericTravellerCount > 0);

    if (!hasExperience) {
      return {
        reply: 'What attraction or type of experience would you like to visit?',
        searchReady: false,
      };
    }

    if (!hasCity) {
      return {
        reply: 'Which city are you visiting?',
        searchReady: false,
      };
    }

    if (!hasDate) {
      return {
        reply: 'What date would you like to visit?',
        searchReady: false,
      };
    }

    if (!hasTicketCount) {
      return {
        reply: 'How many people are travelling with you?',
        searchReady: false,
      };
    }

    return {
      reply:
        'Perfect! I have everything I need. Let me check the available time slots for your group.',
      searchReady: true,
    };
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
  }
}
