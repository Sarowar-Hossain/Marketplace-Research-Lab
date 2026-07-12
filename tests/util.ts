import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLogger } from '../src/shared/logger';
import type { Logger } from 'pino';

// Logger writing to an isolated temp directory so tests never touch the
// project logs/ directory.
export function testLogger(moduleName = 'test'): Logger {
  return createLogger(moduleName, mkdtempSync(join(tmpdir(), 'mrl-test-')));
}

export function tempDir(prefix = 'mrl-db-'): string {
  return mkdtempSync(join(tmpdir(), prefix));
}
