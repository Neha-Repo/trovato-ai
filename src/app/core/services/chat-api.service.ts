import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  reply: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/chat';

  sendMessage(message: string): Observable<ChatResponse> {
    const request: ChatRequest = { message };

    return this.http.post<ChatResponse>(this.apiUrl, request);
  }
}