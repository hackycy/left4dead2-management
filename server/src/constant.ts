import { join } from 'node:path';

export const SERVER_LOG_FILE = 'server.log';

export const SERVER_LOG_FILE_PATH = join(__dirname, '../', SERVER_LOG_FILE);
