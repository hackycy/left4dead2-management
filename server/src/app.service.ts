import { Injectable } from '@nestjs/common';
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { L4D2_PID_FILE_PATH } from './constant';
import { sleep } from './utils';

@Injectable()
export class AppService {
  private _eventEmitter = new EventEmitter();

  public get eventEmitter() {
    return this._eventEmitter;
  }

  sendNotifyMessage(msg: string) {
    this.eventEmitter.emit('event', { type: 'notify', data: msg });
  }

  sendRefreshMessage() {
    this.eventEmitter.emit('event', { type: 'refresh' });
  }

  async killL4d2Process(port: string | number) {
    const hasPidFile = existsSync(L4D2_PID_FILE_PATH);

    try {
      if (!hasPidFile) {
        throw new Error('未找到 PID 文件');
      }

      const pid = readFileSync(L4D2_PID_FILE_PATH, 'utf-8').trim();
      if (!pid) {
        throw new Error('PID 文件为空');
      }

      this.sendNotifyMessage(`正在停止服务，PID: ${pid}`);
      const processTree = execSync(`pstree -p ${pid}`).toString().trim();
      const pids = this.extractPids(processTree).reverse();

      // 逐个发送 SIGTERM 信号
      for (const pid of pids) {
        try {
          execSync(`kill -TERM ${pid}`, { stdio: 'ignore' });
        } catch {
          // ignore
        }
      }

      // 超时检测
      let timeout = 8;
      while (timeout > 0) {
        await sleep(1000);

        let isRunning = true;

        for (const pid of pids) {
          try {
            execSync(`kill -0 ${pid}`);
          } catch {
            isRunning = false;
          }
        }

        // 服务已停止，退出循环，停止检测
        if (!isRunning && !this.findL4d2ProcessStatusAlive(port)) {
          return;
        }

        timeout--;
      }

      this.sendNotifyMessage('服务停止超时，尝试强制停止');
      // 服务未停止，强制杀死
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`);
        } catch {
          // ignore
        }
      }
      this.forceKillL4d2Process();
    } catch {
      this.sendNotifyMessage('服务停止失败，尝试强制停止');
      this.forceKillL4d2Process();
    } finally {
      if (!this.findL4d2ProcessStatusAlive(port)) {
        this.sendNotifyMessage('服务已停止');
      }
      this.sendRefreshMessage();

      try {
        rmSync(L4D2_PID_FILE_PATH);
      } catch {
        // ignore
      }
    }
  }

  forceKillL4d2Process() {
    try {
      execSync(
        `ps -ef | grep "srcds_run" | grep -v grep  | awk '{print $2}' | xargs kill -9`,
        { stdio: 'inherit' },
      );
    } catch {
      // ignore
    }

    try {
      execSync(
        `ps -ef | grep "srcds_linux" | grep -v grep  | awk '{print $2}' | xargs kill -9`,
        { stdio: 'inherit' },
      );
    } catch {
      // ignore
    }
  }

  findL4d2ProcessStatusAlive(port: string | number): boolean {
    const udpPid = this.findProcessByPort(port);
    if (udpPid) {
      return true;
    }

    const srcdsLinuxPid = this.findSrcdsLinuxProcess();
    if (srcdsLinuxPid) {
      return true;
    }

    const srcdsRunPid = this.findSrcdsRunProcess();
    if (srcdsRunPid) {
      return true;
    }

    return false;
  }

  execShellScript(script: string) {
    const process = spawn('sh', [script], {
      detached: true,
      stdio: 'ignore',
    });

    const pid = process.pid?.toString() || '';

    // 写入 PID 文件
    if (pid) {
      writeFileSync(L4D2_PID_FILE_PATH, pid);
    }

    // 解除进程引用
    process.unref();

    this.sendNotifyMessage(`服务启动成功，PID: ${pid}`);
    this.sendRefreshMessage();
  }

  overwriteDirPermission(target: string) {
    // 不安全操作，还需要优化
    execSync(`sudo chmod -R 777 ${target}`, { stdio: 'inherit' });
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

  findSrcdsLinuxProcess(): string | null {
    const srcdsLinuxPid = execSync(
      `ps -ef | grep "srcds_linux" | grep -v grep  | awk '{print $2}'`,
      {
        stdio: 'pipe',
      },
    );

    return srcdsLinuxPid.toString().trim() || null;
  }

  findSrcdsRunProcess(): string | null {
    const srcdsRunPid = execSync(
      `ps -ef | grep "srcds_run" | grep -v grep  | awk '{print $2}'`,
      {
        stdio: 'pipe',
      },
    );

    return srcdsRunPid.toString().trim() || null;
  }

  extractPids(processTree: string): number[] {
    const pidRegex: RegExp = /\((\d+)\)/g;
    const pids: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = pidRegex.exec(processTree)) !== null) {
      pids.push(parseInt(match[1]));
    }

    return pids;
  }
}
