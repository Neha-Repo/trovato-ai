import { Body, Controller, Post } from '@nestjs/common';

import { ChatService } from './chat.service';

interface ChatRequest {
  message: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() body: ChatRequest): Promise<{ reply: string }> {
    const reply = await this.chatService.sendMessage(body.message);

    return { reply };
  }
}
