import React from 'react';
import { useLocation, Link } from 'react-router-dom';
const Logo = "/logo.png";

const Titlebar: React.FC = () => {
    const api = (window as any).api;
    const location = useLocation();
    const isSettings = location.pathname === '/settings';

    const handleMinimize = () => api?.minimize();
    const handleMaximize = () => api?.maximize();
    const handleClose = () => api?.close();

    const getBreadcrumb = () => {
        const path = location.pathname;
        if (path === '/') return null;
        if (path.startsWith('/server/')) return <span className="text-cyan-400/70">/ server</span>;
        if (path === '/settings') return <span className="text-cyan-400/70">/ settings</span>;
        return null;
    };

    return (
        <div
            className="flex justify-between items-center select-none h-10 w-full fixed top-0 left-0 z-50 transition-colors duration-300"
            style={{
                background: 'var(--bg-modal)',
                borderBottom: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
        >
            {/* Left – drag region + branding */}
            <div className="flex flex-1 items-center h-full px-4 gap-3 app-region-drag">
                <div className="flex items-center gap-2 shrink-0">
                    <img src={Logo} alt="Logo" className="w-5 h-5 opacity-90" />
                    <span
                        className="font-mono text-sm font-semibold tracking-widest"
                        style={{ color: 'var(--accent-cyan)', textShadow: '0 0 18px rgba(6,182,212,0.3)' }}
                    >
                        ULAKSSH
                    </span>
                </div>

                {/* Breadcrumb */}
                {getBreadcrumb() && (
                    <div className="flex items-center gap-1 font-mono text-xs app-region-no-drag">
                        <span className="text-muted opacity-50">~/</span>
                        {getBreadcrumb()}
                    </div>
                )}
            </div>

            {/* Right – settings + window controls */}
            <div className="flex h-full items-center app-region-no-drag">
                {/* Settings / Home toggle */}
                <Link
                    to={isSettings ? '/' : '/settings'}
                    className="h-full px-4 flex items-center justify-center transition-colors duration-150 text-gray-500 hover:text-cyan-400"
                    style={{ outline: 'none' }}
                    aria-label={isSettings ? 'Home' : 'Settings'}
                >
                    {isSettings ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    )}
                </Link>

                {/* Divider */}
                <div className="w-px h-4 bg-white/5 mx-1" />

                {/* Window controls */}
                <button
                    onClick={handleMinimize}
                    className="h-full px-3.5 flex items-center justify-center text-gray-600 hover:text-yellow-400 hover:bg-yellow-400/5 transition-all duration-150"
                    aria-label="Minimize"
                >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M11 6H1V5h10v1z" /></svg>
                </button>
                <button
                    onClick={handleMaximize}
                    className="h-full px-3.5 flex items-center justify-center text-gray-600 hover:text-cyan-400 hover:bg-cyan-400/5 transition-all duration-150"
                    aria-label="Maximize"
                >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M10 2v8H2V2h8zm-1 1H3v6h6V3z" /></svg>
                </button>
                <button
                    onClick={handleClose}
                    className="h-full px-3.5 flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
                    aria-label="Close"
                >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M7.06 6l3.47 3.47-1.06 1.06L6 7.06l-3.47 3.47-1.06-1.06L4.94 6 1.47 2.53l1.06-1.06L6 4.94l3.47-3.47 1.06 1.06L7.06 6z" /></svg>
                </button>
            </div>
        </div>
    );
};

export default Titlebar;
