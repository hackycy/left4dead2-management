import { Controller, Get, Sse } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Sse('events')
  sse(): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      this.appService.eventEmitter.on('event', (data: unknown) => {
        subscriber.next({
          data,
        } as MessageEvent);
      });
    });
  }

  @Get('api/stop')
  stop() {
    this.appService.killL4d2Process();
  }

  @Get('api/start')
  start() {
    const pid = this.appService.findProcessByPort(
      this.configService.get<string>('LEFT4DEAD2_PORT')!,
    );

    if (pid) {
      throw new Error('Server is already running');
    }

    const sh = this.configService.get<string>('LEFT4DEAD2_SHELL_PATH');
    if (!sh) {
      throw new Error('Shell script not found');
    }

    const group = this.configService.get<string>('LEFT4DEAD2_GRANT_GROUP');
    const target = this.configService.get<string>('LEFT4DEAD2_INSTALL_PATH');

    if (target) {
      this.appService.overwritePermission(target, group);
    }

    this.appService.execShellScript(sh);
  }

  @Get('api/status')
  status() {
    const pid = this.appService.findProcessByPort(
      this.configService.get<string>('LEFT4DEAD2_PORT')!,
    );

    return {
      status: pid ? 'running' : 'stopped',
    };
  }
}
