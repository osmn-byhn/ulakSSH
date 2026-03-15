import React, { useEffect, useRef } from 'react';

export type AlertType = 'success' | 'error' | 'info';

interface AlertProps {
    message: string;
    type?: AlertType;
    onClose: () => void;
    duration?: number;
}

const config = {
    success: {
        color: '#10b981',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.25)',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
    },
    error: {
        color: '#f43f5e',
        bg: 'rgba(244,63,94,0.08)',
        border: 'rgba(244,63,94,0.25)',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
        ),
    },
    info: {
        color: '#06b6d4',
        bg: 'rgba(6,182,212,0.08)',
        border: 'rgba(6,182,212,0.25)',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        ),
    },
};

const Alert: React.FC<AlertProps> = ({ message, type = 'info', onClose, duration = 5000 }) => {
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            // Animate progress bar
            if (progressRef.current) {
                progressRef.current.style.transition = `width ${duration}ms linear`;
                progressRef.current.style.width = '0%';
            }
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const { color, bg, border, icon } = config[type];

    return (
        <div
            className="fixed bottom-5 right-5 z-[200] animate-toast-in overflow-hidden rounded-xl shadow-2xl min-w-[280px] max-w-sm"
            style={{
                background: 'rgba(10,13,26,0.95)',
                border: `1px solid ${border}`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 0 30px ${bg}, 0 16px 40px rgba(0,0,0,0.4)`,
                borderLeft: `3px solid ${color}`,
            }}
        >
            <div className="flex items-center gap-3 px-4 py-3.5">
                <span style={{ color }}>{icon}</span>
                <span className="text-sm font-medium flex-1 leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {message}
                </span>
                <button
                    onClick={onClose}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                    ref={progressRef}
                    className="h-full"
                    style={{ width: '100%', background: color, borderRadius: '0 0 0 4px' }}
                />
            </div>
        </div>
    );
};

export default Alert;
