import { executeCommand, type SudoSession } from '../ssh/execute.js';

export type ProcessType = 'pm2' | 'docker' | 'forever' | 'pid';
export type ProcessAction = 'start' | 'stop' | 'restart' | 'kill' | 'delete';

export const manageProcess = async (
    session: SudoSession,
    type: ProcessType,
    action: ProcessAction,
    target: string
): Promise<{ success: boolean; error?: string }> => {
    let cmd = '';

    switch (type) {
        case 'pm2':
            if (action === 'delete') {
                cmd = `pm2 delete ${target}`;
            } else {
                cmd = `pm2 ${action} ${target}`;
            }
            break;
        case 'docker':
            if (action === 'delete') {
                cmd = `docker rm -f ${target}`;
            } else {
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
    } catch (err: any) {
        return { success: false, error: err.message };
    }
};
