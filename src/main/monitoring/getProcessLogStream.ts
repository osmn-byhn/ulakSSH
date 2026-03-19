import type { Client } from 'ssh2';
import type { ProcessManagerType } from './getProcessLogs.js';

export const getProcessLogStream = (
    conn: Client,
    type: ProcessManagerType,
    target: string,
    password?: string
): Promise<any> => {
    const sudo = (cmd: string) => {
        if (!password) return cmd;
        return `echo "${password}" | sudo -S ${cmd}`;
    };

    let cmd = '';
    switch (type) {
        case 'pm2':
            cmd = sudo(`pm2 logs ${target} --lines 100 --no-colors`); // pm2 logs is already streaming by default but we can add -f for clarity
            break;
        case 'docker':
            cmd = sudo(`docker logs ${target} -f --tail 100 2>&1`);
            break;
        case 'docker-compose':
            cmd = sudo(`docker compose logs ${target} -f --tail 100 --no-color 2>&1`);
            break;
        case 'forever':
            // Forever logs -f might not be universal, often it gives a path
            // We'll try to get the path and tail -f it if it doesn't stream directly
            cmd = sudo(`forever logs ${target} -f`);
            break;
        case 'systemd':
            cmd = sudo(`journalctl -u ${target} -f -n 100 --no-pager`);
            break;
        case 'supervisor':
            cmd = sudo(`supervisorctl tail -f ${target}`);
            break;
        case 'oxmgr':
            cmd = sudo(`oxmgr logs ${target} -f --lines 100`);
            break;
        case 'pmc':
            cmd = sudo(`pmc logs ${target} -f`);
            break;
        case 'strong-pm':
            cmd = sudo(`slc pm log ${target} -f`);
            break;
    }

    return new Promise((resolve, reject) => {
        if (!cmd) return reject(new Error(`Unsupported process manager for streaming: ${type}`));

        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            resolve(stream);
        });
    });
};
