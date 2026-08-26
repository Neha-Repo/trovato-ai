import { Body, Controller, Post } from '@nestjs/common';

import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatService } from './chat.service';

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
  async sendMessage(
    @Body()
    body: ChatRequestDto,
  ): Promise<ChatResponse> {
    return this.chatService.sendMessage(body.messages);
  }
}
