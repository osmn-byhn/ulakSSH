import { executeCommand, type SudoSession } from './execute.js';

export interface SystemInfo {
    os?: string;
    kernel?: string;
    uptime?: string;
    packages?: string;
    shell?: string;
    cpu?: string;
    memory?: string;
}

export const getSystemInfo = async (session: SudoSession): Promise<SystemInfo> => {
    // One-liner for maximum compatibility and reliability
    const cmd = "PRETTY_NAME=$(grep PRETTY_NAME /etc/os-release | cut -d= -f2 | tr -d '\"'); " +
        "echo ${PRETTY_NAME:-$(uname -s)}; " +
        "uname -sr; " +
        "uptime -p | sed 's/uptime //' || echo 'Unknown'; " +
        "echo $SHELL; " +
        "lscpu | grep 'Model name' | cut -d: -f2 | sed 's/^[ \t]*//' | head -n 1 || grep 'model name' /proc/cpuinfo | cut -d: -f2 | sed 's/^[ \t]*//' | head -n 1 || echo 'Unknown CPU'; " +
        "free -h | grep Mem | awk '{print $3 \" / \" $2}' || echo 'Unknown'";

    const output = await executeCommand(session, cmd);
    const lines = output.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    return {
        os: lines[0] || 'Linux',
        kernel: lines[1] || 'Unknown',
        uptime: lines[2] || 'Unknown',
        shell: lines[3] || 'bash',
        cpu: lines[4] || 'Unknown CPU',
        memory: lines[5] || 'Unknown'
    };
};
