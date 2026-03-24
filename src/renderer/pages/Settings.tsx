import React, { useState } from "react";
import { useSecurity } from "../components/SecurityProvider";
import {
    Sun,
    Moon,
    Monitor,
    Shield,
    Lock,
    Info,
    Github,
    WholeWord,
    CheckCircle2,
    Database,
    Cpu,
    Globe
} from 'lucide-react';
import TabSystem from "../components/ui/TabSystem";
import logo from "../../assets/logo.png";
import type { Theme } from "../../shared/settings";
import { GithubFetcher } from '@osmn-byhn/changelog-github-core';
import { useEffect } from "react";

const GeneralTab: React.FC<{ settings: any, handleThemeChange: (theme: Theme) => void }> = ({ settings, handleThemeChange }) => (
    <div className="flex flex-col gap-6 animate-slide-up">
        {/* Appearance Section */}
        <div className="glass rounded-3xl p-6 border border-theme-border flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20">
                    <Sun className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-theme-text-primary">Appearance</h3>
                    <p className="text-[10px] text-theme-text-muted font-mono uppercase tracking-widest">Visual Theme & Interface</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id as Theme)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border relative group/theme ${settings?.theme === t.id
                            ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4] glow-cyan'
                            : 'bg-theme-bg-muted border-theme-border text-theme-text-muted hover:border-[#06b6d4]/30 hover:text-theme-text-primary'
                            }`}
                    >
                        {settings?.theme === t.id && (
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-3 h-3 text-[#06b6d4]" />
                            </div>
                        )}
                        <t.icon className="w-6 h-6" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">{t.label}</span>
                    </button>
                ))}
            </div>
        </div>
    </div>
);

const SecurityTab: React.FC<{
    settings: any,
    handlePasswordEnable: () => void,
    passwordInput: string,
    setPasswordInput: (val: string) => void
}> = ({ settings, handlePasswordEnable, passwordInput, setPasswordInput }) => (
    <div className="flex flex-col gap-6 animate-slide-up">
        {/* App Lock Section */}
        <div className="glass rounded-3xl p-6 border border-theme-border flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <Lock className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-theme-text-primary">Application Lock</h3>
                    <p className="text-[10px] text-theme-text-muted font-mono uppercase tracking-widest">Startup Password Protection</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between bg-theme-bg-muted p-4 rounded-2xl border border-theme-border">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-theme-text-primary uppercase tracking-wide">Enable Protection</span>
                        <span className="text-[10px] text-theme-text-muted">Require a password every time you launch UlakSSH</span>
                    </div>
                    <button
                        onClick={handlePasswordEnable}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings?.isPasswordEnabled
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20'
                            }`}
                    >
                        {settings?.isPasswordEnabled ? 'Disable' : 'Enable'}
                    </button>
                </div>

                {!settings?.isPasswordEnabled && (
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-theme-text-muted font-mono uppercase tracking-widest ml-1">New Password</label>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter secure password"
                            className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm text-theme-text-primary outline-none focus:border-[#06b6d4]/50 transition-all"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Hardware Encryption Section */}
        <div className="glass rounded-3xl p-6 border border-theme-border flex items-center gap-4 bg-[#06b6d4]/5">
            <div className="p-3 rounded-2xl bg-[#06b6d4]/20 text-[#06b6d4]">
                <Database className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-xs font-bold text-theme-text-primary">Native Encryption Active</h4>
                <p className="text-[10px] text-[#06b6d4] font-mono uppercase tracking-tighter mt-0.5">Your data is secured using Electron SafeStorage</p>
            </div>
        </div>
    </div>
);

const AboutTab: React.FC<{ version: string, isCheckingUpdate: boolean, onCheckUpdate: () => void }> = ({ version, isCheckingUpdate, onCheckUpdate }) => (
    <div className="flex flex-col gap-6 animate-slide-up">
        <div className="glass rounded-3xl p-8 border border-theme-border flex flex-col items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500 opacity-50" />

            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-2xl relative group">
                <img src={logo} className="w-16 h-16 opacity-90 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 rounded-3xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="text-center">
                <h2 className="text-3xl font-black gradient-text uppercase tracking-tighter italic">UlakSSH</h2>
                <p className="text-[10px] text-theme-text-muted font-mono uppercase tracking-[0.3em] mt-1 pr-[-0.3em]">Quantum-Ready Terminal Bridge</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center px-4 border-r border-theme-border">
                    <span className="text-xl font-mono font-bold text-theme-text-primary">{version}</span>
                    <span className="text-[9px] text-theme-text-muted uppercase font-bold tracking-widest">Version</span>
                </div>
                <div className="flex flex-col items-center px-4">
                    <button
                        onClick={onCheckUpdate}
                        disabled={isCheckingUpdate}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCheckingUpdate
                            ? 'bg-theme-bg-muted text-theme-text-muted border border-theme-border cursor-not-allowed'
                            : 'bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20 hover:bg-[#06b6d4]/20'
                            }`}
                    >
                        {isCheckingUpdate ? 'Checking...' : 'Update Build'}
                    </button>
                    <span className="text-[9px] text-theme-text-muted uppercase font-bold tracking-widest mt-1">Lifecycle</span>
                </div>
            </div>

            <div className="flex gap-4 w-full mt-4">
                <button 
                    onClick={() => (window as any).api.openExternal('https://github.com/osmn-byhn/ulakSSH')}
                    className="flex-1 glass p-3 rounded-2xl border-theme-border flex items-center justify-center gap-2 text-xs font-bold hover:bg-theme-bg-subtle transition-all text-theme-text-primary"
                >
                    <Github className="w-4 h-4" /> GitHub
                </button>
                <button 
                    onClick={() => (window as any).api.openExternal('https://ulakssh.osmanbeyhan.com')}
                    className="flex-1 glass p-3 rounded-2xl border-theme-border flex items-center justify-center gap-2 text-xs font-bold hover:bg-theme-bg-subtle transition-all text-rose-400"
                >
                    <Globe className="w-4 h-4" /> Website
                </button>
            </div>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-4 border border-emerald-500/10 flex items-center gap-3">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-theme-text-muted uppercase font-black">Runtime</span>
                    <span className="text-xs font-mono font-bold text-emerald-500">Electron v32.0.1</span>
                </div>
            </div>
            <div className="glass rounded-2xl p-4 border border-cyan-500/10 flex items-center gap-3">
                <Monitor className="w-5 h-5 text-cyan-500" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-theme-text-muted uppercase font-black">Memory</span>
                    <span className="text-xs font-mono font-bold text-cyan-500">128MB Used</span>
                </div>
            </div>
        </div>
    </div>
);

const Settings: React.FC = () => {
    const { settings, updateSettings, setAppPassword } = useSecurity();
    const [passwordInput, setPasswordInput] = useState('');
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const [version, setVersion] = useState('v0.0.0');
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

    const api = (window as any).api;

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const fetcher = new GithubFetcher('osmn-byhn', 'ulakSSH');
                const releases = await fetcher.fetchReleases(1, 1);
                if (releases.length > 0) {
                    setVersion(releases[0].tag_name);
                }
            } catch (err) {
                console.error('Failed to fetch version', err);
            }
        };
        fetchVersion();
    }, []);

    const handleCheckUpdate = async () => {
        setIsCheckingUpdate(true);
        try {
            const result = await api.checkForUpdates();
            if (result.updated) {
                setSaveStatus(`Update to ${result.to} triggered`);
            } else {
                setSaveStatus('Already up to date');
            }
        } catch (err) {
            console.error('Update failed', err);
            setSaveStatus('Update check failed');
        } finally {
            setIsCheckingUpdate(false);
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const handleThemeChange = async (theme: Theme) => {
        await updateSettings({ theme });
        setSaveStatus('Theme updated');
        setTimeout(() => setSaveStatus(null), 2000);
    };

    const handlePasswordEnable = async () => {
        if (settings?.isPasswordEnabled) {
            await setAppPassword(null);
            setSaveStatus('Password disabled');
        } else {
            if (!passwordInput) return;
            await setAppPassword(passwordInput);
            setPasswordInput('');
            setSaveStatus('Password enabled');
        }
        setTimeout(() => setSaveStatus(null), 2000);
    };

    return (
        <div className="h-full dot-grid-bg px-8 pt-6 pb-20 overflow-y-auto scrollbar-none">
            <div className="max-w-3xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06b6d4]/20 to-transparent border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4] glow-cyan">
                            <Info className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black gradient-text uppercase tracking-tighter italic text-theme-text-primary">Settings</h1>
                            <p className="text-[10px] text-theme-text-muted font-mono uppercase tracking-[0.3em]">System & Preferences</p>
                        </div>
                    </div>

                    {saveStatus && (
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-toast-in">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{saveStatus}</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex-1">
                    <TabSystem
                        tabs={[
                            {
                                id: 'general',
                                label: 'General',
                                icon: <Monitor className="w-3.5 h-3.5" />,
                                content: <GeneralTab settings={settings} handleThemeChange={handleThemeChange} />
                            },
                            {
                                id: 'security',
                                label: 'Security',
                                icon: <Shield className="w-3.5 h-3.5" />,
                                content: <SecurityTab
                                    settings={settings}
                                    handlePasswordEnable={handlePasswordEnable}
                                    passwordInput={passwordInput}
                                    setPasswordInput={setPasswordInput}
                                />
                            },
                            {
                                id: 'about',
                                label: 'About',
                                icon: <Info className="w-3.5 h-3.5" />,
                                content: <AboutTab
                                    version={version}
                                    isCheckingUpdate={isCheckingUpdate}
                                    onCheckUpdate={handleCheckUpdate}
                                />
                            }
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default Settings;