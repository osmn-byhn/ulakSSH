import { Client, type SFTPWrapper } from 'ssh2';

export interface SudoSession {
    conn: Client;
    password?: string;
    username: string;
    shouldSudo: boolean;
}

export const executeCommand = (session: SudoSession, cmd: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const passwordPart = session.password ? `echo "${session.password}" | ` : '';
        const command = session.shouldSudo 
            ? `${passwordPart}sudo -S -p "" ${cmd}`
            : String(cmd);

        // console.log(`[executeCommand] Executing: ${command}`);
        session.conn.exec(command, (err, stream) => {
            if (err) {
                console.error(`[executeCommand] Exec error for: ${command}`, err);
                return reject(err);
            }

            let output = '';
            let errorOutput = '';
            let exitCode: number | null = null;
            let exitSignal: string | null = null;

            stream.on('data', (data: Buffer) => {
                output += data.toString();
            }).stderr.on('data', (data: Buffer) => {
                const chunk = data.toString();
                if (!chunk.includes('password for') && !chunk.includes('Password:')) {
                    errorOutput += chunk;
                }
            });

            stream.on('exit', (code: number | null, signal: string | null) => {
                exitCode = code;
                exitSignal = signal;
            });

            stream.on('close', () => {
                if (exitCode === 0 && !exitSignal) {
                    resolve(output);
                } else {
                    const errorMsg = errorOutput.trim() || 
                        (exitCode === null && !exitSignal ? "Connection closed during execution" : `Command failed with code ${exitCode}${exitSignal ? ` and signal ${exitSignal}` : ''}`);
                    console.error(`[executeCommand] Failed: ${command}`, { code: exitCode, signal: exitSignal, errorOutput });
                    reject(new Error(`${errorMsg} (Command: ${command})`));
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
            
            // We'll try the first one that exists or just fallback to 'sftp-server'
            // For simplicity and to handle the user's specific request, we use 'sudo -s sftp-server'
            // Some systems might need the full path.
            const passwordPart = session.password ? `echo "${session.password}" | ` : '';
            const cmd = `${passwordPart}sudo -S -p "" -s sftp-server`;
            console.log(`[getSftp] Executing sudo sftp: ${cmd}`);
            
            session.conn.exec(cmd, (err, stream) => {
                if (err) {
                    console.error(`[getSftp] Exec error for: ${cmd}`, err);
                    return reject(err);
                }

                let exitCode: number | null = null;
                let exitSignal: string | null = null;

                stream.on('error', (streamErr: any) => {
                    console.error(`[getSftp] Stream error for: ${cmd}`, streamErr);
                });

                stream.on('exit', (code: number | null, signal: string | null) => {
                    exitCode = code;
                    exitSignal = signal;
                });

                stream.on('close', () => {
                    if (exitCode !== 0 || exitSignal) {
                        console.warn(`[getSftp] Sudo SFTP closed with code ${exitCode} and signal ${exitSignal}. Falling back to normal SFTP.`);
                    }
                });

                
                // @ts-ignore - ssh2's SFTP constructor is not always in the types as public
                session.conn.sftp((err, sftp) => {
                    if (err) {
                       console.warn("[getSftp] Sudo SFTP failed, falling back to normal SFTP", err);
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
