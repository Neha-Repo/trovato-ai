import { Body, Controller, Post } from '@nestjs/common';

import { ChatService } from './chat.service';

interface ChatMessageRequest {
  sender: 'user' | 'assistant';
  text: string;
}

interface ChatRequest {
  messages: ChatMessageRequest[];
}

interface ChatResponse {
  reply: string;
  searchReady: boolean;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() body: ChatRequest): Promise<ChatResponse> {
    return this.chatService.sendMessage(body.messages);
  }
}