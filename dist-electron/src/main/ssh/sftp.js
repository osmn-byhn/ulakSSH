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
