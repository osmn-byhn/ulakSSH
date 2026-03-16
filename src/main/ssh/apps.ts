import { Client } from 'ssh2';

export interface AppInfo {
    name: string;
    version: string;
    latestVersion?: string;
    type: 'system' | 'python' | 'node' | 'other';
    description?: string;
}

export async function getInstalledApps(conn: Client): Promise<AppInfo[]> {
    const apps: AppInfo[] = [];

    // 1. System Packages (Debian/Ubuntu)
    try {
        const dpkgOutput = await executeCommand(conn, "dpkg-query -W -f='${Package}|${Version}|system|${Description}\\n' 2>/dev/null");
        if (dpkgOutput) {
            apps.push(...parseDpkg(dpkgOutput));
        }
    } catch (e) { /* ignore if not debian */ }

    // 2. System Packages (RHEL/CentOS)
    if (apps.length === 0) {
        try {
            const rpmOutput = await executeCommand(conn, "rpm -qa --queryformat '%{NAME}|%{VERSION}|system|%{SUMMARY}\\n' 2>/dev/null");
            if (rpmOutput) {
                apps.push(...parseGeneric(rpmOutput));
            }
        } catch (e) { /* ignore if not rpm */ }
    }

    // 3. Python Packages
    try {
        const pipOutput = await executeCommand(conn, "pip list --format=json 2>/dev/null");
        if (pipOutput) {
            const pipApps = JSON.parse(pipOutput);
            apps.push(...pipApps.map((p: any) => ({
                name: p.name,
                version: p.version,
                type: 'python',
                description: 'Python Package'
            })));
        }
    } catch (e) { /* ignore */ }

    // 4. Global NPM Packages
    try {
        const npmOutput = await executeCommand(conn, "npm list -g --depth=0 --json 2>/dev/null");
        if (npmOutput) {
            const npmData = JSON.parse(npmOutput);
            if (npmData.dependencies) {
                Object.keys(npmData.dependencies).forEach(name => {
                    apps.push({
                        name,
                        version: npmData.dependencies[name].version,
                        type: 'node',
                        description: 'Node.js Global Package'
                    });
                });
            }
        }
    } catch (e) { /* ignore */ }

    return apps.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAppUpdates(conn: Client): Promise<Record<string, string>> {
    const updates: Record<string, string> = {};

    // 1. APT Upgradable
    try {
        const aptOutput = await executeCommand(conn, "apt list --upgradable 2>/dev/null");
        if (aptOutput) {
            const lines = aptOutput.split('\n');
            lines.forEach(line => {
                if (line.includes('[upgradable from:')) {
                    const match = line.match(/^([^\/]+)\/[^\s]+\s+([^\s]+)\s+/);
                    if (match) {
                        updates[match[1]] = match[2];
                    }
                }
            });
        }
    } catch (e) {}

    // 2. PIP Outdated
    try {
        const pipOutput = await executeCommand(conn, "pip list --outdated --format=json 2>/dev/null");
        if (pipOutput) {
            const pipUpdates = JSON.parse(pipOutput);
            pipUpdates.forEach((u: any) => {
                updates[u.name] = u.latest_version;
            });
        }
    } catch (e) {}

    // 3. NPM Outdated
    try {
        const npmOutput = await executeCommand(conn, "npm outdated -g --json 2>/dev/null");
        if (npmOutput) {
            const npmUpdates = JSON.parse(npmOutput);
            Object.keys(npmUpdates).forEach(name => {
                updates[name] = npmUpdates[name].latest;
            });
        }
    } catch (e) {}

    return updates;
}

export async function updateApp(conn: Client, name: string, type: string): Promise<boolean> {
    let cmd = '';
    if (type === 'system') {
        // Attempting a common way, but sudo might be a problem
        cmd = `sudo apt-get install --only-upgrade -y ${name} || sudo dnf upgrade -y ${name}`;
    } else if (type === 'python') {
        cmd = `pip install --upgrade ${name}`;
    } else if (type === 'node') {
        cmd = `npm install -g ${name}@latest`;
    }

    if (!cmd) return false;
    
    try {
        await executeCommand(conn, cmd);
        return true;
    } catch (e) {
        console.error(`Update failed for ${name}:`, e);
        return false;
    }
}

function executeCommand(conn: Client, cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let data = '';
            stream.on('data', (chunk: Buffer) => { data += chunk.toString(); });
            stream.on('close', () => resolve(data.trim()));
            stream.stderr.on('data', () => {}); // consume stderr
        });
    });
}

const APP_KEYWORDS = [
    'node', 'npm', 'python', 'docker', 'nginx', 'apache', 'mysql', 'postgre', 
    'redis', 'mongo', 'git', 'vim', 'nano', 'htop', 'curl', 'wget', 'php', 
    'go', 'rust', 'java', 'openjdk', 'gcc', 'g++', 'make', 'cmake', 'ansible',
    'terraform', 'kubectl', 'helm', 'yarn', 'pnpm', 'pm2', 'zsh', 'bash',
    'ffmpeg', 'imagemagick', 'sqlite', 'mongodb', 'mariadb', 'elasticsearch',
    'kibana', 'grafana', 'prometheus', 'traefik', 'jenkins', 'gitlab', 'code-server'
];

function categorizeSystemPackage(name: string, originalType: string): any {
    const n = name.toLowerCase();
    if (APP_KEYWORDS.some(kw => n.includes(kw))) {
        return 'other'; // Becomes 3rd Party in UI
    }
    return originalType;
}

function parseDpkg(output: string): AppInfo[] {
    return output.split('\n').filter(line => line.includes('|')).map(line => {
        const [name, version, type, description] = line.split('|');
        const shortDesc = description ? description.split('.')[0].trim() : '';
        return { 
            name, 
            version, 
            type: categorizeSystemPackage(name, type), 
            description: shortDesc 
        };
    });
}

function parseGeneric(output: string): AppInfo[] {
    return output.split('\n').filter(line => line.includes('|')).map(line => {
        const [name, version, type, description] = line.split('|');
        return { 
            name, 
            version, 
            type: categorizeSystemPackage(name, type), 
            description 
        };
    });
}
