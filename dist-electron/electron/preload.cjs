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
    deleteServer: (id) => electron_1.ipcRenderer.invoke('delete-server', id),
    connectServer: (id) => electron_1.ipcRenderer.invoke('connect-server', id),
    disconnectServer: (id) => electron_1.ipcRenderer.invoke('disconnect-server', id),
    onTerminalOutput: (id, callback) => {
        electron_1.ipcRenderer.removeAllListeners(`terminal-output-${id}`);
        electron_1.ipcRenderer.on(`terminal-output-${id}`, (_, data) => callback(data));
    },
    onTerminalClose: (id, callback) => {
        electron_1.ipcRenderer.removeAllListeners(`terminal-close-${id}`);
        electron_1.ipcRenderer.on(`terminal-close-${id}`, () => callback());
    },
    sendTerminalData: (id, data) => electron_1.ipcRenderer.send('terminal-input', id, data),
    resizeTerminal: (id, cols, rows) => electron_1.ipcRenderer.send('terminal-resize', id, cols, rows)
});
