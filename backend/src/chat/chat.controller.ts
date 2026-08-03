import { Body, Controller, Post } from '@nestjs/common';

import { ChatService } from './chat.service';

interface ChatMessageRequest {
  sender: 'user' | 'assistant';
  text: string;
}

interface ChatRequest {
  messages: ChatMessageRequest[];
}

interface SearchRequest {
  experience: string;
  city: string;
  date: string;
  travellers: number;
}

interface ChatResponse {
  reply: string;
  searchReady: boolean;
  search?: SearchRequest;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() body: ChatRequest): Promise<ChatResponse> {
    return this.chatService.sendMessage(body.messages);
  }
}