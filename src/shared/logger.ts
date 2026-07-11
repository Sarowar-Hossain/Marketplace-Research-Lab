import { join } from 'node:path';
import pino, { type Logger } from 'pino';

const LOG_FILE_NAME = 'application.log';

// Creates a module-scoped logger that appends structured JSON entries to the
// local application log file. The module name is bound to every entry so each
// record identifies which component produced it.
export function createLogger(moduleName: string, logDirectory: string): Logger {
  const destination = pino.destination({
    dest: join(logDirectory, LOG_FILE_NAME),
    append: true,
    mkdir: true,
  });

  return pino({ level: 'info' }, destination).child({ module: moduleName });
}
