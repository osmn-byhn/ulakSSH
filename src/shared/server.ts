export type OsType = 'ubuntu' | 'debian' | 'centos' | 'arch' | 'fedora' | 'linux' | 'windows' | 'macos' | 'alpine' | 'suse';

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
}