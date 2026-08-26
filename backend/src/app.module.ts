import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AvailabilityModule } from './availability/availability.module';
import { AlertsModule } from './alerts/alerts.module';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { OllamaService } from './chat/ollama.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PushModule } from './push/push.module';
import { validateEnvironment } from './config/validate-env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ScheduleModule.forRoot(),
    AvailabilityModule,
    AlertsModule,
    PushModule,
  ],

  controllers: [AppController, ChatController],

  providers: [AppService, ChatService, OllamaService],
})
export class AppModule {}
