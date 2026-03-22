import { executeCommand } from '../ssh/execute.js';
export const getProcessLogs = async (session, type, target) => {
    let cmd = '';
    switch (type) {
        case 'pm2':
            cmd = `pm2 logs ${target} --lines 100 --no-colors`;
            break;
        case 'docker':
            cmd = `docker logs ${target} --tail 100 2>&1`;
            break;
        case 'docker-compose':
            cmd = `docker compose logs ${target} --tail 100 --no-color 2>&1`;
            break;
        case 'forever':
            cmd = `forever logs ${target} -n 100`;
            break;
        case 'systemd':
            cmd = `journalctl -u ${target} -n 100 --no-pager`;
            break;
        case 'supervisor':
            cmd = `supervisorctl tail -1000 ${target}`;
            break;
        case 'oxmgr':
            cmd = `oxmgr logs ${target} --lines 100`;
            break;
        case 'pmc':
            cmd = `pmc logs ${target}`;
            break;
        case 'strong-pm':
            cmd = `slc pm log ${target}`;
            break;
    }
    if (!cmd)
        throw new Error(`Unsupported process manager: ${type}`);
    try {
        const output = await executeCommand(session, cmd);
        return output.trim();
    }
    catch (err) {
        // executeCommand might reject with error output, which we want as the log output
        return err.message;
    }
};
