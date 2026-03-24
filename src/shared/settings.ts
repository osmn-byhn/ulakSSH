export type Theme = 'dark' | 'light' | 'system';

export interface AppSettings {
    theme: Theme;
    isPasswordEnabled: boolean;
    appPassword?: string; // Encrypted base64
}
