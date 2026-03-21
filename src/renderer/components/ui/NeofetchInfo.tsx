import React from 'react';
import { useNavigate } from 'react-router-dom';
import OsIcon from './OsIcon';
import type { Server } from '../../../shared/server';

interface NeofetchInfoProps {
    server: Server;
    connected: boolean;
    systemInfo?: {
        os?: string;
        kernel?: string;
        uptime?: string;
        packages?: string;
        shell?: string;
        cpu?: string;
        memory?: string;
    };
    stats?: {
        disk?: {
            device: string;
            type: string;
            mount: string;
            total: string;
            used: string;
            free: string;
            percent: number;
            topConsumers: Array<{
                size: string;
                path: string;
                percent: number;
            }>;
        };
        logins?: Array<{
            user: string;
            ip: string;
            status: 'success' | 'failed';
            date: string;
        }>;
    } | null;
    ULAK_GIT_REPOS?: Array<{
        name: string;
        branch: string;
        path: string;
    }>;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (e) {
        return '—';
    }
};

const details = (server: Server, systemInfo: NeofetchInfoProps['systemInfo']) => [
    { label: 'OS', value: systemInfo?.os || server.os || 'Linux', color: '#06b6d4' },
    { label: 'Host', value: server.host, color: '#7c3aed' },
    { label: 'Kernel', value: systemInfo?.kernel || '—', color: '#3b82f6' },
    { label: 'Uptime', value: systemInfo?.uptime || '—', color: '#10b981' },
    { label: 'Shell', value: systemInfo?.shell || 'bash', color: '#f59e0b' },
    { label: 'Last Session', value: formatDate(server.lastConnected), color: '#f43f5e' },
    { label: 'Memory', value: systemInfo?.memory || '—', color: '#a855f7' },
];

const NeofetchInfo: React.FC<NeofetchInfoProps> = ({ server, connected, systemInfo, stats, ULAK_GIT_REPOS }) => {
    const navigate = useNavigate();
    const rows = details(server, systemInfo);

    return (
        <div className="flex flex-col gap-6">
            <div
                className="scanlines relative rounded-2xl overflow-hidden animate-fade-in"
                style={{
                    background: 'rgba(8, 11, 22, 0.9)',
                    border: '1px solid rgba(6,182,212,0.15)',
                    boxShadow: '0 0 60px rgba(6,182,212,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
            >
                {/* Ambient glow blobs */}
                <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }} />

                <div className="relative z-10 p-7 flex flex-col md:flex-row gap-8 items-center md:items-start">

                    {/* ── Left: OS Icon ─────────────────────────────────────────────── */}
                    <div className="hidden lg:flex flex-col items-center gap-4 shrink-0">
                        <div
                            className="p-5 rounded-2xl animate-flicker"
                            style={{
                                background: 'rgba(6,182,212,0.06)',
                                border: '1px solid rgba(6,182,212,0.12)',
                            }}
                        >
                            <OsIcon
                                os={server.os}
                                className="w-28 h-28"
                            />
                        </div>
                        {/* OS name in ASCII style */}
                        <span
                            className="text-xs font-mono font-bold uppercase tracking-[0.2em]"
                            style={{ color: 'rgba(6,182,212,0.5)' }}
                        >
                            {server.os || 'linux'}
                        </span>
                    </div>

                    {/* ── Right: Info ────────────────────────────────────────────────── */}
                    <div className="flex-1 w-full font-mono">
                        {/* username@hostname */}
                        <div className="mb-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold leading-none">
                                    <span style={{ color: '#06b6d4', textShadow: '0 0 20px rgba(6,182,212,0.4)' }}>
                                        {server.username}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>@</span>
                                    <span style={{ color: '#a78bfa', textShadow: '0 0 20px rgba(167,139,250,0.4)' }}>
                                        {server.name}
                                    </span>
                                </h2>
                                <div
                                    className="h-px w-36 mt-2 rounded-full"
                                    style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.4), rgba(124,58,237,0.4), transparent)' }}
                                />
                            </div>

                            {connected && (
                                <button
                                    onClick={() => navigate(`/terminal/${server.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 shrink-0"
                                    style={{
                                        background: 'rgba(16,185,129,0.12)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16,185,129,0.25)',
                                        boxShadow: '0 0 20px rgba(16,185,129,0.15)',
                                    }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
                                    </svg>
                                    Open Terminal
                                </button>
                            )}
                        </div>

                        {/* ── Key-value grid ────────────────────────────────────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                            {rows.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span
                                        className="w-16 text-[11px] font-bold uppercase tracking-[0.15em] shrink-0"
                                        style={{ color: item.color }}
                                    >
                                        {item.label}
                                    </span>
                                    <span
                                        className="text-sm"
                                        style={{
                                            color: item.value === '—' ? 'rgba(255,255,255,0.2)' : 'rgba(226,232,255,0.8)'
                                        }}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* ── Status bar ──────────────────────────────────────────────── */}
                        <div
                            className="flex items-center justify-between mt-6 pt-4"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                        >
                            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
                                port:{server.port} · auth:{server.authType}
                            </span>
                            <div className="flex items-center gap-2">
                                {connected && (
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                            background: '#10b981',
                                            boxShadow: '0 0 6px rgba(16,185,129,0.8)',
                                            animation: 'pulse-ring 2s ease-out infinite',
                                        }}
                                    />
                                )}
                                <span
                                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                                    style={connected ? {
                                        background: 'rgba(16,185,129,0.1)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16,185,129,0.2)',
                                    } : {
                                        background: 'rgba(244,63,94,0.1)',
                                        color: '#f43f5e',
                                        border: '1px solid rgba(244,63,94,0.2)',
                                    }}
                                >
                                    {connected ? 'tunnel active' : 'offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Logins Section ────────────────────────────────────────── */}
            {connected && stats && (
                <div className="animate-fade-in">
                    {/* Login History */}
                    <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-white/90">Recent Logins</h3>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
                            {stats.logins && stats.logins.length > 0 ? (
                                stats.logins.map((login, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold font-mono text-white/80">{login.user}</span>
                                                <span className="text-[9px] font-mono text-muted">from {login.ip}</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-muted/50">{login.date}</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold font-mono uppercase tracking-widest ${
                                            login.status === 'success' 
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                        }`}>
                                            <div className={`w-1 h-1 rounded-full ${login.status === 'success' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]'}`} />
                                            {login.status}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center opacity-20 italic text-[10px] font-mono tracking-widest uppercase">No Login Logs Found</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Git Repositories Section ────────────────────────────────── */}
            {connected && ULAK_GIT_REPOS && ULAK_GIT_REPOS.length > 0 && (
                <div className="animate-fade-in">
                    <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                    <path d="M9 18c-4.51 2-5-2-7-2" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-white/90">Git Repositories</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                            {ULAK_GIT_REPOS.map((repo, idx) => (
                                <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all group">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold font-mono text-white/80 truncate pr-2" title={repo.path}>
                                            {repo.name}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-bold font-mono uppercase tracking-widest shrink-0">
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
                                            </svg>
                                            {repo.branch}
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-mono text-muted/40 truncate italic" title={repo.path}>
                                        {repo.path}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NeofetchInfo;
