import {
  Injectable,
  inject,
} from '@angular/core';
import {
  HttpClient,
} from '@angular/common/http';
import {
  Observable,
} from 'rxjs';

import {
  ChatMessage,
} from '../../features/chat/models/chat-message.model';

import {
  environment,
} from '../../../environments/environment';

export interface SearchRequest {
  experience: string;
  city: string;
  date: string;
  travellers: number;
}

interface ChatRequestMessage {
  sender: 'user' | 'assistant';
  text: string;
}

interface ChatRequest {
  messages: ChatRequestMessage[];
}

export interface ChatResponse {
  reply: string;
  searchReady: boolean;
  search?: SearchRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
  `${environment.apiBaseUrl}/chat`;

  sendMessages(
    messages: ChatMessage[],
  ): Observable<ChatResponse> {
    const request: ChatRequest = {
      messages:
        messages.map(
          (message) => ({
            sender:
              message.sender,
            text:
              message.text,
          }),
        ),
    };

    return this.http.post<ChatResponse>(
      this.apiUrl,
      request,
    );
  }
}