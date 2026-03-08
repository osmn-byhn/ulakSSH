import { app, BrowserWindow, Menu, ipcMain } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const activeSessions = new Map<string, any>();
const activeShells = new Map<string, any>();

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
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  ipcMain.on('window-minimize', () => {
    win.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
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
      const server = servers.find((s: any) => s.id === id);
      if (!server) throw new Error('Server not found');

      const conn = await connectToServer(server);
      activeSessions.set(id, conn);

      await new Promise<void>((resolve, reject) => {
        conn.shell({ term: 'xterm-256color' }, (err: any, stream: any) => {
          if (err) return reject(err);

          activeShells.set(id, stream);

          stream.on('close', () => {
            activeShells.delete(id);
            event.sender.send(`terminal-close-${id}`);
          });

          stream.on('data', (data: Buffer) => {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('terminal-input', (event, id, data) => {
    const stream = activeShells.get(id);
    if (stream) stream.write(data);
  });

  ipcMain.on('terminal-resize', (event, id, cols, rows) => {
    const stream = activeShells.get(id);
    if (stream) stream.setWindow(rows, cols, 0, 0);
  });
};

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
