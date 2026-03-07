import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("api", {
    version: "1.0.0",
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
});
