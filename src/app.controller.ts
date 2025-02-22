import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('stop')
  stop(): string {
    const pid = this.appService.findProcessByPort();
    if (pid) {
      this.appService.killProcess(pid);
    }

    return 'service is stopped';
  }

  @Get('start')
  start(): string {
    if (this.appService.isPortOccupied()) {
      return 'service is running';
    }

    return 'service is starting';
  }

  @Get('status')
  status(): string {
    return this.appService.isPortOccupied() ? 'running' : 'stopped';
  }
}
