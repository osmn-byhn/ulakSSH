import { Client } from 'ssh2';

export type ProcessManagerType = 
    | 'pm2' 
    | 'docker' 
    | 'docker-compose' 
    | 'forever' 
    | 'systemd' 
    | 'supervisor' 
    | 'oxmgr' 
    | 'pmc' 
    | 'strong-pm';

export const getProcessLogs = (
    conn: Client,
    type: ProcessManagerType,
    target: string,
    password?: string
): Promise<string> => {
    const sudo = (cmd: string) => {
        if (!password) return cmd;
        return `echo "${password}" | sudo -S ${cmd}`;
    };

    let cmd = '';
    switch (type) {
        case 'pm2':
            cmd = sudo(`pm2 logs ${target} --lines 100 --no-colors`);
            break;
        case 'docker':
            cmd = sudo(`docker logs ${target} --tail 100 2>&1`);
            break;
        case 'docker-compose':
            cmd = sudo(`docker compose logs ${target} --tail 100 --no-color 2>&1`);
            break;
        case 'forever':
            cmd = sudo(`forever logs ${target} -n 100`);
            break;
        case 'systemd':
            cmd = sudo(`journalctl -u ${target} -n 100 --no-pager`);
            break;
        case 'supervisor':
            cmd = sudo(`supervisorctl tail -1000 ${target}`); // supervisorctl tail uses bytes or similar, but often -1000 works for last 1000 lines/bytes
            break;
        case 'oxmgr':
            cmd = sudo(`oxmgr logs ${target} --lines 100`);
            break;
        case 'pmc':
            cmd = sudo(`pmc logs ${target}`); // Adjust based on pmc docs if needed
            break;
        case 'strong-pm':
            cmd = sudo(`slc pm log ${target}`);
            break;
    }

    return new Promise((resolve, reject) => {
        if (!cmd) return reject(new Error(`Unsupported process manager: ${type}`));

        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);

            let output = '';
            stream.on('data', (data: Buffer) => output += data.toString());
            stream.stderr.on('data', (data: Buffer) => output += data.toString());
            stream.on('close', () => resolve(output.trim()));
        });
    });
};
