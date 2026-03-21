export const readRemoteFile = (conn, remotePath) => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err)
                return reject(err);
            const chunks = [];
            const stream = sftp.createReadStream(remotePath);
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            stream.on('error', (streamErr) => {
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
export const writeRemoteFile = (conn, remotePath, content) => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err)
                return reject(err);
            const stream = sftp.createWriteStream(remotePath);
            stream.on('error', (streamErr) => {
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
export const createRemoteDirectory = (conn, path) => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err)
                return reject(err);
            sftp.mkdir(path, (mkdirErr) => {
                sftp.end();
                if (mkdirErr)
                    return reject(mkdirErr);
                resolve();
            });
        });
    });
};
export const deleteRemoteItem = (conn, path, isDirectory) => {
    return new Promise((resolve, reject) => {
        // For directories, we'll use a shell command to handle recursive deletion efficiently
        if (isDirectory) {
            conn.exec(`rm -rf "${path.replace(/"/g, '\\"')}"`, (err, stream) => {
                if (err)
                    return reject(err);
                stream.on('close', (code) => {
                    if (code === 0)
                        resolve();
                    else
                        reject(new Error(`Exit code ${code}`));
                }).on('data', () => { }).stderr.on('data', () => { });
            });
        }
        else {
            conn.sftp((err, sftp) => {
                if (err)
                    return reject(err);
                sftp.unlink(path, (unlinkErr) => {
                    sftp.end();
                    if (unlinkErr)
                        return reject(unlinkErr);
                    resolve();
                });
            });
        }
    });
};
export const renameRemoteItem = (conn, oldPath, newPath) => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err)
                return reject(err);
            sftp.rename(oldPath, newPath, (renameErr) => {
                sftp.end();
                if (renameErr)
                    return reject(renameErr);
                resolve();
            });
        });
    });
};
export const copyRemoteItem = (conn, src, dest) => {
    return new Promise((resolve, reject) => {
        // use cp -r for simplicity and robustness
        conn.exec(`cp -r "${src.replace(/"/g, '\\"')}" "${dest.replace(/"/g, '\\"')}"`, (err, stream) => {
            if (err)
                return reject(err);
            stream.on('close', (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Exit code ${code}`));
            }).on('data', () => { }).stderr.on('data', () => { });
        });
    });
};
export const moveRemoteItem = (conn, src, dest) => {
    return new Promise((resolve, reject) => {
        // use mv for simplicity and robustness
        conn.exec(`mv "${src.replace(/"/g, '\\"')}" "${dest.replace(/"/g, '\\"')}"`, (err, stream) => {
            if (err)
                return reject(err);
            stream.on('close', (code) => {
                if (code === 0)
                    resolve();
                else
                    reject(new Error(`Exit code ${code}`));
            }).on('data', () => { }).stderr.on('data', () => { });
        });
    });
};
export const downloadRemoteFile = (conn, remotePath, localPath, onProgress) => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err)
                return reject(err);
            sftp.fastGet(remotePath, localPath, {
                step: (transferred, _chunk, total) => {
                    if (onProgress)
                        onProgress(transferred, total);
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
    });
};
export const uploadLocalFile = (conn, localPath, remotePath, onProgress) => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err)
                return reject(err);
            sftp.fastPut(localPath, remotePath, {
                step: (transferred, _chunk, total) => {
                    if (onProgress)
                        onProgress(transferred, total);
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
    });
};
export const archiveAndDownloadDirectory = (conn, remotePath, localPath, onProgress) => {
    return new Promise((resolve, reject) => {
        const basename = remotePath.split('/').pop() || 'folder';
        const remoteArchivePath = `/tmp/${basename}_${Date.now()}.tar.gz`;
        // Command to create archive
        const dir = remotePath.substring(0, remotePath.lastIndexOf('/')) || '/';
        const name = remotePath.substring(remotePath.lastIndexOf('/') + 1);
        conn.exec(`tar -czf "${remoteArchivePath}" -C "${dir}" "${name}"`, (err, stream) => {
            if (err)
                return reject(err);
            stream.on('close', (code) => {
                if (code !== 0)
                    return reject(new Error(`Exit code ${code} while archiving`));
                // Download the archive
                conn.sftp((sftpErr, sftp) => {
                    if (sftpErr)
                        return reject(sftpErr);
                    sftp.fastGet(remoteArchivePath, localPath, {
                        step: (transferred, _chunk, total) => {
                            if (onProgress)
                                onProgress(transferred, total);
                        }
                    }, (getErr) => {
                        sftp.end();
                        // Cleanup remote archive regardless of result
                        conn.exec(`rm "${remoteArchivePath}"`, () => { });
                        if (getErr) {
                            console.error(`SFTP fastGet error for archive ${remoteArchivePath}:`, getErr);
                            return reject(new Error(`Archive download failed: ${getErr.message}`));
                        }
                        resolve();
                    });
                });
            }).on('data', () => { }).stderr.on('data', () => { });
        });
    });
};
