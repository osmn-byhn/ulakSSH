import { Client } from 'ssh2';

export interface ServerStats {
    cpu: {
        usage: number; // 0-100
        loadAvg: number[];
        cores: number;
        perCore: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
        percent: number;
    };
    processes: Array<{
        pid: string;
        user: string;
        cpu: number;
        mem: number;
        command: string;
    }>;
    gpu?: {
        name: string;
        usage: number;
        memoryUsed: number;
        memoryTotal: number;
        temp: number;
    };
    uptime: string;
}

export const getServerStats = (conn: Client): Promise<ServerStats> => {
    return new Promise((resolve, reject) => {
        // Combined command to get most info in one go
        // 1. CPU usage (from top)
        // 2. Memory (from free)
        // 3. Processes (from ps)
        // 4. Uptime
        // 5. GPU (conditional nvidia-smi)
        const cmd = `
            # Function to get CPU times from /proc/stat
            get_cpu_times() {
                grep '^cpu[0-9]' /proc/stat | awk '{
                    total = $2+$3+$4+$5+$6+$7+$8+$9+$10
                    idle = $5
                    print $1","total","idle
                }'
            }

            # First reading
            CPU_BEFORE=$(get_cpu_times)
            sleep 0.1
            # Second reading
            CPU_AFTER=$(get_cpu_times)

            # Calculate Per-Core
            PER_CORE=""
            while read -r line_after; do
                cpu_id=$(echo "$line_after" | cut -d',' -f1)
                total_after=$(echo "$line_after" | cut -d',' -f2)
                idle_after=$(echo "$line_after" | cut -d',' -f3)

                line_before=$(echo "$CPU_BEFORE" | grep "^$cpu_id,")
                total_before=$(echo "$line_before" | cut -d',' -f2)
                idle_before=$(echo "$line_before" | cut -d',' -f3)

                total_diff=$((total_after - total_before))
                idle_diff=$((idle_after - idle_before))

                if [ "$total_diff" -gt 0 ]; then
                    usage=$(( 100 * (total_diff - idle_diff) / total_diff ))
                else
                    usage=0
                fi
                PER_CORE="$PER_CORE $usage"
            done <<EOF
$CPU_AFTER
EOF

            # CPU and Load (Total)
            CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1}')
            LOAD_AVG=$(cat /proc/loadavg | awk '{print $1" "$2" "$3}')
            CORES=$(nproc)
            
            # Memory
            MEM_INFO=$(free -b | grep Mem)
            MEM_TOTAL=$(echo $MEM_INFO | awk '{print $2}')
            MEM_USED=$(echo $MEM_INFO | awk '{print $3}')
            MEM_FREE=$(echo $MEM_INFO | awk '{print $4}')
            
            # Processes (Top 10 by CPU)
            PROCESSES=$(ps aux --sort=-%cpu | head -n 11 | tail -n 10 | awk '{print $2"|"$1"|"$3"|"$4"|"$11}')
            
            # Uptime
            UPTIME=$(uptime -p)
            
            # GPU (check nvidia-smi)
            if command -v nvidia-smi >/dev/null 2>&1; then
                GPU_INFO=$(nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits)
            else
                GPU_INFO="N/A"
            fi
            
            echo "CPU_USAGE:$CPU_USAGE"
            echo "LOAD_AVG:$LOAD_AVG"
            echo "CORES:$CORES"
            echo "PER_CORE:$PER_CORE"
            echo "MEM_TOTAL:$MEM_TOTAL"
            echo "MEM_USED:$MEM_USED"
            echo "MEM_FREE:$MEM_FREE"
            echo "UPTIME:$UPTIME"
            echo "GPU:$GPU_INFO"
            echo "PROCS:"
            echo "$PROCESSES"
        `;

        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);

            let output = '';
            stream.on('data', (data: Buffer) => output += data.toString());
            stream.on('close', () => {
                try {
                    const lines = output.split('\n');
                    const stats: Partial<ServerStats> = {
                        cpu: { usage: 0, loadAvg: [], cores: 1, perCore: [] },
                        memory: { total: 0, used: 0, free: 0, percent: 0 },
                        processes: [],
                        uptime: ''
                    };

                    let parsingProcs = false;
                    for (const line of lines) {
                        const colonIndex = line.indexOf(':');
                        if (colonIndex === -1) { // Skip lines without a colon, or process them if they are part of PROCS
                            if (parsingProcs && line.includes('|')) {
                                const [pid, user, cpu, mem, cmd] = line.split('|');
                                stats.processes!.push({
                                    pid,
                                    user,
                                    cpu: parseFloat(cpu) || 0,
                                    mem: parseFloat(mem) || 0,
                                    command: cmd
                                });
                            }
                            continue;
                        }

                        const [key, val] = [line.slice(0, colonIndex), line.slice(colonIndex + 1)];

                        if (key === 'CPU_USAGE') stats.cpu!.usage = parseFloat(val) || 0;
                        if (key === 'LOAD_AVG') stats.cpu!.loadAvg = val.trim().split(' ').map(Number);
                        if (key === 'CORES') stats.cpu!.cores = parseInt(val) || 1;
                        if (key === 'PER_CORE') stats.cpu!.perCore = val.trim().split(' ').filter(Boolean).map(v => parseInt(v) || 0);
                        if (key === 'MEM_TOTAL') stats.memory!.total = parseInt(val) || 0;
                        if (key === 'MEM_USED') stats.memory!.used = parseInt(val) || 0;
                        if (key === 'MEM_FREE') stats.memory!.free = parseInt(val) || 0;
                        if (key === 'UPTIME') stats.uptime = val.trim();
                        if (key === 'GPU') {
                            const gpuStr = val.trim();
                            if (gpuStr !== 'N/A' && gpuStr !== '') {
                                const parts = gpuStr.split(', ');
                                stats.gpu = {
                                    name: parts[0],
                                    usage: parseFloat(parts[1]) || 0,
                                    memoryUsed: parseFloat(parts[2]) || 0,
                                    memoryTotal: parseFloat(parts[3]) || 0,
                                    temp: parseFloat(parts[4]) || 0
                                };
                            }
                        }
                        if (key === 'PROCS') {
                            parsingProcs = true;
                            continue;
                        }
                    }

                    if (stats.memory!.total > 0) {
                        stats.memory!.percent = (stats.memory!.used / stats.memory!.total) * 100;
                    }

                    resolve(stats as ServerStats);
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
};
