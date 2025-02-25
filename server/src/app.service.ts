import { Injectable } from '@nestjs/common';
import { spawn, execSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class AppService {
  private logStream = createWriteStream(join(__dirname, '../server.log'), {
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

  chmod(path: string) {
    execSync(`sudo chmod -R 777 ${path}`, { stdio: 'inherit' });
  }
}
