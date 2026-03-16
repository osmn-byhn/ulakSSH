export const getHealthStatus = (conn) => {
    return new Promise((resolve, reject) => {
        const cmd = `
            # Port Status
            echo "PORTS_START"
            if command -v ss >/dev/null 2>&1; then
                ss -tulpn | grep LISTEN | awk '{print $4"|"$1"|"$7}' | sed 's/users:(("//g;s/"))//g;s/",pid=.*,fd=.*//g'
            elif command -v netstat >/dev/null 2>&1; then
                netstat -tulpn | grep LISTEN | awk '{print $4"|"$1"|"$7}'
            fi
            echo "PORTS_END"

            # PM2
            if command -v pm2 >/dev/null 2>&1; then
                echo "PM2_START"
                pm2 list --no-color | grep -v "PM2" | grep -v "+-" | grep -v "Name" || echo "No active PM2 processes"
                echo "---LOGS---"
                pm2 logs --lines 20 --no-colors --raw "*" 2>/dev/null | tail -n 20 || echo "No logs available"
                echo "PM2_END"
            fi

            # Docker
            if command -v docker >/dev/null 2>&1; then
                echo "DOCKER_START"
                docker ps --format "{{.Names}}|{{.Status}}|{{.Image}}" || echo "No containers found"
                echo "---LOGS---"
                # Get logs for first 3 containers to avoid huge output
                for container in $(docker ps --format "{{.Names}}" | head -n 3); do
                    echo "Container: $container"
                    docker logs --tail 10 "$container" 2>&1
                    echo ""
                done
                echo "DOCKER_END"
            fi

            # Forever
            if command -v forever >/dev/null 2>&1; then
                echo "FOREVER_START"
                forever list --no-color || echo "No forever processes"
                echo "---LOGS---"
                echo "Logs can be found in ~/.forever/"
                echo "FOREVER_END"
            fi

            # OS Logs
            echo "OS_LOGS_START"
            if command -v journalctl >/dev/null 2>&1; then
                journalctl -n 50 --no-pager | tail -n 50
            elif [ -f /var/log/syslog ]; then
                tail -n 50 /var/log/syslog
            elif [ -f /var/log/messages ]; then
                tail -n 50 /var/log/messages
            fi
            echo "OS_LOGS_END"
        `;
        conn.exec(cmd, (err, stream) => {
            if (err)
                return reject(err);
            let output = '';
            stream.on('data', (data) => output += data.toString());
            stream.on('close', () => {
                const status = {
                    ports: [],
                    osLogs: ''
                };
                const lines = output.split('\n');
                let currentSection = '';
                let sectionContent = '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed)
                        continue;
                    if (trimmed === 'PORTS_START') {
                        currentSection = 'ports';
                        continue;
                    }
                    if (trimmed === 'PORTS_END') {
                        currentSection = '';
                        continue;
                    }
                    if (trimmed === 'PM2_START') {
                        currentSection = 'pm2';
                        sectionContent = '';
                        continue;
                    }
                    if (trimmed === 'PM2_END') {
                        const parts = sectionContent.split('---LOGS---');
                        status.pm2 = { status: parts[0]?.trim() || '', logs: parts[1]?.trim() || '' };
                        currentSection = '';
                        continue;
                    }
                    if (trimmed === 'DOCKER_START') {
                        currentSection = 'docker';
                        sectionContent = '';
                        continue;
                    }
                    if (trimmed === 'DOCKER_END') {
                        const parts = sectionContent.split('---LOGS---');
                        status.docker = { status: parts[0]?.trim() || '', logs: parts[1]?.trim() || '' };
                        currentSection = '';
                        continue;
                    }
                    if (trimmed === 'FOREVER_START') {
                        currentSection = 'forever';
                        sectionContent = '';
                        continue;
                    }
                    if (trimmed === 'FOREVER_END') {
                        const parts = sectionContent.split('---LOGS---');
                        status.forever = { status: parts[0]?.trim() || '', logs: parts[1]?.trim() || '' };
                        currentSection = '';
                        continue;
                    }
                    if (trimmed === 'OS_LOGS_START') {
                        currentSection = 'oslogs';
                        sectionContent = '';
                        continue;
                    }
                    if (trimmed === 'OS_LOGS_END') {
                        status.osLogs = sectionContent.trim();
                        currentSection = '';
                        continue;
                    }
                    if (currentSection === 'ports') {
                        const parts = trimmed.split('|');
                        if (parts.length >= 3) {
                            const [addr, proto, proc] = parts;
                            status.ports.push({
                                port: addr.split(':').pop() || '',
                                protocol: proto,
                                process: proc.split(',')[0] || 'Unknown',
                                listen: addr
                            });
                        }
                    }
                    else if (currentSection === 'pm2' || currentSection === 'docker' || currentSection === 'forever' || currentSection === 'oslogs') {
                        sectionContent += line + '\n';
                    }
                }
                resolve(status);
            });
        });
    });
};
