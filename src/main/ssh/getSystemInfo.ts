import { Client } from 'ssh2';

export interface SystemInfo {
    os?: string;
    kernel?: string;
    uptime?: string;
    packages?: string;
    shell?: string;
    cpu?: string;
    memory?: string;
}

export const getSystemInfo = (conn: Client): Promise<SystemInfo> => {
    return new Promise((resolve, reject) => {
        // One-liner for maximum compatibility and reliability
        const cmd = "PRETTY_NAME=$(grep PRETTY_NAME /etc/os-release | cut -d= -f2 | tr -d '\"'); " +
            "echo ${PRETTY_NAME:-$(uname -s)}; " +
            "uname -sr; " +
            "uptime -p | sed 's/uptime //' || echo 'Unknown'; " +
            "echo $SHELL; " +
            "lscpu | grep 'Model name' | cut -d: -f2 | sed 's/^[ \t]*//' | head -n 1 || grep 'model name' /proc/cpuinfo | cut -d: -f2 | sed 's/^[ \t]*//' | head -n 1 || echo 'Unknown CPU'; " +
            "free -h | grep Mem | awk '{print $3 \" / \" $2}' || echo 'Unknown'";

        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);

            let output = '';
            stream.on('data', (data: Buffer) => {
                output += data.toString();
            }).on('close', () => {
                const lines = output.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                const info: SystemInfo = {
                    os: lines[0] || 'Linux',
                    kernel: lines[1] || 'Unknown',
                    uptime: lines[2] || 'Unknown',
                    shell: lines[3] || 'bash',
                    cpu: lines[4] || 'Unknown CPU',
                    memory: lines[5] || 'Unknown'
                };
                resolve(info);
            });
        });
    });
};
