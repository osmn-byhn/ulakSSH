import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { AppSettings } from '../../shared/settings.js';

const SETTINGS_FILE = 'settings.json';

const getSettingsFilePath = () => {
    return path.join(app.getPath('userData'), SETTINGS_FILE);
};

const getDefaultSettings = (): AppSettings => ({
    theme: 'system',
    isPasswordEnabled: false
});

export const getSettings = (): AppSettings => {
    const filePath = getSettingsFilePath();
    if (!fs.existsSync(filePath)) {
        const defaults = getDefaultSettings();
        fs.writeFileSync(filePath, JSON.stringify(defaults, null, 4), 'utf-8');
        return defaults;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        console.error('Failed to parse settings:', e);
        return getDefaultSettings();
    }
};

export const saveSettings = (settings: Partial<AppSettings>): boolean => {
    try {
        const current = getSettings();
        const updated = { ...current, ...settings };
        const filePath = getSettingsFilePath();
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 4), 'utf-8');
        return true;
    } catch (e) {
        console.error('Failed to save settings:', e);
        return false;
    }
};

export const setAppPassword = (password: string | null): boolean => {
    try {
        if (!password) {
            return saveSettings({ isPasswordEnabled: false, appPassword: undefined });
        }

        const isEncryptionAvailable = safeStorage.isEncryptionAvailable();
        if (!isEncryptionAvailable) {
            console.error('Encryption not available for app password');
            return false;
        }

        const encrypted = safeStorage.encryptString(password);
        return saveSettings({
            isPasswordEnabled: true,
            appPassword: encrypted.toString('base64')
        });
    } catch (e) {
        console.error('Failed to set app password:', e);
        return false;
    }
};

export const checkAppPassword = (password: string): boolean => {
    try {
        const settings = getSettings();
        if (!settings.isPasswordEnabled || !settings.appPassword) return true;

        const isEncryptionAvailable = safeStorage.isEncryptionAvailable();
        if (!isEncryptionAvailable) return false;

        const decrypted = safeStorage.decryptString(Buffer.from(settings.appPassword, 'base64'));
        return decrypted === password;
    } catch (e) {
        console.error('Failed to check app password:', e);
        return false;
    }
};
