import * as fs from 'fs';
import { safeStorage } from 'electron';
import { getServersFilePath, ensureServersFileExists } from './addSsh';
import type { Server } from '../../shared/server';

export const getServers = (): Server[] => {
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

        // Decrypt sensitive information
        return servers.map(server => {
            const decryptedServer = { ...server };
            if (isEncryptionAvailable) {
                if (decryptedServer.password) {
                    try {
                        decryptedServer.password = safeStorage.decryptString(Buffer.from(decryptedServer.password, 'base64'));
                    } catch (e) {
                        console.error('Failed to decrypt password for server', server.id);
                    }
                }
                if (decryptedServer.privateKey) {
                    try {
                        decryptedServer.privateKey = safeStorage.decryptString(Buffer.from(decryptedServer.privateKey, 'base64'));
                    } catch (e) {
                        console.error('Failed to decrypt private key for server', server.id);
                    }
                }
                if (decryptedServer.passphrase) {
                    try {
                        decryptedServer.passphrase = safeStorage.decryptString(Buffer.from(decryptedServer.passphrase, 'base64'));
                    } catch (e) {
                        console.error('Failed to decrypt passphrase for server', server.id);
                    }
                }
            }
            return decryptedServer;
        });

    } catch (error) {
        console.error('Failed to get SSH servers:', error);
        return [];
    }
};
