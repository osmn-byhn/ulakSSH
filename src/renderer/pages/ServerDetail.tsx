import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import NeofetchInfo from "../components/ui/NeofetchInfo";
import type { AlertType } from "../components/ui/Alert";
import type { Server } from "../../shared/server";

const ServerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [server, setServer] = useState<Server | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [systemInfo, setSystemInfo] = useState<any>(null);

    // Alert state
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<AlertType>('info');
    const [showAlert, setShowAlert] = useState(false);

    const api = (window as any).api;

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!id || !api) return;

            try {
                // Get Server details
                const servers: Server[] = await api.getServers();
                const currentServer = servers.find((s: Server) => s.id === id);

                if (currentServer && isMounted) {
                    setServer(currentServer);
                    // Start connection attempt if not already connected
                    if (!connected && !connecting) {
                        connectToServer(id);
                    }
                } else if (isMounted) {
                    triggerAlert("Server not found", "error");
                }
            } catch (err) {
                if (isMounted) {
                    triggerAlert("Failed to load server data", "error");
                }
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
        if (connecting) return;
        setConnecting(true);
        try {
            const res = await api.connectServer(serverId);
            setConnecting(false);
            if (res?.success) {
                setConnected(true);
                triggerAlert("Connected successfully", "success");

                // Fetch real system info
                const info = await api.getSystemInfo(serverId);
                if (info && !info.error) {
                    setSystemInfo(info);
                }
            } else {
                setConnected(false);
                triggerAlert(`Connection failed: ${res?.error || 'Unknown error'}`, "error");
            }
        } catch (err: any) {
            setConnecting(false);
            setConnected(false);
            triggerAlert(`Error: ${err.message}`, "error");
        }
    };

    const handleDisconnect = async () => {
        if (!id) return;
        const res = await api.disconnectServer(id);
        if (res?.success) {
            setConnected(false);
            setSystemInfo(null);
            triggerAlert("Disconnected cleanly", "info");
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    if (!server) {
        return (
            <div className="flex h-screen w-screen items-center justify-center p-8 bg-gray-950">
                <div className="flex flex-col items-center gap-4 text-indigo-400">
                    <svg className="animate-spin h-10 w-10" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="font-medium animate-pulse">Establishing link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className=" bg-gray-950 text-gray-200 selection:bg-indigo-500/30 font-sans">
            <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6 ">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/40 p-5 rounded-3xl border border-gray-800/60 backdrop-blur-md shadow-xl">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={handleGoHome}
                            className="bg-gray-800 p-3 rounded-xl hover:bg-gray-700 hover:text-indigo-400 transition-all border border-gray-700"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">{server.name}</span>
                                <span className="text-gray-600 font-mono text-xs opacity-60">ID: {server.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.5)]`}></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{connected ? 'Online' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {connected ? (
                            <button
                                onClick={handleDisconnect}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-5 py-2 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path><line x1="8" y1="8" x2="16" y2="16"></line></svg>
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={() => connectToServer(id as string)}
                                disabled={connecting}
                                className={`px-6 py-2 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 border ${connecting ? 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30 cursor-wait' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-transparent'}`}
                            >
                                {connecting ? <span className="animate-pulse">Connecting...</span> : "Establish Link"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Dashboard Area */}
                <div className="flex-1 flex flex-col justify-center  mx-auto w-full ">
                    <NeofetchInfo server={server} connected={connected} systemInfo={systemInfo} />

                    {!connected && !connecting && (
                        <div className="mt-12 flex justify-center">
                            <button
                                onClick={() => connectToServer(id as string)}
                                className="group relative px-10 py-4 bg-gray-900/50 border border-gray-800 rounded-3xl hover:border-indigo-500/50 transition-all overflow-hidden shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <div className="relative flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Session</div>
                                        <div className="text-lg font-bold text-gray-100">Initialize Connection</div>
                                    </div>
                                </div>
                            </button>
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