import { app, BrowserWindow, Menu, ipcMain } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const activeSessions = new Map();
const activeShells = new Map();
// ssh2 shell streams for embedded terminal tabs: tabId -> { stream, conn }
const activeTabShells = new Map();
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
        win.loadFile(path.join(__dirname, "../../dist/index.html"));
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
    ipcMain.handle('add-server', async (event, serverData) => {
        // dynamically import to ensure it works correctly with file paths
        const { addSshServer } = await import('../src/main/utils/addSsh.js');
        return addSshServer(serverData);
    });
    ipcMain.handle('get-servers', async (event) => {
        const { getServers } = await import('../src/main/utils/getServers.js');
        return getServers();
    });
    ipcMain.handle('delete-server', async (event, id) => {
        const { deleteSshServer } = await import('../src/main/utils/deleteSsh.js');
        return deleteSshServer(id);
    });
    ipcMain.handle('connect-server', async (event, id) => {
        try {
            const { getServers } = await import('../src/main/utils/getServers.js');
            const { connectToServer } = await import('../src/main/ssh/connect.js');
            const servers = getServers();
            const server = servers.find((s) => s.id === id);
            if (!server)
                throw new Error('Server not found');
            const conn = await connectToServer(server);
            activeSessions.set(id, conn);
            await new Promise((resolve, reject) => {
                conn.shell({ term: 'xterm-256color' }, (err, stream) => {
                    if (err)
                        return reject(err);
                    activeShells.set(id, stream);
                    stream.on('close', () => {
                        activeShells.delete(id);
                        event.sender.send(`terminal-close-${id}`);
                    });
                    stream.on('data', (data) => {
                        event.sender.send(`terminal-output-${id}`, data.toString('utf8'));
                    });
                    resolve();
                });
            });
            conn.on('end', () => {
                activeSessions.delete(id);
                activeShells.delete(id);
            });
            conn.on('close', () => {
                activeSessions.delete(id);
                activeShells.delete(id);
            });
            conn.on('error', () => {
                activeSessions.delete(id);
                activeShells.delete(id);
            });
            return { success: true };
        }
        catch (error) {
            console.error('Failed to connect:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('disconnect-server', async (event, id) => {
        try {
            const conn = activeSessions.get(id);
            if (conn) {
                const { disconnectFromServer } = await import('../src/main/ssh/disconnect.js');
                disconnectFromServer(conn);
                activeSessions.delete(id);
                activeShells.delete(id);
                return { success: true };
            }
            return { success: false, error: 'No active session' };
        }
        catch (error) {
            console.error('Failed to disconnect:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.on('terminal-input', (event, id, data) => {
        const stream = activeShells.get(id);
        if (stream)
            stream.write(data);
    });
    ipcMain.on('terminal-resize', (event, id, cols, rows) => {
        const stream = activeShells.get(id);
        if (stream)
            stream.setWindow(rows, cols, 0, 0);
    });
    ipcMain.handle('get-system-info', async (event, id) => {
        try {
            const conn = activeSessions.get(id);
            if (!conn)
                throw new Error('No active session for this server');
            const { getSystemInfo } = await import('../src/main/ssh/getSystemInfo.js');
            return await getSystemInfo(conn);
        }
        catch (error) {
            console.error('Failed to get system info:', error);
            return { error: error.message };
        }
    });
    // ─── Embedded Terminal Tabs (ssh2 shell stream, no password prompt) ─────────
    // Spawn a new terminal tab: opens a fresh ssh2 connection + shell stream.
    // credentials (password/key) are read from the stored server config automatically.
    ipcMain.handle('tab-spawn', async (event, serverId, tabId, cols, rows) => {
        try {
            // Clean up previous tab if it exists
            const existing = activeTabShells.get(tabId);
            if (existing) {
                try {
                    existing.stream.close();
                }
                catch (_) { }
                try {
                    existing.conn.end();
                }
                catch (_) { }
                activeTabShells.delete(tabId);
            }
            const { getServers } = await import('../src/main/utils/getServers.js');
            const { connectToServer } = await import('../src/main/ssh/connect.js');
            const servers = getServers();
            const server = servers.find((s) => s.id === serverId);
            if (!server)
                throw new Error('Server not found');
            // Open a dedicated ssh2 connection for this tab
            const conn = await connectToServer(server);
            await new Promise((resolve, reject) => {
                conn.shell({ term: 'xterm-256color', cols: cols || 80, rows: rows || 24 }, (err, stream) => {
                    if (err)
                        return reject(err);
                    activeTabShells.set(tabId, { stream, conn });
                    stream.on('data', (data) => {
                        event.sender.send(`tab-output-${tabId}`, data.toString('utf8'));
                    });
                    stream.on('close', () => {
                        activeTabShells.delete(tabId);
                        try {
                            conn.end();
                        }
                        catch (_) { }
                        event.sender.send(`tab-exit-${tabId}`);
                    });
                    resolve();
                });
            });
            conn.on('end', () => { activeTabShells.delete(tabId); });
            conn.on('close', () => { activeTabShells.delete(tabId); });
            return { success: true };
        }
        catch (error) {
            console.error('tab-spawn error:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.on('tab-input', (_event, tabId, data) => {
        const tab = activeTabShells.get(tabId);
        if (tab)
            tab.stream.write(data);
    });
    ipcMain.on('tab-resize', (_event, tabId, cols, rows) => {
        const tab = activeTabShells.get(tabId);
        if (tab)
            tab.stream.setWindow(rows, cols, 0, 0);
    });
    ipcMain.on('tab-kill', (_event, tabId) => {
        const tab = activeTabShells.get(tabId);
        if (tab) {
            try {
                tab.stream.close();
            }
            catch (_) { }
            try {
                tab.conn.end();
            }
            catch (_) { }
            activeTabShells.delete(tabId);
        }
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
