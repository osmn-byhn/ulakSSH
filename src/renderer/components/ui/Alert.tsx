import React, { useEffect } from 'react';

export type AlertType = 'success' | 'error' | 'info';

interface AlertProps {
    message: string;
    type?: AlertType;
    onClose: () => void;
    duration?: number; // in milliseconds
}

const Alert: React.FC<AlertProps> = ({ message, type = 'info', onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const bgColors = {
        success: 'bg-green-500/10 border-green-500/50 text-green-400',
        error: 'bg-red-500/10 border-red-500/50 text-red-400',
        info: 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
    };

    return (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border font-medium ${bgColors[type]} animate-in fade-in slide-in-from-bottom-8 duration-300 z-50 flex items-center gap-3 min-w-[320px] max-w-md justify-between`}>
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${type === 'success' ? 'bg-green-500/20' : type === 'error' ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}>
                    {type === 'success' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                    {type === 'error' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>}
                    {type === 'info' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
                </div>
                <span className="text-sm font-semibold tracking-wide">{message}</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 opacity-70 hover:opacity-100 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    );
};

export default Alert;
