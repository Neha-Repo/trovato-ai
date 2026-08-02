import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';

import { ChatMessage } from '../../models/chat-message.model';
import { ChatService } from '../../services/chat.service';

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

  constructor(private readonly chatService: ChatService) {}

  get hasConversation(): boolean {
    return this.messages.length > 0;
  }

  selectSuggestion(text: string): void {
    this.userInput = text;
  }

  sendMessage(): void {
    const text = this.userInput.trim();

    if (!text) {
      return;
    }

    this.messages.push(
      this.chatService.createUserMessage(text)
    );

    this.userInput = '';

    window.setTimeout(() => {
      this.messages.push(
        this.chatService.createAssistantMessage(
  this.chatService.getAssistantResponse(text)
)
      );
    }, 900);
  }
}