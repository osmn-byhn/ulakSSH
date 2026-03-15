import React, { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
}

interface TabSystemProps {
    tabs: Tab[];
    defaultTabId?: string;
    className?: string;
    fullHeight?: boolean;
}

const TabSystem: React.FC<TabSystemProps> = ({ tabs, defaultTabId, className = "", fullHeight = false }) => {
    const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

    const activeTab = tabs.find(t => t.id === activeTabId);

    return (
        <div className={`flex flex-col gap-4  ${fullHeight ? 'h-full' : ''} ${className}`}>
            {/* Tab Bar */}
            <div
                className="glass rounded-2xl p-1.5 flex gap-1 overflow-x-scroll"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
                {tabs.map(tab => {
                    const isActive = activeTabId === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200"
                            style={{
                                background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
                                color: isActive ? '#06b6d4' : 'var(--text-muted)',
                                border: isActive ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent',
                            }}
                        >
                            {tab.icon && <span className="w-4 h-4 flex items-center justify-center">{tab.icon}</span>}
                            <span className="uppercase tracking-wider">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className={`animate-fade-in ${fullHeight ? 'flex-1 overflow-hidden' : ''}`}>
                {activeTab?.content}
            </div>
        </div>
    );
};

export default TabSystem;
