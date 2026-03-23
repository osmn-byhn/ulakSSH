import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import type { Server, Script } from '../../shared/server.js';

const SERVERS_FILE = 'servers.json';

export const getServersFilePath = () => {
    return path.join(app.getPath('userData'), SERVERS_FILE);
};

export const ensureServersFileExists = (filePath: string) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
    }
};

export const saveScriptsToDisk = (serverId: string, scripts: Script[]) => {
    try {
        const scriptsDir = path.join(app.getPath('userData'), 'scripts', serverId);
        if (!fs.existsSync(scriptsDir)) {
            fs.mkdirSync(scriptsDir, { recursive: true });
        }

        scripts.forEach(script => {
            const ext = script.language === 'python' ? 'py' : 
                        script.language === 'javascript' || script.language === 'nodejs' ? 'js' : 
                        'sh';
            const fileName = `${script.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${script.id}.${ext}`;
            const filePath = path.join(scriptsDir, fileName);
            fs.writeFileSync(filePath, script.content, 'utf-8');
        });
    } catch (e) {
        console.error('Failed to save scripts to disk:', e);
    }
};

export const addSshServer = (server: Server): boolean => {
    try {
        const filePath = getServersFilePath();
        ensureServersFileExists(filePath);

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        let servers: Server[] = [];
        try {
            servers = JSON.parse(fileContent);
        } catch (e) {
            servers = [];
        }

        const isEncryptionAvailable = safeStorage.isEncryptionAvailable();
        const serverToSave: Server = { ...server };

        if (!serverToSave.id) {
            serverToSave.id = crypto.randomUUID();
        }

        if (serverToSave.password && isEncryptionAvailable) {
            const encrypted = safeStorage.encryptString(serverToSave.password);
            serverToSave.password = encrypted.toString('base64');
        }

        if (serverToSave.privateKey && isEncryptionAvailable) {
            const encrypted = safeStorage.encryptString(serverToSave.privateKey);
            serverToSave.privateKey = encrypted.toString('base64');
        }

        if (serverToSave.passphrase && isEncryptionAvailable) {
            const encrypted = safeStorage.encryptString(serverToSave.passphrase);
            serverToSave.passphrase = encrypted.toString('base64');
        }

        if (serverToSave.scripts && serverToSave.scripts.length > 0) {
            saveScriptsToDisk(serverToSave.id, serverToSave.scripts);
        }

        servers.push(serverToSave);

        fs.writeFileSync(filePath, JSON.stringify(servers, null, 4), 'utf-8');

        return true;
    } catch (error) {
        console.error('Failed to save SSH server:', error);
        return false;
    }
};