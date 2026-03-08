import React, { useEffect, useState, useRef } from "react";
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useParams, useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import OsIcon from "../components/ui/OsIcon";
import type { AlertType } from "../components/ui/Alert";
import type { Server } from "../../shared/server";

const ServerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [server, setServer] = useState<Server | null>(null);
    const [connecting, setConnecting] = useState(true);
    const [connected, setConnected] = useState(false);

    // Alert state
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<AlertType>('info');
    const [showAlert, setShowAlert] = useState(false);

    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    const api = (window as any).api;

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!id || !api) return;

            // Get Server details
            const servers: Server[] = await api.getServers();
            const currentServer = servers.find((s: Server) => s.id === id);

            if (currentServer && isMounted) {
                setServer(currentServer);
                connectToServer(id);
            } else if (isMounted) {
                setConnecting(false);
                triggerAlert("Server not found", "error");
            }
        };
        init();

        return () => {
            isMounted = false;
        };
    }, [id]);

    const triggerAlert = (msg: string, type: AlertType) => {
        setAlertMessage(msg);
        setAlertType(type);
        setShowAlert(true);
    };

    const connectToServer = async (serverId: string) => {
        setConnecting(true);
        const res = await api.connectServer(serverId);
        setConnecting(false);
        if (res?.success) {
            setConnected(true);
            triggerAlert("Connected successfully", "success");
        } else {
            setConnected(false);
            triggerAlert(`Connection failed: ${res?.error || 'Unknown error'}`, "error");
        }
    };

    useEffect(() => {
        if (!connected || !id || !terminalRef.current) return;

        const term = new Terminal({
            theme: { background: 'transparent' },
            fontFamily: 'monospace',
            fontSize: 14,
            cursorBlink: true
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        term.onData(data => {
            api.sendTerminalData(id, data);
        });

        api.onTerminalOutput(id, (data: string) => {
            term.write(data);
        });

        api.onTerminalClose(id, () => {
            setConnected(false);
            triggerAlert("Server closed the connection", "info");
        });

        const handleResize = () => {
            fitAddon.fit();
            api.resizeTerminal(id, term.cols, term.rows);
        };

        window.addEventListener('resize', handleResize);
        api.resizeTerminal(id, term.cols, term.rows);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, [connected, id]);

    const handleDisconnect = async () => {
        if (!id) return;
        const res = await api.disconnectServer(id);
        if (res?.success) {
            setConnected(false);
            triggerAlert("Disconnected cleanly", "info");
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    if (!server) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4 text-indigo-400">
                    <svg className="animate-spin h-10 w-10" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="font-medium animate-pulse">Loading server profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-gray-900/40 p-6 rounded-2xl border border-gray-800/60 backdrop-blur-md shadow-xl">
                <div className="flex items-center gap-5">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl shadow-lg shadow-indigo-500/20">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <OsIcon os={server.os} className="w-8 h-8 text-indigo-400" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">{server.name}</span>
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${connected ? 'bg-green-500/10 text-green-400 border-green-500/20' : connecting ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {connected ? 'Active Session' : connecting ? 'Connecting' : 'Offline'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-gray-400 font-mono text-sm flex items-center gap-1.5 bg-gray-950 px-2 py-0.5 rounded-md border border-gray-800/80">
                                <span className="text-indigo-400">{server.username}</span>
                                <span className="text-gray-600">@</span>
                                <span className="text-gray-300">{server.host}</span>
                                <span className="text-gray-600">:</span>
                                <span className="text-purple-400">{server.port}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGoHome}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 border border-gray-700 hover:border-gray-500 shadow-lg"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        Dashboard
                    </button>

                    {connected ? (
                        <button
                            onClick={handleDisconnect}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 hover:shadow-red-500/10"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path><line x1="8" y1="8" x2="16" y2="16"></line></svg>
                            Disconnect
                        </button>
                    ) : (
                        <button
                            onClick={() => connectToServer(id as string)}
                            disabled={connecting}
                            className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 border ${connecting ? 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30 cursor-wait' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-transparent hover:shadow-indigo-500/25'}`}
                        >
                            {connecting ? (
                                <>
                                    <svg className="animate-spin -ml-1 h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Connect Now
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Terminal / Content Area */}
            <div className="flex-1 bg-black/60 border border-gray-800 rounded-2xl p-2 relative overflow-hidden backdrop-blur-sm flex flex-col shadow-2xl">
                {/* Terminal Header Bar */}
                <div className="bg-gray-900/80 px-4 py-2 rounded-t-xl border-b border-gray-800 flex items-center justify-between">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <span className="text-xs font-mono text-gray-500 select-none">Terminal - {server.host}</span>
                    <div className="w-12"></div>
                </div>

                {/* Terminal Body placeholder */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                    {connecting ? (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <div className="bg-gradient-to-tr from-gray-900 to-indigo-900/40 p-5 rounded-full border border-indigo-500/30 relative z-10 animate-bounce">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-gray-200">Establishing Secure Connection</h3>
                                <p className="text-sm text-gray-500 mt-2 font-mono">Negotiating SSH parameters with {server.host}...</p>
                            </div>
                        </div>
                    ) : connected ? (
                        <div className="w-full h-full text-left" ref={terminalRef}></div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500 opacity-60">
                            <div className="bg-gray-900 p-5 rounded-full border border-gray-800">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path><line x1="8" y1="8" x2="16" y2="16"></line></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-gray-400">Session Closed</h3>
                                <p className="text-sm text-gray-500 mt-2">Click "Connect Now" to re-establish the SSH tunnel.</p>
                            </div>
                        </div>
                    )}
                </div>
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