import { Injectable } from '@nestjs/common';
import { spawn, execSync } from 'node:child_process';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  findProcessByPort(port: number | string = 27015): string {
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

  isPortOccupied(port: number | string = 27015): boolean {
    return !!this.findProcessByPort(port);
  }

  execShellScript(script: string) {
    const child = spawn(script, {
      detached: true,
      stdio: 'ignore',
      shell: '/bin/bash',
    });

    child.unref();
  }

  killProcess(pids: number | string) {
    execSync(`kill -9 ${pids}`, { stdio: 'ignore' });
  }

  chmod(path: string) {
    execSync(`sudo chmod -R 777 ${path}`, { stdio: 'inherit' });
  }
}
