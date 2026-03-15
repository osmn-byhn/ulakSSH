import { safeStorage } from 'electron';
import * as fs from 'fs';
import { getServersFilePath, ensureServersFileExists } from './addSsh.js';
export const updateSshServer = (id, updates) => {
    try {
        const filePath = getServersFilePath();
        ensureServersFileExists(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        let servers = [];
        try {
            servers = JSON.parse(fileContent);
        }
        catch (e) {
            servers = [];
        }
        const index = servers.findIndex(s => s.id === id);
        if (index === -1)
            return false;
        const isEncryptionAvailable = safeStorage.isEncryptionAvailable();
        const updatedServer = { ...servers[index], ...updates };
        // Re-encrypt if sensitive fields are being updated
        if (updates.password && isEncryptionAvailable) {
            const encrypted = safeStorage.encryptString(updates.password);
            updatedServer.password = encrypted.toString('base64');
        }
        if (updates.privateKey && isEncryptionAvailable) {
            const encrypted = safeStorage.encryptString(updates.privateKey);
            updatedServer.privateKey = encrypted.toString('base64');
        }
        if (updates.passphrase && isEncryptionAvailable) {
            const encrypted = safeStorage.encryptString(updates.passphrase);
            updatedServer.passphrase = encrypted.toString('base64');
        }
        servers[index] = updatedServer;
        fs.writeFileSync(filePath, JSON.stringify(servers, null, 4), 'utf-8');
        return true;
    }
    catch (error) {
        console.error('Failed to update SSH server:', error);
        return false;
    }
};
