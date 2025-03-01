import { Body, Controller, Get, Post, Sse } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { currentLoad, mem } from 'systeminformation';
import { AppError } from './constant';

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

  @Post('api/stop')
  async stop(@Body('password') password: string) {
    const pwd = this.configService.get<string>('LEFT4DEAD2_PWD');
    if (pwd !== password) {
      throw new AppError('密码不正确');
    }

    const port = this.configService.get<string>('LEFT4DEAD2_PORT');
    if (!port) {
      throw new AppError('端口未配置');
    }

    await this.appService.killL4d2Process(port);
  }

  @Post('api/start')
  start(@Body('password') password: string) {
    const pwd = this.configService.get<string>('LEFT4DEAD2_PWD');
    if (pwd !== password) {
      throw new AppError('密码不正确');
    }

    const port = this.configService.get<string>('LEFT4DEAD2_PORT');
    if (!port) {
      throw new AppError('端口未配置');
    }

    const isRunning = this.appService.findL4d2ProcessStatusAlive(port);
    if (isRunning) {
      throw new AppError('服务已启动');
    }

    const sh = this.configService.get<string>('LEFT4DEAD2_SHELL_PATH');
    if (!sh) {
      throw new AppError('缺少配置，无法启动服务');
    }

    const target = this.configService.get<string>('LEFT4DEAD2_INSTALL_PATH');
    if (target) {
      this.appService.overwriteDirPermission(target);
    }

    this.appService.execShellScript(sh);
  }

  @Get('api/status')
  status() {
    const port = this.configService.get<string>('LEFT4DEAD2_PORT');
    if (!port) {
      throw new AppError('端口未配置');
    }

    // 避免僵尸进程误判未运行
    const active = this.appService.findL4d2ProcessStatusAlive(port);

    return active ? 'running' : 'stopped';
  }

  @Get('api/metrics')
  async metrics() {
    const [cpu, memory] = await Promise.all([currentLoad(), mem()]);

    const realUsed = memory.total - memory.available;
    const usagePercent = Math.round((realUsed / memory.total) * 100);

    return {
      cpu: Math.round(cpu.currentLoad),
      mem: usagePercent,
    };
  }
}
