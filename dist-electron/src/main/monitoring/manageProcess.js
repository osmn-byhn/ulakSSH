import { executeCommand } from '../ssh/execute.js';
export const manageProcess = async (session, type, action, target) => {
    let cmd = '';
    switch (type) {
        case 'pm2':
            if (action === 'delete') {
                cmd = `pm2 delete ${target}`;
            }
            else {
                cmd = `pm2 ${action} ${target}`;
            }
            break;
        case 'docker':
            if (action === 'delete') {
                cmd = `docker rm -f ${target}`;
            }
            else {
                cmd = `docker ${action} ${target}`;
            }
            break;
        case 'forever':
            // Forever 'stop' is effectively removing it from the running list
            cmd = `forever stop ${target}`;
            break;
        case 'pid':
            if (action === 'kill') {
                cmd = `kill -9 ${target}`;
            }
            break;
    }
    if (!cmd) {
        return { success: false, error: 'Unsupported process type or action' };
    }
    try {
        await executeCommand(session, cmd);
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
};
