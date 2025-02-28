import { join } from 'node:path';

export const SERVER_LOG_FILE = 'server.log';

export const L4D2_PID_FILE = 'l4d2.pid';

export const SERVER_LOG_FILE_PATH = join(__dirname, '../', SERVER_LOG_FILE);

export const L4D2_PID_FILE_PATH = join(__dirname, '../', L4D2_PID_FILE);
