import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ChatMessage } from '../../features/chat/models/chat-message.model';

export interface SearchRequest {
  experience: string;
  city: string;
  date: string;
  travellers: number;
}

interface ChatRequest {
  messages: ChatMessage[];
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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/chat';

  sendMessages(messages: ChatMessage[]): Observable<ChatResponse> {
    const request: ChatRequest = { messages };

    return this.http.post<ChatResponse>(this.apiUrl, request);
  }
}