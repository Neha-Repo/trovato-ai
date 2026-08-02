import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ChatMessage } from '../../features/chat/models/chat-message.model';

interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  searchReady: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/chat';

  sendMessages(messages: ChatMessage[]): Observable<ChatResponse> {
    const request: ChatRequest = { messages };

    return this.http.post<ChatResponse>(this.apiUrl, request);
  }
}