import { Injectable } from '@nestjs/common';
import { spawn, execSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { SERVER_LOG_FILE_PATH } from './constant';

@Injectable()
export class AppService {
  private logStream = createWriteStream(SERVER_LOG_FILE_PATH, {
    flags: 'a',
  });

  findProcessByPort(port: number | string): string {
    try {
      const result = execSync(`lsof -i tcp:${port} -i udp:${port} -t`, {
        stdio: 'pipe',
      })
        .toString()
        .trim();
      return result;
    } catch {
      return '';
    }
  }

  isPortOccupied(port: number | string): boolean {
    return !!this.findProcessByPort(port);
  }

  execShellScript(script: string) {
    const process = spawn('sh', [script], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    process.on('error', (error) => {
      const logEntry = `[${new Date().toISOString()}] ${error.message}\n`;
      this.logStream.write(logEntry);
    });

    // 解除进程引用
    process.unref();
  }

  killProcess(pids: number | string) {
    execSync(`kill -9 ${pids}`, { stdio: 'ignore' });
  }

  chmodRW(target: string) {
    execSync(`sudo chmod -R a+rwX ${target}`, { stdio: 'inherit' });
  }
}
