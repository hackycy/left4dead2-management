import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

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
    if (
      this.appService.isPortOccupied(
        this.configService.get<string>('LEFT4DEAD2_PORT')!,
      )
    ) {
      return 'service is running';
    }

    this.appService.execShellScript(
      this.configService.get<string>('LEFT4DEAD2_SHELL_PATH')!,
    );
    return 'service is starting';
  }

  @Get('status')
  status(): string {
    return this.appService.isPortOccupied(
      this.configService.get<string>('LEFT4DEAD2_PORT')!,
    )
      ? 'running'
      : 'stopped';
  }

  @Get('grant')
  grant(): string {
    try {
      this.appService.chmod(
        this.configService.get<string>('LEFT4DEAD2_INSTALL_PATH')!,
      );
      return 'permission granted';
    } catch (error) {
      return `${error}`;
    }
  }
}
