import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  async sendMessage(message: string): Promise<string> {
    const normalizedMessage = message.trim().toLowerCase();

    await this.simulateDelay();

    if (
      normalizedMessage.includes('museum') ||
      normalizedMessage.includes('vatican')
    ) {
      return 'Which city are you visiting, on what date, and how many travellers are in your group?';
    }

    if (
      normalizedMessage.includes('art') ||
      normalizedMessage.includes('gallery')
    ) {
      return 'Are you interested in Renaissance art, modern art, or a mix of both? Also tell me which city you are visiting.';
    }

    if (
      normalizedMessage.includes('wine') ||
      normalizedMessage.includes('vineyard')
    ) {
      return 'Would you prefer a vineyard tour, a guided tasting, or both? Tell me the region and date if you already know them.';
    }

    if (
      normalizedMessage.includes('football') ||
      normalizedMessage.includes('match')
    ) {
      return 'Which city or team are you interested in, and what dates will you be available?';
    }

    if (
      normalizedMessage.includes('florence') ||
      normalizedMessage.includes('rome') ||
      normalizedMessage.includes('milan') ||
      normalizedMessage.includes('venice')
    ) {
      return 'Great. Please also tell me the date, number of travellers, and the type of experience you want.';
    }

    return 'Tell me the city, date, number of travellers, and the kind of experience you would like to explore.';
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
  }
}
