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

export const createRemoteDirectory = (conn: Client, path: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.mkdir(path, (mkdirErr) => {
                sftp.end();
                if (mkdirErr) return reject(mkdirErr);
                resolve();
            });
        });
    });
};

export const deleteRemoteItem = (conn: Client, path: string, isDirectory: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
        // For directories, we'll use a shell command to handle recursive deletion efficiently
        if (isDirectory) {
            conn.exec(`rm -rf "${path.replace(/"/g, '\\"')}"`, (err, stream) => {
                if (err) return reject(err);
                stream.on('close', (code: number) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Exit code ${code}`));
                }).on('data', () => {}).stderr.on('data', () => {});
            });
        } else {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.unlink(path, (unlinkErr) => {
                    sftp.end();
                    if (unlinkErr) return reject(unlinkErr);
                    resolve();
                });
            });
        }
    });
};

export const renameRemoteItem = (conn: Client, oldPath: string, newPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.rename(oldPath, newPath, (renameErr) => {
                sftp.end();
                if (renameErr) return reject(renameErr);
                resolve();
            });
        });
    });
};

export const copyRemoteItem = (conn: Client, src: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // use cp -r for simplicity and robustness
        conn.exec(`cp -r "${src.replace(/"/g, '\\"')}" "${dest.replace(/"/g, '\\"')}"`, (err, stream) => {
            if (err) return reject(err);
            stream.on('close', (code: number) => {
                if (code === 0) resolve();
                else reject(new Error(`Exit code ${code}`));
            }).on('data', () => {}).stderr.on('data', () => {});
        });
    });
};

export const moveRemoteItem = (conn: Client, src: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // use mv for simplicity and robustness
        conn.exec(`mv "${src.replace(/"/g, '\\"')}" "${dest.replace(/"/g, '\\"')}"`, (err, stream) => {
            if (err) return reject(err);
            stream.on('close', (code: number) => {
                if (code === 0) resolve();
                else reject(new Error(`Exit code ${code}`));
            }).on('data', () => {}).stderr.on('data', () => {});
        });
    });
};
