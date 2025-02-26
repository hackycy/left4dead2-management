import { Injectable } from '@nestjs/common';
import { spawn, execSync } from 'node:child_process';
import { createWriteStream, type WriteStream } from 'node:fs';
import { EventEmitter } from 'node:events';
import { SERVER_LOG_FILE_PATH } from './constant';

@Injectable()
export class AppService {
  private _logStream: WriteStream;
  private _eventEmitter = new EventEmitter();

  public get eventEmitter() {
    return this._eventEmitter;
  }

  public get logStream() {
    if (!this._logStream) {
      this._logStream = createWriteStream(SERVER_LOG_FILE_PATH, {
        flags: 'a',
      });
    }

    return this._logStream;
  }

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

  execShellScript(script: string) {
    const process = spawn('sh', [script], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    process.on('error', (error) => {
      this.eventEmitter.emit('event', error.message);
      const logEntry = `[${new Date().toISOString()}] ${error.message}\n`;
      this.logStream.write(logEntry);
    });

    // 解除进程引用
    process.unref();
  }

  killProcess(pids: number | string) {
    execSync(`kill -9 ${pids}`, { stdio: 'ignore' });
  }

  overwritePermission(target: string, group?: string) {
    if (!group) {
      // unsafely
      execSync(`sudo chmod -R 777 ${target}`, { stdio: 'inherit' });
    } else {
      if (!this.checkGroupExists(group)) {
        throw new Error(`Group ${group} does not exist`);
      }

      execSync(`sudo chown -R :${group} "${target}"`, { stdio: 'inherit' });
      execSync(`sudo chmod -R 770 "${target}"`, { stdio: 'inherit' });
    }
  }

  checkGroupExists(group: string): boolean {
    try {
      const output = execSync(`getent group ${group}`, {
        stdio: 'pipe',
      });
      return !!output.toString().trim();
    } catch {
      return false;
    }
  }
}
