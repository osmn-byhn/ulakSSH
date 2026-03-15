import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import NeofetchInfo from "../components/ui/NeofetchInfo";
import TabSystem from "../components/ui/TabSystem";
import CodeEditor from "../components/ui/CodeEditor";
import type { AlertType } from "../components/ui/Alert";
import type { Server } from "../../shared/server";

const Folders: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Settings: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Commands: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Configs: React.FC<{ server: Server, triggerAlert: (message: string, type: AlertType) => void }> = ({ server, triggerAlert }) => {
    return (
        <div className="glass rounded-2xl p-6 flex flex-col gap-6" style={{ background: 'rgba(8, 11, 22, 0.9)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#06b6d4]">Connection</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">ID</span>
                            <span className="text-primary">{server.id}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">Host</span>
                            <span className="text-primary">{server.host}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">Port</span>
                            <span className="text-primary">{server.port}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#a855f7]">Security</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">User</span>
                            <span className="text-primary">{server.username}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">Auth</span>
                            <span className="text-primary uppercase">{server.authType}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">OS</span>
                            <span className="text-primary capitalize">{server.os || 'Linux'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-end gap-3">
                <button
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-muted hover:text-white hover:bg-white/5 transition-all"
                    onClick={() => triggerAlert("Edit mode coming soon", "info")}
                >
                    Edit Configuration
                </button>
            </div>
        </div>
    );
}

const Health: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Apps: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Graphics: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}



const ServerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [server, setServer] = useState<Server | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [systemInfo, setSystemInfo] = useState<any>(null);

    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<AlertType>('info');
    const [showAlert, setShowAlert] = useState(false);

    const api = (window as any).api;

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!id || !api) return;
            try {
                const servers: Server[] = await api.getServers();
                const currentServer = servers.find((s: Server) => s.id === id);
                if (currentServer && isMounted) {
                    setServer(currentServer);
                    if (!connected && !connecting) connectToServer(id);
                } else if (isMounted) {
                    triggerAlert("Server not found", "error");
                }
            } catch (err) {
                if (isMounted) triggerAlert("Failed to load server data", "error");
            }
        };
        init();
        return () => { isMounted = false; };
    }, [id]);

    const triggerAlert = (msg: string, type: AlertType) => {
        setAlertMessage(msg); setAlertType(type); setShowAlert(true);
    };

    const connectToServer = async (serverId: string) => {
        if (connecting) return;
        setConnecting(true);
        try {
            const res = await api.connectServer(serverId);
            setConnecting(false);
            if (res?.success) {
                setConnected(true);
                triggerAlert("Connected successfully", "success");
                const info = await api.getSystemInfo(serverId);
                if (info && !info.error) setSystemInfo(info);
            } else {
                setConnected(false);
                triggerAlert(`Connection failed: ${res?.error || 'Unknown error'}`, "error");
            }
        } catch (err: any) {
            setConnecting(false); setConnected(false);
            triggerAlert(`Error: ${err.message}`, "error");
        }
    };

    const handleDisconnect = async () => {
        if (!id) return;
        const res = await api.disconnectServer(id);
        if (res?.success) {
            setConnected(false); setSystemInfo(null);
            triggerAlert("Disconnected cleanly", "info");
        }
    };

    /* ── Loading screen ───────────────────────────────────────────────────── */
    if (!server) {
        return (
            <div
                className="flex h-full w-full items-center justify-center dot-grid-bg"
            >
                <div className="flex flex-col items-center gap-5">
                    {/* Spinning ring */}
                    <div className="relative w-12 h-12">
                        <div
                            className="absolute inset-0 rounded-full border-2 animate-spin"
                            style={{ borderColor: 'transparent', borderTopColor: '#06b6d4' }}
                        />
                        <div
                            className="absolute inset-1 rounded-full border-2"
                            style={{ borderColor: 'rgba(6,182,212,0.15)' }}
                        />
                    </div>
                    <p
                        className="text-sm font-mono"
                        style={{ color: 'rgba(6,182,212,0.6)', animation: 'flicker 2s ease-in-out infinite' }}
                    >
                        Establishing link...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-full relative"
            style={{ background: 'var(--bg-base)' }}
        >
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-6 flex flex-col gap-5 animate-fade-in">

                {/* ── Header card ───────────────────────────────────────────────── */}
                <div
                    className="glass rounded-2xl px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                    <div className="flex items-center gap-4">
                        {/* Back button */}
                        <button
                            onClick={() => navigate('/')}
                            className="p-2.5 rounded-xl transition-all duration-150 hover:bg-white/5"
                            style={{
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2
                                    className="text-lg font-bold font-mono"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {server.name}
                                </h2>
                                <span
                                    className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'var(--text-muted)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    {server.id.slice(0, 8)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="relative">
                                    <span
                                        className="w-2 h-2 rounded-full block"
                                        style={{
                                            background: connected ? '#10b981' : '#f43f5e',
                                            boxShadow: connected
                                                ? '0 0 8px rgba(16,185,129,0.6)'
                                                : '0 0 8px rgba(244,63,94,0.4)',
                                        }}
                                    />
                                    {connected && (
                                        <span
                                            className="absolute inset-0 w-2 h-2 rounded-full"
                                            style={{
                                                background: 'rgba(16,185,129,0.4)',
                                                animation: 'pulse-ring 2s ease-out infinite',
                                            }}
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                    {connecting ? 'connecting...' : connected ? 'online' : 'offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        {connected ? (
                            <button
                                onClick={handleDisconnect}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                style={{
                                    background: 'rgba(244,63,94,0.08)',
                                    color: '#f43f5e',
                                    border: '1px solid rgba(244,63,94,0.2)',
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    <line x1="8" y1="8" x2="16" y2="16" />
                                </svg>
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={() => connectToServer(id as string)}
                                disabled={connecting}
                                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                                style={{
                                    background: connecting
                                        ? 'rgba(6,182,212,0.2)'
                                        : 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
                                    boxShadow: connecting ? 'none' : '0 4px 20px rgba(6,182,212,0.25)',
                                    border: connecting ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
                                }}
                            >
                                {connecting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-cyan-300/40 border-t-cyan-400 rounded-full animate-spin" />
                                        Connecting...
                                    </>
                                ) : 'Establish Link'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Tabs System ─────────────────────────────────────────────────── */}
                <TabSystem
                    fullHeight={true}
                    className="min-h-[450px]"
                    tabs={[
                        {
                            id: 'overview',
                            label: 'Overview',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                </svg>
                            ),
                            content: <NeofetchInfo server={server} connected={connected} systemInfo={systemInfo} />
                        },
                        {
                            id: 'scripts',
                            label: 'Scripts',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                                </svg>
                            ),
                            content: (
                                <div className="h-[400px]">
                                    <CodeEditor
                                        initialValue="#!/bin/bash\n\n# Welcome to UlakSSH Script Editor\necho 'Initializing secure link...'\n uptime\n free -m\n"
                                    />
                                </div>
                            )
                        },
                        {
                            id: 'config',
                            label: 'Config',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.72V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.17a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
                                </svg>
                            ),
                            content: (
                                <Configs server={server} />
                            )
                        }
                    ]}
                />

                {/* ── Disconnected CTA ───────────────────────────────────────────── */}
                {!connected && !connecting && (
                    <div className="flex justify-center mt-4 animate-slide-up">
                        <button
                            onClick={() => connectToServer(id as string)}
                            className="group relative px-10 py-5 overflow-hidden rounded-2xl transition-all duration-300 active:scale-95"
                            style={{
                                background: 'rgba(6,182,212,0.05)',
                                border: '1px solid rgba(6,182,212,0.15)',
                            }}
                        >
                            {/* Hover fill */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(124,58,237,0.1) 100%)' }}
                            />
                            <div className="relative flex items-center gap-5">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background: 'rgba(6,182,212,0.1)',
                                        border: '1px solid rgba(6,182,212,0.2)',
                                        color: '#06b6d4',
                                    }}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                        Session
                                    </div>
                                    <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Initialize Connection
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {showAlert && (
                <Alert
                    message={alertMessage}
                    type={alertType}
                    onClose={() => setShowAlert(false)}
                    duration={5000}
                />
            )}
        </div>
    );
};

export default ServerDetail;