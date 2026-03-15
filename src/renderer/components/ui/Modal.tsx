import React from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={onClose}
        >
            <div
                className="glass-bright w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up"
                style={{ boxShadow: '0 0 60px rgba(6,182,212,0.1), 0 24px 48px rgba(0,0,0,0.5)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex justify-between items-center px-6 py-4"
                    style={{
                        borderBottom: '1px solid rgba(6,182,212,0.12)',
                        background: 'rgba(6,182,212,0.04)',
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #06b6d4, #7c3aed)' }} />
                        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[72vh]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;