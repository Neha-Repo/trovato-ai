import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AvailabilityModule } from './availability/availability.module';
import { AlertsModule } from './alerts/alerts.module';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { OllamaService } from './chat/ollama.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AvailabilityModule,
    AlertsModule,
  ],

  controllers: [AppController, ChatController],

  providers: [AppService, ChatService, OllamaService],
})
export class AppModule {}
