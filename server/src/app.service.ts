import { Injectable } from '@nestjs/common';
import { spawn, execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { L4D2_PID_FILE_PATH } from './constant';

@Injectable()
export class AppService {
  private _eventEmitter = new EventEmitter();

  public get eventEmitter() {
    return this._eventEmitter;
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
      gid: 0,
    });

    process.on('error', (error) => {
      this.eventEmitter.emit('event', error.message);
    });

    const pid = process.pid?.toString() || '';

    // 写入 PID 文件
    if (pid) {
      writeFileSync(L4D2_PID_FILE_PATH, pid);
    }

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

  forceKillL4d2Process() {
    execSync(
      `ps -ef | grep "srcds_run" | grep -v grep  | awk '{print $2}' | xargs kill -9`,
      { stdio: 'inherit' },
    );
    execSync(
      `ps -ef | grep "srcds_linux" | grep -v grep  | awk '{print $2}' | xargs kill -9`,
      { stdio: 'inherit' },
    );
  }
}
