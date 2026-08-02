import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): {
    status: string;
    service: string;
    version: string;
  } {
    return {
      status: 'ok',
      service: 'Trovato AI Backend',
      version: '0.1.0',
    };
  }
}
