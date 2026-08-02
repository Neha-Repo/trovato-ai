import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';

import { ChatMessage } from '../../models/chat-message.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule],
})
export class ChatPage {
  userInput = '';
  messages: ChatMessage[] = [];

  get hasConversation(): boolean {
    return this.messages.length > 0;
  }

  sendMessage(): void {
  const text = this.userInput.trim();

  if (!text) {
    return;
  }

  this.messages.push({
    id: crypto.randomUUID(),
    sender: 'user',
    text,
    createdAt: new Date(),
  });

  this.userInput = '';

  window.setTimeout(() => {
    this.messages.push({
      id: crypto.randomUUID(),
      sender: 'assistant',
      text:
        'Great choice. I’ll help you find available tickets, suitable times, and alternatives if your preferred option is sold out.',
      createdAt: new Date(),
    });
  }, 900);
}
selectSuggestion(text: string): void {
  this.userInput = text;
}
}