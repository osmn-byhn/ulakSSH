import { app, BrowserWindow, Menu, ipcMain, dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const activeSessions = new Map<string, any>();
const activeShells = new Map<string, any>();
// ssh2 shell streams for embedded terminal tabs: tabId -> { stream, conn }
const activeTabShells = new Map<string, { stream: any; conn: any }>();

let mainWindow: BrowserWindow | null = null;

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

  mainWindow = win;

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
};

// Move handlers outside of createWindow to prevent multiple registrations
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
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

ipcMain.handle('update-server', async (event, id, updates) => {
  const { updateSshServer } = await import('../src/main/utils/editSsh.js');
  return updateSshServer(id, updates);
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

    // Update last connected date
    const { updateSshServer } = await import('../src/main/utils/editSsh.js');
    updateSshServer(id, { lastConnected: new Date().toISOString() });

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

ipcMain.handle('get-system-info', async (event, id) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { getSystemInfo } = await import('../src/main/ssh/getSystemInfo.js');
    return await getSystemInfo(conn);
  } catch (error: any) {
    console.error('Failed to get system info:', error);
    return { error: error.message };
  }
});

ipcMain.handle('list-directory', async (event, id, path) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { listDirectory } = await import('../src/main/ssh/ls.js');
    return await listDirectory(conn, path);
  } catch (error: any) {
    console.error('Failed to list directory:', error);
    return { error: error.message };
  }
});

ipcMain.handle('read-remote-file', async (event, id, path) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { readRemoteFile } = await import('../src/main/ssh/sftp.js');
    return await readRemoteFile(conn, path);
  } catch (error: any) {
    console.error('Failed to read remote file:', error);
    return { error: error.message };
  }
});

ipcMain.handle('write-remote-file', async (event, id, path, content) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { writeRemoteFile } = await import('../src/main/ssh/sftp.js');
    await writeRemoteFile(conn, path, content);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to write remote file:', error);
    return { error: error.message };
  }
});

ipcMain.handle('create-remote-directory', async (event, id, path) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { createRemoteDirectory } = await import('../src/main/ssh/sftp.js');
    await createRemoteDirectory(conn, path);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create remote directory:', error);
    return { error: error.message };
  }
});

ipcMain.handle('delete-remote-item', async (event, id, path, isDirectory) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { deleteRemoteItem } = await import('../src/main/ssh/sftp.js');
    await deleteRemoteItem(conn, path, isDirectory);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete remote item:', error);
    return { error: error.message };
  }
});

ipcMain.handle('rename-remote-item', async (event, id, oldPath, newPath) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { renameRemoteItem } = await import('../src/main/ssh/sftp.js');
    await renameRemoteItem(conn, oldPath, newPath);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to rename remote item:', error);
    return { error: error.message };
  }
});

ipcMain.handle('copy-remote-item', async (event, id, src, dest) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { copyRemoteItem } = await import('../src/main/ssh/sftp.js');
    await copyRemoteItem(conn, src, dest);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to copy remote item:', error);
    return { error: error.message };
  }
});

ipcMain.handle('move-remote-item', async (event, id, src, dest) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { moveRemoteItem } = await import('../src/main/ssh/sftp.js');
    await moveRemoteItem(conn, src, dest);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to move remote item:', error);
    return { error: error.message };
  }
});

ipcMain.handle('download-remote-item', async (event, id, remotePath, isDirectory) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const pWin = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (!pWin) throw new Error('No parent window found');

    const basename = path.basename(remotePath);
    const { filePath, canceled } = await dialog.showSaveDialog(pWin, {
      title: isDirectory ? 'Download Folder' : 'Download File',
      defaultPath: isDirectory ? `${basename}.tar.gz` : basename,
    });

    if (canceled || !filePath) return { success: false, error: 'Cancelled' };

    const { downloadRemoteFile, archiveAndDownloadDirectory } = await import('../src/main/ssh/sftp.js');
    
    if (isDirectory) {
      await archiveAndDownloadDirectory(conn, remotePath, filePath);
    } else {
      await downloadRemoteFile(conn, remotePath, filePath);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to download item:', error);
    return { error: error.message || 'Unknown error during download' };
  }
});

ipcMain.handle('upload-remote-item', async (event, id, remoteDir) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const pWin = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (!pWin) throw new Error('No parent window found');

    const { filePaths, canceled } = await dialog.showOpenDialog(pWin, {
      title: 'Select Files to Upload',
      properties: ['openFile', 'multiSelections']
    });

    if (canceled || filePaths.length === 0) return { success: false, error: 'Cancelled' };

    const { uploadLocalFile } = await import('../src/main/ssh/sftp.js');
    
    for (const localPath of filePaths) {
      const basename = path.basename(localPath);
      const remotePath = remoteDir.endsWith('/') ? `${remoteDir}${basename}` : `${remoteDir}/${basename}`;
      await uploadLocalFile(conn, localPath, remotePath);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to upload items:', error);
    return { error: error.message || 'Unknown error during upload' };
  }
});

ipcMain.handle('get-server-stats', async (event, id) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { getServerStats } = await import('../src/main/ssh/stats.js');
    return await getServerStats(conn);
  } catch (error: any) {
    console.error('Failed to get stats:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-server-apps', async (event, id) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { getInstalledApps } = await import('../src/main/ssh/apps.js');
    return await getInstalledApps(conn);
  } catch (error: any) {
    console.error('Failed to get apps:', error);
    return { error: error.message };
  }
});

ipcMain.handle('check-server-app-updates', async (event, id) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { getAppUpdates } = await import('../src/main/ssh/apps.js');
    return await getAppUpdates(conn);
  } catch (error: any) {
    console.error('Failed to check updates:', error);
    return { error: error.message };
  }
});

ipcMain.handle('update-server-app', async (event, id, name, type) => {
  try {
    const conn = activeSessions.get(id);
    if (!conn) throw new Error('No active session for this server');

    const { updateApp } = await import('../src/main/ssh/apps.js');
    const success = await updateApp(conn, name, type);
    return { success };
  } catch (error: any) {
    console.error('Failed to update app:', error);
    return { success: false, error: error.message };
  }
});

// ─── Embedded Terminal Tabs (ssh2 shell stream, no password prompt) ─────────

// Spawn a new terminal tab: opens a fresh ssh2 connection + shell stream.
// credentials (password/key) are read from the stored server config automatically.
ipcMain.handle('tab-spawn', async (event, serverId: string, tabId: string, cols: number, rows: number) => {
  try {
    // Clean up previous tab if it exists
    const existing = activeTabShells.get(tabId);
    if (existing) {
      try { existing.stream.close(); } catch (_) { }
      try { existing.conn.end(); } catch (_) { }
      activeTabShells.delete(tabId);
    }

    const { getServers } = await import('../src/main/utils/getServers.js');
    const { connectToServer } = await import('../src/main/ssh/connect.js');

    const servers = getServers();
    const server = servers.find((s: any) => s.id === serverId);
    if (!server) throw new Error('Server info not found');

    // Open a dedicated ssh2 connection for this tab
    const conn = await connectToServer(server);

    return await new Promise((resolve, reject) => {
      conn.shell({ term: 'xterm-256color', cols: cols || 80, rows: rows || 24 }, (err: any, stream: any) => {
        if (err) {
          conn.end(); // Ensure connection is closed on shell error
          return reject(err);
        }

        activeTabShells.set(tabId, { stream, conn });

        stream.on('data', (data: Buffer) => {
          event.sender.send(`tab-output-${tabId}`, data.toString('utf8'));
        });

        stream.on('close', () => {
          activeTabShells.delete(tabId);
          try { conn.end(); } catch (_) { } // Ensure connection is closed when stream closes
          event.sender.send(`tab-exit-${tabId}`);
        });

        resolve({ success: true });
      });
    });
  } catch (error: any) {
    console.error('tab-spawn error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('tab-input', (_event, tabId: string, data: string) => {
  const tab = activeTabShells.get(tabId);
  if (tab) {
    if (tab.stream.writable) {
      tab.stream.write(data);
    } else {
      console.warn(`[tab-input] Stream for tab ${tabId} is not writable`);
    }
  } else {
    console.warn(`[tab-input] Tab ${tabId} not found`);
  }
});

ipcMain.on('tab-resize', (_event, tabId: string, cols: number, rows: number) => {
  const tab = activeTabShells.get(tabId);
  if (tab) tab.stream.setWindow(rows, cols, 0, 0);
});

ipcMain.on('tab-kill', (_event, tabId: string) => {
  const tab = activeTabShells.get(tabId);
  if (tab) {
    try { tab.stream.close(); } catch (_) { }
    try { tab.conn.end(); } catch (_) { }
    activeTabShells.delete(tabId);
  }
});

ipcMain.handle('pick-file', async (event) => {
  const pWin = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  if (!pWin) return null;
  const result = await dialog.showOpenDialog(pWin, {
    properties: ['openFile'],
    filters: [
      { name: 'SSH Keys', extensions: ['*', 'pem', 'pub', 'key'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Failed to read file:', error);
    return null;
  }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
