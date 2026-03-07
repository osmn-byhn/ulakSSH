import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import type { Server } from '../../shared/server';

const SERVERS_FILE = 'servers.json';

export const getServersFilePath = () => {
    return path.join(app.getPath('userData'), SERVERS_FILE);
};

export const ensureServersFileExists = (filePath: string) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
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

        servers.push(serverToSave);

        fs.writeFileSync(filePath, JSON.stringify(servers, null, 4), 'utf-8');

        return true;
    } catch (error) {
        console.error('Failed to save SSH server:', error);
        return false;
    }
};