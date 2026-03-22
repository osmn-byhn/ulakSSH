import type { SudoSession } from './execute.js';

export const runScriptStream = (
    session: SudoSession,
    command: string
): Promise<any> => {
    // We'll wrap the command in a shell-friendly way if needed, 
    // but usually running it directly with session.conn.exec is enough.
    // However, if sudo is needed, we follow the same pattern as before.
    
    const finalCmd = session.shouldSudo 
        ? `echo "${session.password}" | sudo -S -p "" bash -c "${command.replace(/"/g, '\\"')}"`
        : command;

    return new Promise((resolve, reject) => {
        session.conn.exec(finalCmd, (err, stream) => {
            if (err) return reject(err);
            resolve(stream);
        });
    });
};
