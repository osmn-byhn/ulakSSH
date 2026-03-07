import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Logo from "../../../../public/logo.png";

const Titlebar: React.FC = () => {
    // Add TypeScript support for the custom api
    const api = (window as any).api;
    const location = useLocation();

    const isSettings = location.pathname === '/settings';

    const handleMinimize = () => {
        console.log("Minimize clicked", api);
        api?.minimize();
    };
    const handleMaximize = () => {
        console.log("Maximize clicked", api);
        api?.maximize();
    };
    const handleClose = () => {
        console.log("Close clicked", api);
        api?.close();
    };

    return (
        <div
            className="flex justify-between items-center bg-gray-900 border-b border-gray-800 text-gray-300 select-none h-10 w-full fixed top-0 left-0 z-50 text-sm border-b border-gray-800 "
        >
            <div
                className="flex flex-1 px-4 items-center h-full space-x-2 app-region-drag"
            >
                <span className="font-semibold tracking-wide text-xs cursor-pointer flex items-center gap-2">
                    <img src={Logo} alt="Logo" className="w-8 h-8" />
                    <span className="text-lg">UlakSSH</span>
                </span>
            </div>
            <div className="flex h-full app-region-no-drag">
                <Link to={isSettings ? "/" : "/settings"} className="h-full px-4 hover:bg-gray-800 transition-colors flex items-center justify-center outline-none" aria-label={isSettings ? "Home" : "Settings"}>
                    {isSettings ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    )}
                </Link>
                <span

                    onClick={handleMinimize}
                    className="h-full px-4 hover:bg-gray-800 transition-colors flex items-center justify-center outline-none"
                    aria-label="Minimize"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M11 6H1V5h10v1z" /></svg>
                </span>
                <span
                    onClick={handleMaximize}
                    className="h-full px-4 hover:bg-gray-800 transition-colors flex items-center justify-center outline-none"
                    aria-label="Maximize"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M10 2v8H2V2h8zm-1 1H3v6h6V3z" /></svg>
                </span>
                <span
                    onClick={handleClose}
                    className="h-full px-4 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center outline-none"
                    aria-label="Close"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M7.06 6l3.47 3.47-1.06 1.06L6 7.06l-3.47 3.47-1.06-1.06L4.94 6 1.47 2.53l1.06-1.06L6 4.94l3.47-3.47 1.06 1.06L7.06 6z" /></svg>
                </span>
            </div>
        </div>
    );
};

export default Titlebar;
