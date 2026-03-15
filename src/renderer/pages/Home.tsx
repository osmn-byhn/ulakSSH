import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import OsIcon from "../components/ui/OsIcon";
import type { Server } from "../../shared/server";

const Home: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [servers, setServers] = useState<Server[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState(22);
    const [username, setUsername] = useState('root');
    const [authType, setAuthType] = useState<"password" | "key">("password");
    const [password, setPassword] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [privateKeyPath, setPrivateKeyPath] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const navigate = useNavigate();
    const api = (window as any).api;

    const loadServers = async () => {
        if (api?.getServers) {
            const data: Server[] = await api.getServers();
            setServers(data.reverse().slice(0, 12));
        }
    };

    useEffect(() => { loadServers(); }, []);

    const resetForm = () => {
        setName(''); setHost(''); setPort(22); setUsername('root');
        setAuthType('password'); setPassword(''); setPrivateKey('');
        setPrivateKeyPath(''); setPassphrase('');
    };

    const handleOpenModal = () => { resetForm(); setIsModalOpen(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newServer: Server = {
            id: '', name: name || host, host, port, username, authType,
            password: authType === 'password' ? password : undefined,
            privateKey: authType === 'key' ? privateKey : undefined,
            privateKeyPath: authType === 'key' ? privateKeyPath : undefined,
            passphrase: authType === 'key' && passphrase ? passphrase : undefined,
            os: 'linux',
        };
        if (api?.addServer) {
            const success = await api.addServer(newServer);
            if (success) { setIsModalOpen(false); loadServers(); }
            else alert("Failed to add Server.");
        }
    };

    const handleFilePick = async () => {
        if (!api?.pickFile) return;
        const filePath = await api.pickFile();
        if (filePath) {
            setPrivateKeyPath(filePath);
            const content = await api.readFile(filePath);
            if (content) setPrivateKey(content);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            setPrivateKeyPath((file as any).path || file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setPrivateKey(content);
            };
            reader.readAsText(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const inputCls = "w-full px-3 py-2 rounded-lg text-sm font-mono placeholder-gray-700 transition-all";
    const labelCls = "block text-[10px] font-semibold uppercase tracking-widest mb-1.5" as const;

    return (
        <div className="dot-grid-bg min-h-full relative">
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 animate-fade-in">

                {/* ── Header ──────────────────────────────────────────────────── */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            {/* Blinking cursor */}
                            <span
                                className="font-mono text-xs text-cyan-500 opacity-60"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                            >
                                ~/connections
                            </span>
                            <span
                                className="w-2 h-4 inline-block bg-cyan-400"
                                style={{ animation: 'blink-cursor 1s step-end infinite' }}
                            />
                        </div>
                        <h1
                            className="text-4xl font-bold tracking-tight gradient-text"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                            UlakSSH
                        </h1>
                        <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                            SSH connection manager — fast, secure, minimal
                        </p>
                    </div>

                    <button
                        onClick={handleOpenModal}
                        className="group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
                            boxShadow: '0 4px 24px rgba(6,182,212,0.25)',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Connection
                    </button>
                </div>

                {/* ── Section header ───────────────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                    <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        Saved Servers
                    </span>
                    <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                </div>

                {/* ── Server grid / empty state ────────────────────────────────── */}
                {servers.length === 0 ? (
                    <div className="glass rounded-2xl p-14 text-center flex flex-col items-center justify-center animate-fade-in">
                        {/* ASCII-art style icon */}
                        <pre
                            className="text-xs leading-tight mb-6 select-none"
                            style={{
                                color: 'rgba(6,182,212,0.3)',
                                fontFamily: 'JetBrains Mono, monospace',
                            }}
                        >{`  ┌─────────┐
  │ SSH     │
  │  ·  ·  │
  └────┬────┘
       │
  ─────┴─────`}</pre>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            No connections yet
                        </h3>
                        <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                            Add your first SSH server to get started. Click <strong className="text-cyan-400">New Connection</strong> above.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {servers.map((server, idx) => (
                            <div
                                key={server.id || idx}
                                className="glass rounded-2xl p-5 group cursor-pointer transition-all duration-200 hover:border-cyan-500/20 relative overflow-hidden animate-slide-up"
                                style={{
                                    animationDelay: `${idx * 40}ms`,
                                    borderColor: 'rgba(255,255,255,0.06)',
                                }}
                                onClick={() => navigate(`/server/${server.id}`)}
                            >
                                {/* Hover glow blob */}
                                <div
                                    className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)' }}
                                />

                                {/* Card header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="p-2 rounded-xl"
                                            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}
                                        >
                                            <OsIcon os={server.os} className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                                                {server.name}
                                            </h3>
                                            <span
                                                className="text-[10px] font-mono"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {server.os || 'linux'}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Ready badge */}
                                    <span
                                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                        style={{
                                            background: 'rgba(16,185,129,0.1)',
                                            color: '#10b981',
                                            border: '1px solid rgba(16,185,129,0.2)',
                                        }}
                                    >
                                        ready
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="space-y-1.5 mb-4">
                                    <div className="flex items-center gap-2">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                                            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                        <span className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                                            {server.host}:{server.port}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                                            {server.username}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div
                                    className="flex items-center justify-between pt-3"
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    <span
                                        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                        style={{ color: server.authType === 'key' ? '#f59e0b' : '#06b6d4' }}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        {server.authType}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/server/${server.id}`); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 opacity-0 group-hover:opacity-100"
                                        style={{
                                            background: 'rgba(6,182,212,0.12)',
                                            color: '#06b6d4',
                                            border: '1px solid rgba(6,182,212,0.2)',
                                        }}
                                    >
                                        Connect
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Add SSH Modal ────────────────────────────────────────────────── */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New SSH Connection">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Alias / Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                className={inputCls} placeholder="e.g. prod-web" />
                        </div>
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Username *</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                className={inputCls} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-3">
                            <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Host *</label>
                            <input type="text" value={host} onChange={e => setHost(e.target.value)}
                                className={inputCls} placeholder="192.168.1.1" required />
                        </div>
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Port</label>
                            <input type="number" value={port} onChange={e => setPort(parseInt(e.target.value) || 22)}
                                className={inputCls} min="1" max="65535" required />
                        </div>
                    </div>



                    {/* Auth toggle */}
                    <div>
                        <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Auth Method</label>
                        <div
                            className="flex p-1 rounded-xl gap-1"
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            {(['password', 'key'] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setAuthType(t)}
                                    className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                                    style={authType === t ? {
                                        background: 'rgba(6,182,212,0.15)',
                                        color: '#06b6d4',
                                        border: '1px solid rgba(6,182,212,0.25)',
                                    } : {
                                        background: 'transparent',
                                        color: 'var(--text-muted)',
                                        border: '1px solid transparent',
                                    }}
                                >
                                    {t === 'password' ? '🔑 Password' : '🗝 SSH Key'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {authType === 'password' ? (
                        <div className="animate-slide-up">
                            <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Password *</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className={inputCls} placeholder="••••••••" required />
                        </div>
                    ) : (
                        <div
                            className={`space-y-4 animate-slide-up p-3 rounded-xl transition-all ${isDragging ? 'bg-cyan-500/10 border-2 border-dashed border-cyan-500/50' : 'border-2 border-transparent'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Private Key File</label>
                                <div className="flex gap-2">
                                    <input type="text" value={privateKeyPath} onChange={e => setPrivateKeyPath(e.target.value)}
                                        className={inputCls} placeholder="~/.ssh/id_rsa or drop file here" />
                                    <button
                                        type="button"
                                        onClick={handleFilePick}
                                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-all shrink-0"
                                    >
                                        Browse
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>
                                    Private Key Content
                                    <span className="ml-2 normal-case text-[10px] opacity-50">(auto-filled from file)</span>
                                </label>
                                <textarea value={privateKey} onChange={e => setPrivateKey(e.target.value)}
                                    className={`${inputCls} h-24 resize-none`}
                                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----" />
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Passphrase <span className="opacity-50">(optional)</span></label>
                                <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                                    className={inputCls} placeholder="••••••••" />
                            </div>
                        </div>
                    )}

                    <div
                        className="flex justify-end gap-3 pt-4 mt-2"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
                                boxShadow: '0 4px 18px rgba(6,182,212,0.25)',
                            }}
                        >
                            Save & Connect →
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Home;