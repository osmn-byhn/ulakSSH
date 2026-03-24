import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppSettings, Theme } from '../../shared/settings';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';

interface SecurityContextType {
    settings: AppSettings | null;
    isAuthenticated: boolean;
    updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
    setAppPassword: (password: string | null) => Promise<void>;
    logout: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) throw new Error('useSecurity must be used within SecurityProvider');
    return context;
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const api = (window as any).api;

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const s = await api.getSettings();
            setSettings(s);
            applyTheme(s.theme);
            if (!s.isPasswordEnabled) {
                setIsAuthenticated(true);
            }
        } catch (err) {
            console.error('Failed to load settings', err);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (theme: Theme) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            root.classList.add(mediaQuery.matches ? 'dark' : 'light');

            // Listen for changes
            const handleChange = (e: MediaQueryListEvent) => {
                if (settings?.theme === 'system') {
                    root.classList.remove('light', 'dark');
                    root.classList.add(e.matches ? 'dark' : 'light');
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            root.classList.add(theme);
        }
    };

    useEffect(() => {
        if (settings?.theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(e.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [settings?.theme]);

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError('');
        const success = await api.checkAppPassword(passwordInput);
        if (success) {
            setIsAuthenticated(true);
            setPasswordInput('');
        } else {
            setError('Invalid password');
        }
    };

    const updateSettings = async (updates: Partial<AppSettings>) => {
        const success = await api.updateSettings(updates);
        if (success) {
            const newSettings = { ...settings!, ...updates };
            setSettings(newSettings);
            if (updates.theme) applyTheme(updates.theme);
        }
    };

    const setAppPassword = async (password: string | null) => {
        const success = await api.setAppPassword(password);
        if (success) {
            await loadSettings();
        }
    };

    const logout = () => {
        if (settings?.isPasswordEnabled) {
            setIsAuthenticated(false);
        }
    };

    if (loading) return null;

    if (!isAuthenticated && settings?.isPasswordEnabled) {
        return (
            <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center dot-grid-bg text-primary overflow-hidden">
                <div className="w-full max-w-[400px] px-6 animate-slide-up">
                    <div className="glass-bright p-8 rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col items-center gap-8 relative overflow-hidden">
                        {/* Background glow effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />

                        <div className="w-20 h-20 rounded-2xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 flex items-center justify-center text-[#06b6d4] glow-cyan">
                            <Lock className="w-10 h-10" />
                        </div>

                        <div className="text-center relative z-10">
                            <h2 className="text-2xl font-black gradient-text uppercase tracking-tighter">Security Gate</h2>
                            <p className="text-xs text-muted font-mono mt-1 uppercase tracking-widest">Authentication Required</p>
                        </div>

                        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 relative z-10">
                            <div className="relative group">
                                <input
                                    autoFocus
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Enter Application Password"
                                    className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm transition-all text-center bg-black/40 border-white/10 hover:border-cyan-500/30 focus:border-cyan-500/50"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#06b6d4] text-white shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            {error && (
                                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center animate-shake">
                                    {error}
                                </p>
                            )}
                        </form>

                        <div className="flex items-center gap-2 text-[10px] text-muted font-mono uppercase tracking-widest opacity-50 relative z-10">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Protected by End-to-End Encryption</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SecurityContext.Provider value={{ settings, isAuthenticated, updateSettings, setAppPassword, logout }}>
            {children}
        </SecurityContext.Provider>
    );
};
