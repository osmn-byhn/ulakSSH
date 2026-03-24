import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import '@xterm/xterm/css/xterm.css';
import { useSecurity } from '../components/SecurityProvider';

const api = (window as any).api;

// ── Unique tab ID generator ──────────────────────────────────────────────────
let tabCounter = 0;
const newTabId = () => `tab-${Date.now()}-${++tabCounter}`;

// ── Per-tab xterm.js instance ────────────────────────────────────────────────
interface TabInstance {
    id: string;
    label: string;
    term: Terminal;
    fitAddon: FitAddon;
    containerEl: HTMLDivElement;
    status: 'connecting' | 'connected' | 'closed';
    cleanupFns: Array<() => void>;
}

// ── Main component ────────────────────────────────────────────────────────────
const TerminalWindow: React.FC = () => {
    const { id: serverId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { settings } = useSecurity();
    const isLight = settings?.theme === 'light';

    const [tabs, setTabs] = useState<TabInstance[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const terminalContainerRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<TabInstance[]>([]);
    tabsRef.current = tabs;

    // ── Open a new tab ────────────────────────────────────────────────────────
    const openTab = useCallback((index?: number) => {
        if (!serverId || !terminalContainerRef.current) return;

        const tabId = newTabId();
        const label = `Terminal ${index ?? tabsRef.current.length + 1}`;

        // Create a dedicated container div for this tab
        const containerEl = document.createElement('div');
        containerEl.style.cssText = 'width:100%;height:100%;visibility:hidden;position:absolute;top:0;left:0;';
        terminalContainerRef.current.appendChild(containerEl);

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
            allowProposedApi: true,
            theme: isLight ? {
                background: '#ffffff',
                foreground: '#1e293b',
                cursor: '#6366f1',
                cursorAccent: '#ffffff',
                selectionBackground: 'rgba(99,102,241,0.2)',
                black: '#0f172a',
                red: '#e11d48',
                green: '#10b981',
                yellow: '#d97706',
                blue: '#2563eb',
                magenta: '#9333ea',
                cyan: '#0891b2',
                white: '#cbd5e1',
                brightBlack: '#64748b',
                brightRed: '#f43f5e',
                brightGreen: '#34d399',
                brightYellow: '#fbbf24',
                brightBlue: '#60a5fa',
                brightMagenta: '#c084fc',
                brightCyan: '#22d3ee',
                brightWhite: '#f8fafc',
            } : {
                background: '#0d0d14',
                foreground: '#e2e8f0',
                cursor: '#6366f1',
                cursorAccent: '#0d0d14',
                selectionBackground: 'rgba(99,102,241,0.35)',
                black: '#000000',
                red: '#ef4444',
                green: '#22c55e',
                yellow: '#eab308',
                blue: '#3b82f6',
                magenta: '#a855f7',
                cyan: '#06b6d4',
                white: '#f8fafc',
                brightBlack: '#374151',
                brightRed: '#f87171',
                brightGreen: '#4ade80',
                brightYellow: '#fde047',
                brightBlue: '#60a5fa',
                brightMagenta: '#c084fc',
                brightCyan: '#22d3ee',
                brightWhite: '#ffffff',
            }
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(containerEl);

        // Ensure the terminal is focused when clicking on its container
        containerEl.addEventListener('mousedown', () => {
            setTimeout(() => term.focus(), 1);
        });

        fitAddon.fit();

        // ── Performance Addons (WebGL / Canvas fallback) ──────────────────────
        try {
            const webglAddon = new WebglAddon();
            webglAddon.onContextLoss(() => {
                webglAddon.dispose();
            });
            term.loadAddon(webglAddon);
            console.log(`[Terminal ${tabId}] WebGL renderer enabled`);
        } catch (e) {
            console.warn(`[Terminal ${tabId}] WebGL addon failed to load, falling back to Canvas:`, e);
            try {
                const canvasAddon = new CanvasAddon();
                term.loadAddon(canvasAddon);
                console.log(`[Terminal ${tabId}] Canvas renderer enabled`);
            } catch (e2) {
                console.warn(`[Terminal ${tabId}] Canvas addon failed to load, using default DOM renderer:`, e2);
            }
        }

        const instance: TabInstance = { id: tabId, label, term, fitAddon, containerEl, status: 'connecting', cleanupFns: [] };

        // Show "connecting" message
        term.writeln('\x1b[2m\x1b[36mConnecting...\x1b[0m');

        // Spawn ssh2 shell
        const { cols, rows } = term;
        api.tabSpawn(serverId, tabId, cols, rows).then((result: { success: boolean; error?: string }) => {
            if (!result.success) {
                term.writeln(`\r\n\x1b[31m✖ Connection failed: ${result.error}\x1b[0m\r\n`);
                setTabs(prev => prev.map(t => t.id === tabId ? { ...t, status: 'closed' } : t));
            } else {
                term.clear();
                setTabs(prev => prev.map(t => t.id === tabId ? { ...t, status: 'connected' } : t));
            }
        });

        // Receive output from main process
        const removeOutput = api.onTabOutput(tabId, (data: string) => term.write(data));
        const removeExit = api.onTabExit(tabId, () => {
            term.writeln('\r\n\x1b[33m[Connection closed]\x1b[0m');
            setTabs(prev => prev.map(t => t.id === tabId ? { ...t, status: 'closed' } : t));
        });

        // Send user input to main process
        const dataDisposable = term.onData((data) => api.tabInput(tabId, data));

        // Resize
        const resizeDisposable = term.onResize(({ cols, rows }) => api.tabResize(tabId, cols, rows));

        instance.cleanupFns = [
            removeOutput,
            removeExit,
            () => dataDisposable.dispose(),
            () => resizeDisposable.dispose(),
        ];

        setTabs(prev => [...prev, instance]);
        setActiveTabId(tabId);
    }, [serverId]);

    // ── Close a tab ───────────────────────────────────────────────────────────
    const closeTab = useCallback((tabId: string) => {
        const tab = tabsRef.current.find(t => t.id === tabId);
        if (!tab) return;

        tab.cleanupFns.forEach(fn => fn());
        api.tabKill(tabId);
        tab.term.dispose();
        tab.containerEl.remove();

        setTabs(prev => {
            const remaining = prev.filter(t => t.id !== tabId);
            if (remaining.length === 0) {
                navigate(-1);
            } else {
                setActiveTabId(cur => cur === tabId ? remaining[remaining.length - 1].id : cur);
            }
            return remaining;
        });
    }, [navigate]);

    // ── Switch active tab ─────────────────────────────────────────────────────
    const switchTab = useCallback((tabId: string) => {
        setActiveTabId(tabId);
    }, []);

    // ── Update DOM visibility when activeTabId changes ────────────────────────
    useEffect(() => {
        tabs.forEach(t => {
            const isActive = t.id === activeTabId;
            t.containerEl.style.visibility = isActive ? 'visible' : 'hidden';
            t.containerEl.style.opacity = isActive ? '1' : '0';
            t.containerEl.style.pointerEvents = isActive ? 'auto' : 'none';
            t.containerEl.style.position = isActive ? 'relative' : 'absolute';

            if (isActive) {
                t.term.focus();
                // Force a refresh to fix rendering glitches (disappearing characters)
                t.term.refresh(0, t.term.rows - 1);
            }
        });
        // Fit active tab after show
        const active = tabs.find(t => t.id === activeTabId);
        if (active) {
            setTimeout(() => {
                try {
                    active.fitAddon.fit();
                    active.term.refresh(0, active.term.rows - 1);
                    active.term.focus();
                } catch (_) { }
            }, 100);
        }
    }, [activeTabId, tabs]);

    // ── Window resize → fit all visible ──────────────────────────────────────
    useEffect(() => {
        const handleResize = () => {
            const active = tabsRef.current.find(t => t.id === activeTabId);
            if (active) {
                try { active.fitAddon.fit(); } catch (_) { }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTabId]);

    // ── Open first tab on mount ───────────────────────────────────────────────
    useEffect(() => {
        // Wait for container to be rendered
        const timer = setTimeout(() => openTab(1), 100);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Keyboard shortcut: Ctrl+T = new tab ──────────────────────────────────
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                openTab();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [openTab]);

    return (
        <div className="flex flex-col w-screen h-screen bg-theme-bg overflow-hidden text-theme-text-primary">
            {/* ── Tab bar ──────────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-1 px-2 pt-2 pb-0 shrink-0 select-none"
                style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--theme-border)', minHeight: '38px' }}
            >
                {/* Draggable region placeholder (for frameless window) */}
                <div className="w-2" />

                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => switchTab(tab.id)}
                        className="flex items-center gap-2 px-3 py-1 rounded-t-lg cursor-pointer text-xs font-mono transition-all group/tab"
                        style={{
                            background: tab.id === activeTabId ? 'var(--theme-bg-muted)' : 'transparent',
                            borderTop: tab.id === activeTabId ? '1px solid #6366f1' : '1px solid transparent',
                            borderLeft: tab.id === activeTabId ? '1px solid var(--theme-border)' : '1px solid transparent',
                            borderRight: tab.id === activeTabId ? '1px solid var(--theme-border)' : '1px solid transparent',
                            color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-muted)',
                            maxWidth: '160px',
                        }}
                    >
                        {/* Status dot */}
                        <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                                background: tab.status === 'connected' ? '#22c55e'
                                    : tab.status === 'connecting' ? '#eab308'
                                        : '#ef4444'
                            }}
                        />
                        <span className="truncate">{tab.label}</span>
                        {/* Tab close button */}
                        <button
                            onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                            className="ml-1 opacity-0 group-hover/tab:opacity-100 hover:text-red-400 transition-all rounded p-0.5 shrink-0"
                            title="Close tab"
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                ))}

                {/* New tab button */}
                <button
                    onClick={() => openTab()}
                    title="New terminal tab (Ctrl+T)"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-white/5 transition-all text-lg leading-none shrink-0"
                >
                    +
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Close entire terminal window */}
                <button
                    onClick={() => navigate(-1)}
                    title="Close terminal"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 mr-1"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 1l10 10M11 1L1 11" />
                    </svg>
                </button>
            </div>

            {/* ── Terminal area ─────────────────────────────────────────────── */}
            <div
                ref={terminalContainerRef}
                className="flex-1 relative overflow-hidden"
                style={{ background: isLight ? '#ffffff' : '#0d0d14', padding: '4px' }}
            />
        </div>
    );
};

export default TerminalWindow;
