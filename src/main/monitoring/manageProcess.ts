import { Client } from 'ssh2';

export type ProcessType = 'pm2' | 'docker' | 'forever' | 'pid';
export type ProcessAction = 'start' | 'stop' | 'restart' | 'kill';

export const manageProcess = (
    conn: Client,
    type: ProcessType,
    action: ProcessAction,
    target: string,
    password?: string
): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
        let cmd = '';

        const sudo = (c: string) => {
            if (!password) return c;
            return `echo "${password}" | sudo -S ${c}`;
        };

        switch (type) {
            case 'pm2':
                cmd = sudo(`pm2 ${action} ${target}`);
                break;
            case 'docker':
                cmd = sudo(`docker ${action} ${target}`);
                break;
            case 'forever':
                cmd = sudo(`forever ${action} ${target}`);
                break;
            case 'pid':
                if (action === 'kill') {
                    cmd = sudo(`kill -9 ${target}`);
                }
                break;
        }

        if (!cmd) {
            return resolve({ success: false, error: 'Unsupported process type or action' });
        }

        conn.exec(cmd, (err, stream) => {
            if (err) return resolve({ success: false, error: err.message });

            let errorOutput = '';
            stream.stderr.on('data', (data) => errorOutput += data.toString());
            stream.on('close', (code: number | null) => {
                if (code === 0) {
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: errorOutput.trim() || `Exit code: ${code}` });
                }
            });
        });
    });
};
