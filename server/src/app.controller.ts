import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get('stop')
  stop(): string {
    const pid = this.appService.findProcessByPort(
      this.configService.get<string>('LEFT4DEAD2_PORT')!,
    );
    if (pid) {
      this.appService.killProcess(pid);
    }

    return 'service is stopped';
  }

  @Get('start')
  start(): string {
    const isRunning = this.appService.isPortOccupied(
      this.configService.get<string>('LEFT4DEAD2_PORT')!,
    );

    if (isRunning) {
      return 'service is already running';
    }

    this.appService.execShellScript(
      this.configService.get<string>('LEFT4DEAD2_SHELL_PATH')!,
    );
    return 'service is starting';
  }

  @Get('status')
  status(): string {
    const isRunning = this.appService.isPortOccupied(
      this.configService.get<string>('LEFT4DEAD2_PORT')!,
    );
    return JSON.stringify({
      status: 0,
      message: isRunning ? 'running' : 'stopped',
    });
  }

  @Get('grant')
  grant(): string {
    try {
      this.appService.overwriteDirPermission(
        join(
          this.configService.get<string>('LEFT4DEAD2_INSTALL_PATH')!,
          'left4dead2/addons',
        ),
      );
      return 'permission granted';
    } catch (error) {
      return `${error}`;
    }
  }
}
