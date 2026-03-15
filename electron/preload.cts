import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  version: "1.0.0",
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  addServer: (serverData: any) => ipcRenderer.invoke('add-server', serverData),
  getServers: () => ipcRenderer.invoke('get-servers'),
  deleteServer: (id: string) => ipcRenderer.invoke('delete-server', id),
  connectServer: (id: string) => ipcRenderer.invoke('connect-server', id),
  disconnectServer: (id: string) => ipcRenderer.invoke('disconnect-server', id),
  onTerminalOutput: (id: string, callback: (data: string) => void) => {
    ipcRenderer.removeAllListeners(`terminal-output-${id}`);
    ipcRenderer.on(`terminal-output-${id}`, (_, data) => callback(data));
  },
  onTerminalClose: (id: string, callback: () => void) => {
    ipcRenderer.removeAllListeners(`terminal-close-${id}`);
    ipcRenderer.on(`terminal-close-${id}`, () => callback());
  },
  sendTerminalData: (id: string, data: string) => ipcRenderer.send('terminal-input', id, data),
  resizeTerminal: (id: string, cols: number, rows: number) => ipcRenderer.send('terminal-resize', id, cols, rows),
  getSystemInfo: (id: string) => ipcRenderer.invoke('get-system-info', id),
  pickFile: () => ipcRenderer.invoke('pick-file'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  updateServer: (id: string, updates: any) => ipcRenderer.invoke('update-server', id, updates),
  listDirectory: (serverId: string, path: string) => ipcRenderer.invoke('list-directory', serverId, path),
  readRemoteFile: (serverId: string, filePath: string) => ipcRenderer.invoke('read-remote-file', serverId, filePath),
  writeRemoteFile: (serverId: string, filePath: string, content: string) => ipcRenderer.invoke('write-remote-file', serverId, filePath, content),

  // ─── Embedded Terminal Tabs (ssh2-based, no password prompt) ─────────────
  tabSpawn: (serverId: string, tabId: string, cols: number, rows: number) =>
    ipcRenderer.invoke('tab-spawn', serverId, tabId, cols, rows),
  tabInput: (tabId: string, data: string) =>
    ipcRenderer.send('tab-input', tabId, data),
  tabResize: (tabId: string, cols: number, rows: number) =>
    ipcRenderer.send('tab-resize', tabId, cols, rows),
  tabKill: (tabId: string) =>
    ipcRenderer.send('tab-kill', tabId),
  onTabOutput: (tabId: string, callback: (data: string) => void) => {
    const channel = `tab-output-${tabId}`;
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, (_event: any, data: string) => callback(data));
    return () => ipcRenderer.removeAllListeners(channel);
  },
  onTabExit: (tabId: string, callback: () => void) => {
    const channel = `tab-exit-${tabId}`;
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, () => callback());
    return () => ipcRenderer.removeAllListeners(channel);
  },
});
