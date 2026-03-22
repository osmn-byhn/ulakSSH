export const getProcessLogStream = (session, type, target) => {
    let cmd = '';
    switch (type) {
        case 'pm2':
            cmd = `pm2 logs ${target} --lines 100 --no-colors`;
            break;
        case 'docker':
            cmd = `docker logs ${target} -f --tail 100 2>&1`;
            break;
        case 'docker-compose':
            cmd = `docker compose logs ${target} -f --tail 100 --no-color 2>&1`;
            break;
        case 'forever':
            cmd = `forever logs ${target} -f`;
            break;
        case 'systemd':
            cmd = `journalctl -u ${target} -f -n 100 --no-pager`;
            break;
        case 'supervisor':
            cmd = `supervisorctl tail -f ${target}`;
            break;
        case 'oxmgr':
            cmd = `oxmgr logs ${target} -f --lines 100`;
            break;
        case 'pmc':
            cmd = `pmc logs ${target} -f`;
            break;
        case 'strong-pm':
            cmd = `slc pm log ${target} -f`;
            break;
    }
    if (!cmd)
        return Promise.reject(new Error(`Unsupported process manager for streaming: ${type}`));
    const finalCmd = session.shouldSudo
        ? `echo "${session.password}" | sudo -S -p "" ${cmd}`
        : cmd;
    return new Promise((resolve, reject) => {
        session.conn.exec(finalCmd, (err, stream) => {
            if (err)
                return reject(err);
            resolve(stream);
        });
    });
};
