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
        script: string;
        uptime: string;
    }>;
    osLogs: string;
}

export const getHealthStatus = (conn: Client, password?: string): Promise<HealthStatus> => {
    // Helper to wrap commands with sudo -S if password is provided
    const sudo = (cmd: string) => {
        if (!password) return cmd;
        return `echo "${password}" | sudo -S ${cmd}`;
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
                    forever: []
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
                        // Forever doesn't have a great JSON output, parsing text basics
                        status.forever = sectionContent.trim().split('\n').filter(l => l.includes('[')).map(l => {
                            const parts = l.split(/\s+/);
                            // [0] script.js (pid 123) uptime 0:0:0:1
                            return { id: parts[1], script: parts[2], uptime: parts[parts.length-1] };
                        });
                        currentSection = ''; sectionContent = ''; continue; 
                    }
                    if (trimmed === 'OS_LOGS_START') { currentSection = 'oslogs'; sectionContent = ''; continue; }
                    if (trimmed === 'OS_LOGS_END') { status.osLogs = sectionContent.trim(); currentSection = ''; continue; }

                    if (currentSection === 'oslogs' || currentSection === 'pm2' || currentSection === 'docker' || currentSection === 'forever') {
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
