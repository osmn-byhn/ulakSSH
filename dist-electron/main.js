import { app, BrowserWindow, Menu, ipcMain } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path.join(__dirname, "../dist/index.html"));
    }
    ipcMain.on('window-minimize', () => {
        win.minimize();
    });
    ipcMain.on('window-maximize', () => {
        if (win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win.maximize();
        }
    });
    ipcMain.on('window-close', () => {
        win.close();
    });
    ipcMain.handle('add-server', (event, serverData) => {
        // dynamically import to ensure it works correctly with file paths
        const { addSshServer } = require('../src/main/utils/addSsh');
        return addSshServer(serverData);
    });
    ipcMain.handle('get-servers', (event) => {
        const { getServers } = require('../src/main/utils/getServers');
        return getServers();
    });
    ipcMain.handle('delete-server', (event, id) => {
        const { deleteSshServer } = require('../src/main/utils/deleteSsh');
        return deleteSshServer(id);
    });
};
app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
