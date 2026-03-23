export type OsType = 'ubuntu' | 'debian' | 'centos' | 'arch' | 'fedora' | 'linux' | 'windows' | 'macos' | 'alpine' | 'suse';

export type Script = {
    id: string;
    name: string;
    command?: string; // Execution command (e.g. bash, python3)
    content: string; // The full script body
    language: string; // bash, python, javascript, etc.
    color: string;
    remotePath?: string; // Optional path to save on server
}


export type Server = {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    authType: "password" | "key";
    password?: string;
    privateKey?: string;
    privateKeyPath?: string;
    passphrase?: string;
    color?: string;
    os?: string;
    lastConnected?: string;
    scripts?: Script[];
}