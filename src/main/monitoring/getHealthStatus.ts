import { Client } from 'ssh2';

export interface HealthStatus {
    ports: Array<{
        port: string;
        protocol: string;
        process: string;
        pid: string;
        listen: string;
    }>;
    pm2?: Array<{
        id: string;
        name: string;
        status: string;
        cpu: string;
        mem: string;
        uptime: string;
        restarts: string;
    }>;
    docker?: Array<{
        id: string;
        name: string;
        status: string;
        image: string;
        ports: string;
    }>;
    forever?: Array<{
        id: string;
        uid?: string;
        command?: string;
        script?: string;
        forever_pid?: string;
        pid?: string;
        logfile?: string;
        uptime: string;
        port?: string;
    }>;
    systemd?: Array<{
        name: string;
        status: string;
        description: string;
    }>;
    supervisor?: Array<{
        name: string;
        status: string;
        pid: string;
        uptime: string;
    }>;
    dockerCompose?: Array<{
        service: string;
        status: string;
        id: string;
        ports: string;
    }>;
    circus?: Array<{
        name: string;
        status: string;
    }>;
    oxmgr?: Array<{
        id: string;
        name: string;
        status: string;
        cpu: string;
        mem: string;
    }>;
    strongPm?: Array<{
        id: string;
        name: string;
        status: string;
    }>;
    pmc?: Array<{
        id: string;
        name: string;
        status: string;
    }>;
    osLogs: string;
}

export const getHealthStatus = (conn: Client, password?: string): Promise<HealthStatus> => {
    // Helper to wrap commands with sudo -S if password is provided
    const sudo = (cmd: string) => {
        if (!password) return cmd;
        return `echo "${password}" | sudo -S ${cmd}`;
    };

    const extractPort = (cmd: string): string => {
        const portMatch = cmd.match(/--port[=\s](\d+)/) || 
                         cmd.match(/:(\d+)\s+/) || 
                         cmd.match(/PORT=(\d+)/) || 
                         cmd.match(/-p\s+(\d+)/);
        return portMatch ? portMatch[1] : '';
    };

    return new Promise((resolve, reject) => {
        const cmd = `
            # Port Status Refined
            echo "PORTS_START"
            if command -v ss >/dev/null 2>&1; then
                ${sudo("ss -tulpn")} | grep LISTEN | awk '{
                    proto=$1; addr=$5; 
                    users=$(NF);
                    pid=""; name="";
                    if (users ~ /users:/) {
                        if (match(users, /pid=([0-9]+)/, p)) pid=p[1];
                        if (match(users, /"([^"]+)"/, n)) name=n[1];
                    }
                    if (addr != "") print addr"|"proto"|"name"|"pid
                }'
            elif command -v netstat >/dev/null 2>&1; then
                ${sudo("netstat -tulpn")} | grep LISTEN | awk '{
                    proto=$1; addr=$4; proc=$(NF);
                    pid=""; name="";
                    if (proc ~ /[0-9]+\//) {
                        split(proc, a, "/"); pid=a[1]; name=a[2];
                    }
                    print addr"|"proto"|"name"|"pid
                }'
            elif command -v lsof >/dev/null 2>&1; then
                ${sudo("lsof -i -P -n")} | grep LISTEN | awk '{
                   name=$1; pid=$2; proto=$8; addr=$9;
                   print addr"|"proto"|"name"|"pid
                }'
            fi
            echo "PORTS_END"

            # PM2 (JSON format for robust parsing)
            if command -v pm2 >/dev/null 2>&1; then
                echo "PM2_START"
                ${sudo("pm2 jlist")} 2>/dev/null
                echo "PM2_END"
            fi

            # Docker (Structured list)
            if command -v docker >/dev/null 2>&1; then
                echo "DOCKER_START"
                # Try regular first, then sudo -S (via helper)
                docker ps -a --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}" 2>/dev/null || \
                ${sudo("docker ps -a --format '{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}'")} 2>/dev/null
                echo "DOCKER_END"
            fi

            # Forever
            if command -v forever >/dev/null 2>&1; then
                echo "FOREVER_START"
                ${sudo("forever list --no-color")} 2>/dev/null
                echo "FOREVER_END"
            fi

            # systemd
            if command -v systemctl >/dev/null 2>&1; then
                echo "SYSTEMD_START"
                ${sudo("systemctl list-units --type=service --state=running --no-pager --no-legend")} 2>/dev/null
                echo "SYSTEMD_END"
            fi

            # Supervisor
            if command -v supervisorctl >/dev/null 2>&1; then
                echo "SUPERVISOR_START"
                ${sudo("supervisorctl status")} 2>/dev/null
                echo "SUPERVISOR_END"
            fi

            # Docker Compose
            if command -v docker >/dev/null 2>&1; then
                echo "DOCKER_COMPOSE_START"
                # Check for both 'docker compose' and 'docker-compose'
                if docker compose version >/dev/null 2>&1; then
                    ${sudo("docker compose ps --format '{{.Service}}|{{.Status}}|{{.ID}}|{{.Ports}}'")} 2>/dev/null
                elif command -v docker-compose >/dev/null 2>&1; then
                    ${sudo("docker-compose ps --format '{{.Service}}|{{.Status}}|{{.ID}}|{{.Ports}}'")} 2>/dev/null
                fi
                echo "DOCKER_COMPOSE_END"
            fi

            # Circus
            if command -v circusctl >/dev/null 2>&1; then
                echo "CIRCUS_START"
                ${sudo("circusctl status")} 2>/dev/null
                echo "CIRCUS_END"
            fi

            # Oxmgr
            if command -v oxmgr >/dev/null 2>&1; then
                echo "OXMGR_START"
                ${sudo("oxmgr ls")} 2>/dev/null
                echo "OXMGR_END"
            fi

            # Strong-PM
            if command -v slc >/dev/null 2>&1; then
                echo "STRONGPM_START"
                ${sudo("slc pm status")} 2>/dev/null
                echo "STRONGPM_END"
            fi

            # pmc
            if command -v pmc >/dev/null 2>&1; then
                echo "PMC_START"
                ${sudo("pmc list")} 2>/dev/null
                echo "PMC_END"
            fi

            # OS Logs
            echo "OS_LOGS_START"
            if command -v journalctl >/dev/null 2>&1; then
                ${sudo("journalctl -n 50 --no-pager")} | tail -n 50
            elif [ -f /var/log/syslog ]; then
                ${sudo("tail -n 50 /var/log/syslog")}
            fi
            echo "OS_LOGS_END"
        `;

        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);

            let output = '';
            stream.on('data', (data: Buffer) => output += data.toString());
            stream.on('close', () => {
                const status: HealthStatus = {
                    ports: [],
                    osLogs: '',
                    pm2: [],
                    docker: [],
                    forever: [],
                    systemd: [],
                    supervisor: [],
                    dockerCompose: [],
                    circus: [],
                    oxmgr: [],
                    strongPm: [],
                    pmc: []
                };

                const lines = output.split('\n');
                let currentSection = '';
                let sectionContent = '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed === 'PORTS_START') { currentSection = 'ports'; continue; }
                    if (trimmed === 'PORTS_END') { currentSection = ''; continue; }
                    if (trimmed === 'PM2_START') { currentSection = 'pm2'; sectionContent = ''; continue; }
                    if (trimmed === 'PM2_END') { 
                        try {
                            const pm2Data = JSON.parse(sectionContent.trim());
                            status.pm2 = pm2Data.map((p: any) => ({
                                id: p.pm_id?.toString() || '',
                                name: p.name || '',
                                status: p.pm2_env?.status || '',
                                cpu: p.monit?.cpu?.toString() + '%' || '0%',
                                mem: (p.monit?.memory / 1024 / 1024).toFixed(1) + 'MB' || '0MB',
                                uptime: new Date(p.pm2_env?.pm_uptime).toISOString() || '',
                                restarts: p.pm2_env?.restart_time?.toString() || '0'
                            }));
                        } catch (e) {}
                        currentSection = ''; sectionContent = ''; continue; 
                    }
                    if (trimmed === 'DOCKER_START') { currentSection = 'docker'; sectionContent = ''; continue; }
                    if (trimmed === 'DOCKER_END') { 
                        const dockerLines = sectionContent.trim().split('\n').filter(Boolean);
                        status.docker = dockerLines.map(l => {
                            const [id, name, stat, img, ports] = l.split('|');
                            return { id: id || '', name: name || 'Unknown', status: stat || 'Unknown', image: img || 'Unknown', ports: ports || '' };
                        });
                        currentSection = ''; sectionContent = ''; continue; 
                    }
                    if (trimmed === 'FOREVER_START') { currentSection = 'forever'; sectionContent = ''; continue; }
                    if (trimmed === 'FOREVER_END') { 
                        const foreverLines = sectionContent.trim().split('\n');
                        const processes: any[] = [];
                        let currentProc: any = null;

                        for (const l of foreverLines) {
                            const trimmedLine = l.trim();
                            if (!trimmedLine) continue;

                            const indexMatch = trimmedLine.match(/\[(\d+)\]/);
                            if (indexMatch) {
                                if (currentProc) processes.push(currentProc);
                                const parts = trimmedLine.split(/\s+/).filter(Boolean);
                                // data: [0] master-api /usr/bin/node index.js ...
                                const idxInParts = parts.findIndex(p => p.includes(`[${indexMatch[1]}]`));
                                currentProc = {
                                    id: indexMatch[1],
                                    uid: parts[idxInParts + 1] || '?',
                                    command: parts[idxInParts + 2] || '?',
                                    script: parts.slice(idxInParts + 3).join(' '),
                                    uptime: '?', // Will be updated if on next line
                                    port: extractPort(trimmedLine)
                                };
                            } else if (currentProc && !trimmedLine.toLowerCase().includes('info:') && !trimmedLine.toLowerCase().includes('data:')) {
                                // Try to extract PID, logfile, uptime from wrapped line
                                const parts = trimmedLine.split(/\s+/).filter(Boolean);
                                if (parts.length >= 4) {
                                    currentProc.forever_pid = parts[0];
                                    currentProc.pid = parts[1];
                                    currentProc.logfile = parts[2];
                                    currentProc.uptime = parts.slice(3).join(' ');
                                } else if (parts.length === 1 && trimmedLine.includes(':')) {
                                    // Sometimes uptime is just on its own or logfile
                                    currentProc.uptime = trimmedLine;
                                }
                            } else if (currentProc && trimmedLine.toLowerCase().includes('uptime')) {
                                // If uptime is explicitly on the same line but further down
                                const uptimeMatch = trimmedLine.match(/uptime\s+(.+)$/i);
                                if (uptimeMatch) currentProc.uptime = uptimeMatch[1];
                            }
                        }
                        if (currentProc) processes.push(currentProc);
                        status.forever = processes;
                        currentSection = ''; sectionContent = ''; continue; 
                    }
                    if (trimmed === 'SYSTEMD_START') { currentSection = 'systemd'; sectionContent = ''; continue; }
                    if (trimmed === 'SYSTEMD_END') {
                        status.systemd = sectionContent.trim().split('\n').filter(Boolean).map(l => {
                            const parts = l.trim().split(/\s+/);
                            return { name: parts[0], status: parts[3], description: parts.slice(4).join(' ') };
                        });
                        currentSection = ''; sectionContent = ''; continue;
                    }
                    if (trimmed === 'SUPERVISOR_START') { currentSection = 'supervisor'; sectionContent = ''; continue; }
                    if (trimmed === 'SUPERVISOR_END') {
                        status.supervisor = sectionContent.trim().split('\n').filter(Boolean).map(l => {
                            const parts = l.trim().split(/\s+/);
                            // name RUNNING pid 123, uptime 0:01:02
                            const pidMatch = l.match(/pid (\d+)/);
                            const uptimeMatch = l.match(/uptime (.*)/);
                            return { 
                                name: parts[0], 
                                status: parts[1], 
                                pid: pidMatch ? pidMatch[1] : '', 
                                uptime: uptimeMatch ? uptimeMatch[1] : '' 
                            };
                        });
                        currentSection = ''; sectionContent = ''; continue;
                    }
                    if (trimmed === 'DOCKER_COMPOSE_START') { currentSection = 'dockerCompose'; sectionContent = ''; continue; }
                    if (trimmed === 'DOCKER_COMPOSE_END') {
                        status.dockerCompose = sectionContent.trim().split('\n').filter(Boolean).map(l => {
                            const [service, stat, id, ports] = l.split('|');
                            return { service: service || '', status: stat || '', id: id || '', ports: ports || '' };
                        });
                        currentSection = ''; sectionContent = ''; continue;
                    }
                    if (trimmed === 'CIRCUS_START') { currentSection = 'circus'; sectionContent = ''; continue; }
                    if (trimmed === 'CIRCUS_END') {
                        status.circus = sectionContent.trim().split('\n').filter(Boolean).map(l => {
                            const [name, stat] = l.split(':').map(s => s.trim());
                            return { name, status: stat };
                        });
                        currentSection = ''; sectionContent = ''; continue;
                    }
                    if (trimmed === 'OXMGR_START') { currentSection = 'oxmgr'; sectionContent = ''; continue; }
                    if (trimmed === 'OXMGR_END') {
                        // Assuming oxmgr ls output is similar to PM2 or simple list
                        status.oxmgr = sectionContent.trim().split('\n').filter(Boolean).map(l => {
                            const parts = l.trim().split(/\s+/);
                            return { id: parts[0], name: parts[1], status: parts[2], cpu: parts[3] || '0%', mem: parts[4] || '0MB' };
                        });
                        currentSection = ''; sectionContent = ''; continue;
                    }
                    if (trimmed === 'STRONGPM_START') { currentSection = 'strongPm'; sectionContent = ''; continue; }
                    if (trimmed === 'STRONGPM_END') {
                        status.strongPm = sectionContent.trim().split('\n').filter(Boolean).map(l => {
                            const parts = l.trim().split(/\s+/);
                            return { id: parts[0], name: parts[1], status: parts[2] };
                        });
                        currentSection = ''; sectionContent = ''; continue;
                    }
                    if (trimmed === 'PMC_START') { currentSection = 'pmc'; sectionContent = ''; continue; }
                    if (trimmed === 'PMC_END') {
                        status.pmc = sectionContent.trim().split('\n').filter(Boolean).map(l => {
                            const parts = l.trim().split(/\s+/);
                            return { id: parts[0], name: parts[1], status: parts[2] };
                        });
                        currentSection = ''; sectionContent = ''; continue;
                    }
                    if (trimmed === 'OS_LOGS_START') { currentSection = 'oslogs'; sectionContent = ''; continue; }
                    if (trimmed === 'OS_LOGS_END') { status.osLogs = sectionContent.trim(); currentSection = ''; continue; }

                    if (['oslogs', 'pm2', 'docker', 'forever', 'systemd', 'supervisor', 'dockerCompose', 'circus', 'oxmgr', 'strongPm', 'pmc'].includes(currentSection)) {
                        sectionContent += line + '\n';
                    } else if (currentSection === 'ports') {
                        const parts = trimmed.split('|');
                        if (parts.length >= 4) {
                            status.ports.push({
                                port: parts[0].split(':').pop() || '',
                                protocol: parts[1],
                                process: parts[2] || 'Unknown',
                                pid: parts[3] || '',
                                listen: parts[0]
                            });
                        }
                    }
                }

                resolve(status);
            });
        });
    });
};
