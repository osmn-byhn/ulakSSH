import { getSftp, executeCommand, type SudoSession } from './execute.js';

export const readRemoteFile = async (session: SudoSession, remotePath: string): Promise<string> => {
    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
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
};

export const writeRemoteFile = async (session: SudoSession, remotePath: string, content: string): Promise<void> => {
    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
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
};

export const createRemoteDirectory = async (session: SudoSession, path: string): Promise<void> => {
    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
        sftp.mkdir(path, (mkdirErr) => {
            sftp.end();
            if (mkdirErr) return reject(mkdirErr);
            resolve();
        });
    });
};

export const deleteRemoteItem = async (session: SudoSession, path: string, isDirectory: boolean): Promise<void> => {
    // For directories, we'll use a shell command to handle recursive deletion efficiently
    if (isDirectory) {
        await executeCommand(session, `rm -rf "${path.replace(/"/g, '\\"')}"`);
    } else {
        const sftp = await getSftp(session);
        return new Promise((resolve, reject) => {
            sftp.unlink(path, (unlinkErr) => {
                sftp.end();
                if (unlinkErr) return reject(unlinkErr);
                resolve();
            });
        });
    }
};

export const renameRemoteItem = async (session: SudoSession, oldPath: string, newPath: string): Promise<void> => {
    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
        sftp.rename(oldPath, newPath, (renameErr) => {
            sftp.end();
            if (renameErr) return reject(renameErr);
            resolve();
        });
    });
};

export const copyRemoteItem = async (session: SudoSession, src: string, dest: string): Promise<void> => {
    // use cp -r for simplicity and robustness
    await executeCommand(session, `cp -r "${src.replace(/"/g, '\\"')}" "${dest.replace(/"/g, '\\"')}"`);
};

export const moveRemoteItem = async (session: SudoSession, src: string, dest: string): Promise<void> => {
    // use mv for simplicity and robustness
    await executeCommand(session, `mv "${src.replace(/"/g, '\\"')}" "${dest.replace(/"/g, '\\"')}"`);
};

export const downloadRemoteFile = async (session: SudoSession, remotePath: string, localPath: string, onProgress?: (transferred: number, total: number) => void): Promise<void> => {
    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
        sftp.fastGet(remotePath, localPath, {
            step: (transferred, _chunk, total) => {
                if (onProgress) onProgress(transferred, total);
            }
        }, (getErr) => {
            sftp.end();
            if (getErr) {
                console.error(`SFTP fastGet error from ${remotePath} to ${localPath}:`, getErr);
                return reject(new Error(`Download failed: ${getErr.message}`));
            }
            resolve();
        });
    });
};

export const uploadLocalFile = async (session: SudoSession, localPath: string, remotePath: string, onProgress?: (transferred: number, total: number) => void): Promise<void> => {
    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, {
            step: (transferred, _chunk, total) => {
                if (onProgress) onProgress(transferred, total);
            }
        }, (putErr) => {
            sftp.end();
            if (putErr) {
                console.error(`SFTP fastPut error from ${localPath} to ${remotePath}:`, putErr);
                return reject(new Error(`Upload failed: ${putErr.message}`));
            }
            resolve();
        });
    });
};

export const archiveAndDownloadDirectory = async (session: SudoSession, remotePath: string, localPath: string, onProgress?: (transferred: number, total: number) => void): Promise<void> => {
    const basename = remotePath.split('/').pop() || 'folder';
    const remoteArchivePath = `/tmp/${basename}_${Date.now()}.tar.gz`;
    
    // Command to create archive
    const dir = remotePath.substring(0, remotePath.lastIndexOf('/')) || '/';
    const name = remotePath.substring(remotePath.lastIndexOf('/') + 1);
    
    await executeCommand(session, `tar -czf "${remoteArchivePath}" -C "${dir}" "${name}"`);
    
    // Download the archive
    const sftp = await getSftp(session);
    return new Promise((resolve, reject) => {
        sftp.fastGet(remoteArchivePath, localPath, {
            step: (transferred, _chunk, total) => {
                if (onProgress) onProgress(transferred, total);
            }
        }, (getErr) => {
            sftp.end();
            
            // Cleanup remote archive regardless of result
            executeCommand(session, `rm "${remoteArchivePath}"`).catch(() => {});
            
            if (getErr) {
                console.error(`SFTP fastGet error for archive ${remoteArchivePath}:`, getErr);
                return reject(new Error(`Archive download failed: ${getErr.message}`));
            }
            resolve();
        });
    });
};
