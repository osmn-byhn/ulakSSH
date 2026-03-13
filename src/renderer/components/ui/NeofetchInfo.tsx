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
}

const NeofetchInfo: React.FC<NeofetchInfoProps> = ({ server, connected, systemInfo }) => {
    const navigate = useNavigate();
    const details = [
        { label: 'OS', value: systemInfo?.os || server.os || 'Linux', color: 'text-indigo-400' },
        { label: 'Host', value: server.host, color: 'text-purple-400' },
        { label: 'Kernel', value: systemInfo?.kernel || 'Unknown', color: 'text-blue-400' },
        { label: 'Uptime', value: systemInfo?.uptime || 'Unknown', color: 'text-green-400' },
        { label: 'Shell', value: systemInfo?.shell || 'bash', color: 'text-yellow-400' },
        { label: 'CPU', value: systemInfo?.cpu || 'Unknown', color: 'text-red-400' },
        { label: 'Memory', value: systemInfo?.memory || 'Unknown', color: 'text-pink-400' },
    ];

    return (
        <div className="flex  w-full md:flex-row items-center md:items-start gap-8 bg-gray-900/60 p-8 rounded-3xl border border-gray-800/50 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full group-hover:bg-purple-600/20 transition-all duration-700"></div>

            {/* OS Icon Section */}
            <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-2xl transform scale-110"></div>
                <div className="relative hidden lg:block bg-gray-950/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner group-hover:border-indigo-500/30 transition-all duration-500">
                    <OsIcon os={server.os} className="w-32 h-32 md:w-40 md:h-40 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform duration-500" />
                </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 font-mono space-y-3 relative z-10 w-full">
                <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-indigo-400">{server.username}</span>
                            <span className="text-gray-500">@</span>
                            <span className="text-purple-400">{server.name}</span>
                        </h2>
                        <div className="h-0.5 w-32 bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-transparent mt-1.5 opacity-40"></div>
                    </div>

                    {connected && (
                        <button
                            onClick={() => navigate(`/terminal/${server.id}`)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                            Open Terminal
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
                    {details.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 group/item">
                            <span className={`w-20 font-bold uppercase text-[11px] tracking-widest ${item.color} opacity-70 group-hover/item:opacity-100 transition-opacity`}>
                                {item.label}
                            </span>
                            <span className="text-gray-300 text-sm truncate">{item.value}</span>
                        </div>
                    ))}
                </div>

                {/* Status Indicator */}
                <div className="mt-6 flex items-center gap-4 pt-4 border-t border-gray-800/50">

                    <div className={`ml-auto px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${connected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {connected ? 'Active Tunnel' : 'Tunnel Closed'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NeofetchInfo;
