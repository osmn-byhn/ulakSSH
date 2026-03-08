import { Client } from 'ssh2';
import * as fs from 'fs';
export const connectToServer = (server) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`SSH Connection established with ${server.host}`);
            resolve(conn);
        }).on('error', (err) => {
            console.error(`SSH Connection Error with ${server.host}:`, err);
            reject(err);
        });
        const connectConfig = {
            host: server.host,
            port: server.port,
            username: server.username,
        };
        if (server.authType === 'password') {
            connectConfig.password = server.password;
        }
        else if (server.authType === 'key') {
            // Priority: private key path first, then private key content
            if (server.privateKeyPath && fs.existsSync(server.privateKeyPath)) {
                connectConfig.privateKey = fs.readFileSync(server.privateKeyPath);
            }
            else if (server.privateKey) {
                connectConfig.privateKey = server.privateKey;
            }
            else {
                return reject(new Error('No private key or key path provided.'));
            }
            // Add passphrase if the key is encrypted
            if (server.passphrase) {
                connectConfig.passphrase = server.passphrase;
            }
        }
        else {
            return reject(new Error(`Unknown authentication type: ${server.authType}`));
        }
        try {
            conn.connect(connectConfig);
        }
        catch (error) {
            reject(error);
        }
    });
};
