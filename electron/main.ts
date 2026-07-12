import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { createLogger, flushLogger } from '../src/shared/logger';
import { loadSettings, saveSettings } from '../src/application/settings';
import { runResearch } from '../src/application/research-service';

const rootDirectory = app.getAppPath();
const settingsFilePath = join(rootDirectory, 'config', 'app.config.json');
const logger = createLogger('application', join(rootDirectory, 'logs'));

let mainWindow: BrowserWindow | null = null;
let researchInProgress = false;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  void mainWindow.loadFile(join(rootDirectory, 'dist', 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC surface consumed by the preload bridge. The renderer never touches
// business modules directly (Doc 005 §8: UI → Application only).
ipcMain.handle('settings:get', () => loadSettings(settingsFilePath));

ipcMain.handle('settings:save', (_event, settings: unknown) => {
  try {
    return { ok: true, settings: saveSettings(settingsFilePath, settings) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('research:start', async (_event, rawKeyword: string) => {
  if (researchInProgress) {
    return { ok: false, error: 'A research session is already running' };
  }
  const settings = loadSettings(settingsFilePath);
  if (!settings) {
    return { ok: false, error: 'AI provider is not configured. Open Settings first.' };
  }

  researchInProgress = true;
  logger.info({ operation: 'application' }, 'Research session start');
  try {
    const result = await runResearch(rootDirectory, rawKeyword, settings, logger, (stage) => {
      mainWindow?.webContents.send('research:progress', stage);
    });
    logger.info({ operation: 'application' }, 'Research session completion');
    if (!result.ok) {
      return { ok: false, error: `Invalid keyword: ${result.detail}` };
    }
    return { ok: true, productsSaved: result.productsSaved, reportPath: result.reportPath };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    researchInProgress = false;
  }
});

ipcMain.handle('report:open', async (_event, reportPath: string) => {
  const message = await shell.openPath(reportPath);
  return message === '' ? { ok: true } : { ok: false, error: message };
});

app.whenReady().then(() => {
  logger.info({ operation: 'application' }, 'Application started');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info({ operation: 'application' }, 'Application shutdown');
  void flushLogger(logger).catch(() => undefined);
});
