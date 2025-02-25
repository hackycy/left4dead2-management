import { Injectable } from '@nestjs/common';
import { spawn, execSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { SERVER_LOG_FILE_PATH } from './constant';

@Injectable()
export class AppService {
  private logStream = createWriteStream(SERVER_LOG_FILE_PATH, {
    flags: 'a',
  });

  findProcessByPort(port: number | string): string | null {
    try {
      const output = execSync(`lsof -i tcp:${port} -i udp:${port} -t`, {
        stdio: 'pipe',
      });
      return output.toString().trim() || null;
    } catch {
      return null;
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

  overwriteDirPermission(target: string) {
    execSync(`sudo chmod -R 770 ${target}`, { stdio: 'inherit' });
  }

  checkGroupExists(group: string): boolean {
    try {
      const output = execSync(`getent group ${group}`, {
        stdio: 'pipe',
      });
      return output.toString().trim() !== '';
    } catch {
      return false;
    }
  }
}
