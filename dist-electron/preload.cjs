"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    version: "1.0.0",
    minimize: () => electron_1.ipcRenderer.send('window-minimize'),
    maximize: () => electron_1.ipcRenderer.send('window-maximize'),
    close: () => electron_1.ipcRenderer.send('window-close'),
    addServer: (serverData) => electron_1.ipcRenderer.invoke('add-server', serverData),
    getServers: () => electron_1.ipcRenderer.invoke('get-servers'),
    deleteServer: (id) => electron_1.ipcRenderer.invoke('delete-server', id)
});
