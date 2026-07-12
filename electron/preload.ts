// Electron preload: secure bridge between the Electron runtime and the UI
// layer (Doc 005 §5.4). Exposes only the Application-level operations.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('settings:save', settings),
  startResearch: (request: unknown) => ipcRenderer.invoke('research:start', request),
  compareKeywords: (request: unknown) => ipcRenderer.invoke('research:compare', request),
  openReport: (reportPath: string) => ipcRenderer.invoke('report:open', reportPath),
  getResearchData: (sessionId: string) => ipcRenderer.invoke('research:getData', sessionId),
  listSessions: () => ipcRenderer.invoke('research:listSessions'),
  onProgress: (callback: (stage: string) => void) => {
    const listener = (_event: IpcRendererEvent, stage: string) => callback(stage);
    ipcRenderer.on('research:progress', listener);
    return () => ipcRenderer.removeListener('research:progress', listener);
  },
});
