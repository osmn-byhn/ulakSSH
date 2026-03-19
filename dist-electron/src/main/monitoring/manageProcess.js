export const manageProcess = (conn, type, action, target, password) => {
    return new Promise((resolve) => {
        let cmd = '';
        const sudo = (c) => {
            if (!password)
                return c;
            return `echo "${password}" | sudo -S ${c}`;
        };
        switch (type) {
            case 'pm2':
                if (action === 'delete') {
                    cmd = sudo(`pm2 delete ${target}`);
                }
                else {
                    cmd = sudo(`pm2 ${action} ${target}`);
                }
                break;
            case 'docker':
                if (action === 'delete') {
                    cmd = sudo(`docker rm -f ${target}`);
                }
                else {
                    cmd = sudo(`docker ${action} ${target}`);
                }
                break;
            case 'forever':
                // Forever 'stop' is effectively removing it from the running list
                cmd = sudo(`forever stop ${target}`);
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
            if (err)
                return resolve({ success: false, error: err.message });
            let errorOutput = '';
            stream.stderr.on('data', (data) => errorOutput += data.toString());
            stream.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true });
                }
                else {
                    resolve({ success: false, error: errorOutput.trim() || `Exit code: ${code}` });
                }
            });
        });
    });
};
