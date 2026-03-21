import { Client, type SFTPWrapper } from 'ssh2';

export interface SudoSession {
    conn: Client;
    password?: string;
    username: string;
    shouldSudo: boolean;
}

export const executeCommand = (session: SudoSession, cmd: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const command = session.shouldSudo 
            ? `echo "${session.password}" | sudo -S -p "" ${cmd}`
            : cmd;

        session.conn.exec(command, (err, stream) => {
            if (err) return reject(err);

            let output = '';
            let errorOutput = '';

            stream.on('data', (data: Buffer) => {
                output += data.toString();
            }).stderr.on('data', (data: Buffer) => {
                const chunk = data.toString();
                // Filter out sudo password prompt noise if any remains
                if (!chunk.includes('password for') && !chunk.includes('Password:')) {
                    errorOutput += chunk;
                }
            }).on('close', (code: number) => {
                if (code !== 0 && !output) {
                    reject(new Error(errorOutput || `Command failed with code ${code}`));
                } else {
                    resolve(output);
                }
            });
        });
    });
};

export const getSftp = (session: SudoSession): Promise<SFTPWrapper> => {
    return new Promise((resolve, reject) => {
        if (!session.shouldSudo) {
            session.conn.sftp((err, sftp) => {
                if (err) return reject(err);
                resolve(sftp);
            });
        } else {
            // Try common paths for sftp-server
            const sftpServerPaths = [
                '/usr/libexec/openssh/sftp-server',
                '/usr/lib/openssh/sftp-server',
                'sftp-server'
            ];
            
            // We'll try the first one that exists or just fallback to 'sftp-server'
            // For simplicity and to handle the user's specific request, we use 'sudo -s sftp-server'
            // Some systems might need the full path.
            const cmd = `echo "${session.password}" | sudo -S -p "" -s sftp-server`;
            
            session.conn.exec(cmd, (err, _stream) => {
                if (err) return reject(err);
                
                // @ts-ignore - ssh2's SFTP constructor is not always in the types as public
                session.conn.sftp((err, sftp) => {
                    if (err) {
                       // Fallback to normal sftp if sudo sftp fails or is not supported this way
                       console.warn("Sudo SFTP failed, falling back to normal SFTP", err);
                       session.conn.sftp((err2, sftp2) => {
                           if (err2) return reject(err2);
                           resolve(sftp2);
                       });
                    } else {
                        resolve(sftp);
                    }
                });
            });
        }
    });
};
