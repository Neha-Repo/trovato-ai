import { Injectable } from '@angular/core';

import { ChatMessage } from '../models/chat-message.model';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  createUserMessage(text: string): ChatMessage {
    return {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      createdAt: new Date(),
    };
  }

  createAssistantMessage(text: string): ChatMessage {
    return {
      id: crypto.randomUUID(),
      sender: 'assistant',
      text,
      createdAt: new Date(),
    };
  }

  getAssistantResponse(userMessage: string): string {
    const normalizedMessage = userMessage.toLowerCase();

    if (
      normalizedMessage.includes('museum') ||
      normalizedMessage.includes('vatican')
    ) {
      return 'Great choice. Which city are you visiting, and on what date?';
    }

    if (
      normalizedMessage.includes('art') ||
      normalizedMessage.includes('gallery')
    ) {
      return 'Italy has exceptional art collections. Are you interested in Renaissance art, modern art, or both?';
    }

    if (
      normalizedMessage.includes('wine') ||
      normalizedMessage.includes('vineyard')
    ) {
      return 'Excellent choice. Would you prefer a vineyard tour, a wine tasting, or both?';
    }

    if (
      normalizedMessage.includes('football') ||
      normalizedMessage.includes('match')
    ) {
      return 'Italy has an incredible football culture. Which city or team are you interested in?';
    }

    return 'Tell me the city, date, number of travellers, and the type of experience you are looking for.';
  }
}