import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/standalone';

import { ChatApiService } from '../../../../core/services/chat-api.service';
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
  isSending = false;

  constructor(
    private readonly chatService: ChatService,
    private readonly chatApiService: ChatApiService,
    private readonly router: Router,
  ) {}

  get hasConversation(): boolean {
    return this.messages.length > 0;
  }

  selectSuggestion(text: string): void {
    this.userInput = text;
  }

  async sendMessage(): Promise<void> {
    const text = this.userInput.trim();

    if (!text || this.isSending) {
      return;
    }

    const userMessage = this.chatService.createUserMessage(text);

    this.messages.push(userMessage);
    this.userInput = '';
    this.isSending = true;

    try {
      const response = await firstValueFrom(
        this.chatApiService.sendMessages(this.messages),
      );

      this.messages.push(
        this.chatService.createAssistantMessage(response.reply),
      );

      if (response.searchReady) {
        window.setTimeout(() => {
          void this.router.navigate(['/results']);
        }, 900);
      }
    } catch (error: unknown) {
      console.error('Chat request failed', error);

      this.messages.push(
        this.chatService.createAssistantMessage(
          'I could not reach the Trovato AI service. Please try again.',
        ),
      );
    } finally {
      this.isSending = false;
    }
  }
}