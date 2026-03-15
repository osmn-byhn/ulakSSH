import { Client } from 'ssh2';

export const readRemoteFile = (conn: Client, remotePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);

            const chunks: Buffer[] = [];
            const stream = sftp.createReadStream(remotePath);

            stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            stream.on('error', (streamErr: any) => {
                sftp.end();
                reject(streamErr);
            });

            stream.on('close', () => {
                sftp.end();
                resolve(Buffer.concat(chunks).toString('utf8'));
            });
        });
    });
};

export const writeRemoteFile = (conn: Client, remotePath: string, content: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);

            const stream = sftp.createWriteStream(remotePath);

            stream.on('error', (streamErr: any) => {
                sftp.end();
                reject(streamErr);
            });

            stream.on('close', () => {
                sftp.end();
                resolve();
            });

            stream.end(content);
        });
    });
};
