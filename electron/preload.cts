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
  resizeTerminal: (id: string, cols: number, rows: number) => ipcRenderer.send('terminal-resize', id, cols, rows)
});
