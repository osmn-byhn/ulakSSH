import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import NeofetchInfo from "../components/ui/NeofetchInfo";
import TabSystem from "../components/ui/TabSystem";
import CodeEditor from "../components/ui/CodeEditor";
import Editor from "@monaco-editor/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, Database, Activity, Layers, Clock, Gauge, FolderPlus, FilePlus, Edit2, Trash2, Copy, FileCode, Plus, Download, Upload } from 'lucide-react';
import type { AlertType } from "../components/ui/Alert";
import type { Server } from "../../shared/server";

const FolderIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 19V9C22 7.89543 21.1046 7 20 7H12L10 5H4C2.89543 5 2 5.89543 2 7V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 2V9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface ServerStats {
    cpu: { usage: number; loadAvg: number[]; cores: number; perCore: number[]; };
    memory: { total: number; used: number; free: number; percent: number; };
    processes: Array<{ pid: string; user: string; cpu: number; mem: number; command: string; }>;
    gpu?: { name: string; usage: number; memoryUsed: number; memoryTotal: number; temp: number; };
    disk?: {
        device: string;
        type: string;
        mount: string;
        total: string;
        used: string;
        free: string;
        percent: number;
        topConsumers: Array<{ size: string; path: string; percent: number; }>;
    };
    logins?: Array<{ user: string; ip: string; status: 'success' | 'failed'; date: string; }>;
    uptime: string;
}

const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts':
        case 'tsx': return 'typescript';
        case 'js':
        case 'jsx': return 'javascript';
        case 'json': return 'json';
        case 'md': return 'markdown';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'py': return 'python';
        case 'sh': return 'shell';
        case 'yml':
        case 'yaml': return 'yaml';
        case 'rs': return 'rust';
        case 'go': return 'go';
        case 'cpp':
        case 'h': return 'cpp';
        case 'java': return 'java';
        default: return 'text';
    }
};

interface EditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    filename: string;
    content: string;
    onSave: (newContent: string) => Promise<void>;
}

const EditorModal: React.FC<EditorModalProps> = ({ isOpen, onClose, filename, content, onSave }) => {
    const [editorValue, setEditorValue] = useState(content);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setEditorValue(content);
    }, [content, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(editorValue);
            onClose();
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const language = getLanguage(filename);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="glass w-full max-w-6xl h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-2xl bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold tracking-tight text-white/90">{filename}</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse" />
                                <p className="text-[10px] font-mono text-[#06b6d4] uppercase tracking-widest font-black">{language} edit mode</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-muted hover:text-white transition-all border border-transparent hover:border-white/10"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Editor Body */}
                <div className="flex-1 overflow-hidden">
                    <Editor
                        height="100%"
                        language={language}
                        theme="vs-dark"
                        value={editorValue}
                        onChange={(val) => setEditorValue(val || '')}
                        options={{
                            minimap: { enabled: true },
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16 },
                            renderLineHighlight: 'all',
                            lineNumbers: 'on',
                            scrollbar: {
                                vertical: 'visible',
                                horizontal: 'visible',
                                useShadows: false,
                                verticalHasArrows: false,
                                horizontalHasArrows: false,
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10,
                            }
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-white/5 flex items-center justify-between bg-white/5">
                    <p className="text-[10px] font-mono text-muted/50 uppercase tracking-widest hidden sm:block">
                        Monaco Editor Core - VS Code Powered
                    </p>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-8 py-2.5 rounded-2xl text-[10px] font-black font-mono tracking-widest uppercase text-muted hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 sm:flex-none px-8 py-2.5 rounded-2xl bg-[#06b6d4] hover:bg-[#06b6d4]/80 text-black text-[10px] font-black font-mono tracking-widest uppercase shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                                </svg>
                            )}
                            {saving ? 'Processing...' : 'Save File'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    items: Array<{
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        danger?: boolean;
        disabled?: boolean;
    }>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, items }) => {
    useEffect(() => {
        const handleClick = () => onClose();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [onClose]);

    return (
        <div 
            className="fixed z-[200] glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-w-[180px] animate-fade-in"
            style={{ top: y, left: x }}
        >
            <div className="py-1 px-1 flex flex-col gap-0.5">
                {items.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!item.disabled) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        disabled={item.disabled}
                        className={`flex items-center gap-3 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all rounded-xl w-full text-left
                            ${item.disabled ? 'opacity-30 cursor-not-allowed' : 
                              item.danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-muted hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const Directions: React.FC<{ server: Server, connected: boolean, triggerAlert: (msg: string, type: AlertType) => void }> = ({ server, connected, triggerAlert }) => {
    const [path, setPath] = useState('/');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, target: any | null } | null>(null);
    const [clipboard, setClipboard] = useState<{ path: string, type: 'copy' | 'cut', name: string } | null>(null);
    
    // UI Dialog states
    const [showNameDialog, setShowNameDialog] = useState<{ type: 'file' | 'folder' | 'rename', target?: any } | null>(null);
    const [nameInputValue, setNameInputValue] = useState('');

    // Settings from localStorage
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(
        (localStorage.getItem('ulakssh_view_mode') as 'grid' | 'list') || 'grid'
    );
    const [sortBy, setSortBy] = useState<'name' | 'size' | 'mtime'>(
        (localStorage.getItem('ulakssh_sort_by') as 'name' | 'size' | 'mtime') || 'name'
    );
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
        (localStorage.getItem('ulakssh_sort_order') as 'asc' | 'desc') || 'asc'
    );

    const [selectedFile, setSelectedFile] = useState<{ name: string, content: string, path: string } | null>(null);

    const api = (window as any).api;

    useEffect(() => {
        if (connected) {
            loadDirectory(path);
        }
    }, [path, connected]);

    useEffect(() => {
        localStorage.setItem('ulakssh_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('ulakssh_sort_by', sortBy);
        localStorage.setItem('ulakssh_sort_order', sortOrder);
    }, [sortBy, sortOrder]);

    const loadDirectory = async (dirPath: string) => {
        if (!api || !connected) return;
        setLoading(true);
        try {
            const result = await api.listDirectory(server.id, dirPath);
            if (result.error) {
                console.error("SFTP error:", result.error);
                triggerAlert(`SFTP Error: ${result.error}`, "error");
                setItems([]);
            } else {
                // Filter out self and parent links
                const filtered = result.filter((item: any) => item.name !== '.' && item.name !== '..');
                setItems(filtered);
            }
        } catch (err) {
            console.error("Failed to list directory:", err);
            triggerAlert("Failed to fetch directory contents", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, item: any | null) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, target: item });
    };

    const handleCreateFolder = async (name: string) => {
        if (!name) return;
        const fullPath = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`;
        try {
            const result = await api.createRemoteDirectory(server.id, fullPath);
            if (result.success) {
                triggerAlert(`Folder "${name}" created`, "info");
                loadDirectory(path);
            } else {
                triggerAlert(`Error: ${result.error}`, "error");
            }
        } catch (err) {
            triggerAlert("Failed to create folder", "error");
        }
    };

    const handleCreateFile = async (name: string) => {
        if (!name) return;
        const fullPath = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`;
        try {
            const result = await api.writeRemoteFile(server.id, fullPath, '');
            if (result.success) {
                triggerAlert(`File "${name}" created`, "info");
                loadDirectory(path);
            } else {
                triggerAlert(`Error: ${result.error}`, "error");
            }
        } catch (err) {
            triggerAlert("Failed to create file", "error");
        }
    };

    const handleDelete = async (item: any) => {
        const fullPath = path.endsWith('/') ? `${path}${item.name}` : `${path}/${item.name}`;
        if (!confirm(`Are you sure you want to delete ${item.isDirectory ? 'directory' : 'file'} "${item.name}"?`)) return;
        
        try {
            const result = await api.deleteRemoteItem(server.id, fullPath, item.isDirectory);
            if (result.success) {
                triggerAlert(`"${item.name}" deleted`, "info");
                loadDirectory(path);
            } else {
                triggerAlert(`Error: ${result.error}`, "error");
            }
        } catch (err) {
            triggerAlert("Failed to delete item", "error");
        }
    };

    const handleRename = async (item: any, newName: string) => {
        if (!newName || newName === item.name) return;
        const oldPath = path.endsWith('/') ? `${path}${item.name}` : `${path}/${item.name}`;
        const newPath = path.endsWith('/') ? `${path}${newName}` : `${path}/${newName}`;
        
        try {
            const result = await api.renameRemoteItem(server.id, oldPath, newPath);
            if (result.success) {
                triggerAlert(`Renamed to "${newName}"`, "info");
                loadDirectory(path);
            } else {
                triggerAlert(`Error: ${result.error}`, "error");
            }
        } catch (err) {
            triggerAlert("Failed to rename item", "error");
        }
    };

    const handleCopyCut = (item: any, type: 'copy' | 'cut') => {
        const fullPath = path.endsWith('/') ? `${path}${item.name}` : `${path}/${item.name}`;
        setClipboard({ path: fullPath, type, name: item.name });
        triggerAlert(`${type === 'copy' ? 'Copied' : 'Cut'} "${item.name}" to clipboard`, "info");
    };

    const handlePaste = async () => {
        if (!clipboard) return;
        const destPath = path.endsWith('/') ? `${path}${clipboard.name}` : `${path}/${clipboard.name}`;
        
        try {
            const result = clipboard.type === 'copy' 
                ? await api.copyRemoteItem(server.id, clipboard.path, destPath)
                : await api.moveRemoteItem(server.id, clipboard.path, destPath);
                
            if (result.success) {
                triggerAlert(`Successfully ${clipboard.type === 'copy' ? 'copied' : 'moved'} to ${path}`, "info");
                if (clipboard.type === 'cut') setClipboard(null);
                loadDirectory(path);
            } else {
                triggerAlert(`Error: ${result.error}`, "error");
            }
        } catch (err) {
            triggerAlert("Paste operation failed", "error");
        }
    };

    const handleDownload = async (item: any) => {
        const fullPath = path.endsWith('/') ? `${path}${item.name}` : `${path}/${item.name}`;
        setLoading(true);
        try {
            const result = await api.downloadItem(server.id, fullPath, item.isDirectory);
            if (result.success) {
                triggerAlert(`Downloaded "${item.name}" successfully`, "info");
            } else if (result.error !== 'Cancelled') {
                triggerAlert(`Download failed: ${result.error}`, "error");
            }
        } catch (err: any) {
            triggerAlert(`Critical error during download: ${err.message || 'Check console'}`, "error");
            console.error("Download interaction failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        setLoading(true);
        try {
            const result = await api.uploadItems(server.id, path);
            if (result.success) {
                triggerAlert("Files uploaded successfully", "info");
                loadDirectory(path);
            } else if (result.error !== 'Cancelled') {
                triggerAlert(`Upload failed: ${result.error}`, "error");
            }
        } catch (err) {
            triggerAlert("Critical error during upload", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = async (item: any) => {
        const fullPath = path.endsWith('/') ? `${path}${item.name}` : `${path}/${item.name}`;

        if (item.isDirectory) {
            setPath(fullPath);
        } else {
            // Open editor for files
            setLoading(true);
            try {
                const content = await api.readRemoteFile(server.id, fullPath);
                if (content && typeof content === 'string') {
                    setSelectedFile({ name: item.name, content, path: fullPath });
                } else if (content?.error) {
                    triggerAlert(`Failed to read file: ${content.error}`, "error");
                }
            } catch (err) {
                console.error("Read file error:", err);
                triggerAlert("Failed to read remote file content", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSaveFile = async (newContent: string) => {
        if (!selectedFile) return;
        try {
            const result = await api.writeRemoteFile(server.id, selectedFile.path, newContent);
            if (result.success) {
                triggerAlert("File saved successfully", "info");
                // Update local content in case we keep it open
                setSelectedFile({ ...selectedFile, content: newContent });
            } else {
                triggerAlert(`Failed to save: ${result.error}`, "error");
            }
        } catch (err) {
            console.error("Save file error:", err);
            triggerAlert("Critical error while saving file", "error");
        }
    };

    const navigateToBreadcrumb = (index: number) => {
        const parts = path.split('/').filter(p => p);
        const newPath = '/' + parts.slice(0, index + 1).join('/');
        setPath(newPath === '//' ? '/' : newPath);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (mtime: number) => {
        return new Date(mtime).toLocaleString();
    };

    // Filter and Sort
    const filteredItems = items.filter(item =>
        searchQuery.length < 3 || item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        // Always folders first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;

        let comparison = 0;
        if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
        else if (sortBy === 'size') comparison = a.size - b.size;
        else if (sortBy === 'mtime') comparison = a.mtime - b.mtime;

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const breadcrumbs = path.split('/').filter(p => p);

    return (
        <div 
            className="flex flex-col gap-4 animate-fade-in h-[500px] outline-none"
            onContextMenu={(e) => handleContextMenu(e, null)}
            tabIndex={0}
        >
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 glass rounded-2xl p-3 border border-white/5">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search items (min 3 chars)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono outline-none focus:border-[#06b6d4]/50 transition-all"
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUpload}
                        disabled={loading || !connected}
                        className="p-2 px-3 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 text-[#06b6d4] flex items-center gap-2 transition-all disabled:opacity-30"
                        title="Upload (Export) to this directory"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden sm:inline">Export</span>
                    </button>

                    <button
                        onClick={() => loadDirectory(path)}
                        disabled={loading || !connected}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted disabled:opacity-30"
                        title="Refresh"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.22L21 7V1" />
                        </svg>
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-wider outline-none cursor-pointer hover:bg-white/10"
                    >
                        <option value="name">Sort: Name</option>
                        <option value="size">Sort: Size</option>
                        <option value="mtime">Sort: Date</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2 px-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-muted"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-xl border transition-all ${viewMode === 'grid' ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4]' : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4]' : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[10px] font-mono px-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button
                    onClick={() => setPath('/')}
                    className={`hover:text-[#06b6d4] transition-colors ${path === '/' ? 'text-[#06b6d4]' : 'text-muted'}`}
                >
                    ROOT
                </button>
                {breadcrumbs.map((part, i) => (
                    <React.Fragment key={i}>
                        <span className="text-white/10">/</span>
                        <button
                            onClick={() => navigateToBreadcrumb(i)}
                            className={`hover:text-[#06b6d4] transition-colors ${i === breadcrumbs.length - 1 ? 'text-[#06b6d4]' : 'text-muted'}`}
                        >
                            {part}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* List/Grid Container */}
            <div className="flex-1 overflow-y-auto glass rounded-2xl p-4 border border-white/5 scrollbar-thin">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 py-20">
                        <div className="w-8 h-8 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
                        <span className="text-xs font-mono text-muted animate-pulse">Scanning filesystem...</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 py-20 opacity-30">
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin mb-2" />
                        ) : (
                            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M22 19V9C22 7.89543 21.1046 7 20 7H12L10 5H4C2.89543 5 2 5.89543 2 7V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19Z" />
                            </svg>
                        )}
                        <span className="text-sm font-mono tracking-widest uppercase">{loading ? 'Scanning...' : 'Directory Empty'}</span>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredItems.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => handleItemClick(item)}
                                onContextMenu={(e) => handleContextMenu(e, item)}
                                className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all outline-none text-center"
                            >
                                <div className="relative">
                                    {item.isDirectory ? (
                                        <FolderIcon className="w-12 h-12 text-[#06b6d4] group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <FileIcon className="w-12 h-12 text-muted group-hover:scale-110 transition-transform" />
                                    )}
                                </div>
                                <span className="text-[10px] font-mono leading-tight truncate w-full group-hover:text-white transition-colors">
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse font-mono text-[10px]">
                        <thead>
                            <tr className="text-muted border-b border-white/5">
                                <th className="pb-3 pl-2 font-bold uppercase tracking-widest">Name</th>
                                <th className="pb-3 font-bold uppercase tracking-widest text-right">Size</th>
                                <th className="pb-3 pl-10 font-bold uppercase tracking-widest">Modified</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, i) => (
                                <tr
                                    key={i}
                                    onClick={() => handleItemClick(item)}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                    className="group hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <td className="py-2.5 pl-2 flex items-center gap-3 max-w-[300px]">
                                        {item.isDirectory ? (
                                            <FolderIcon className="w-4 h-4 text-[#06b6d4] shrink-0" />
                                        ) : (
                                            <FileIcon className="w-4 h-4 text-muted shrink-0" />
                                        )}
                                        <span className="truncate group-hover:text-white">{item.name}</span>
                                    </td>
                                    <td className="py-2.5 text-right text-muted">{item.size > 0 ? formatSize(item.size) : '—'}</td>
                                    <td className="py-2.5 pl-10 text-muted">{formatDate(item.mtime)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <EditorModal
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                filename={selectedFile?.name || ''}
                content={selectedFile?.content || ''}
                onSave={handleSaveFile}
            />

            {/* Context Menu Instance */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    items={[
                        { 
                            label: 'New Folder', 
                            icon: <FolderPlus className="w-4 h-4" />, 
                            onClick: () => { setShowNameDialog({ type: 'folder' }); setNameInputValue(''); } 
                        },
                        { 
                            label: 'New File', 
                            icon: <FilePlus className="w-4 h-4" />, 
                            onClick: () => { setShowNameDialog({ type: 'file' }); setNameInputValue(''); } 
                        },
                        ...(contextMenu.target ? [
                            { 
                                label: 'Rename', 
                                icon: <Edit2 className="w-4 h-4" />, 
                                onClick: () => { setShowNameDialog({ type: 'rename', target: contextMenu.target }); setNameInputValue(contextMenu.target.name); } 
                            },
                            { 
                                label: 'Download', 
                                icon: <Download className="w-4 h-4" />, 
                                onClick: () => handleDownload(contextMenu.target) 
                            },
                            { 
                                label: 'Copy', 
                                icon: <Copy className="w-4 h-4" />, 
                                onClick: () => handleCopyCut(contextMenu.target, 'copy') 
                            },
                            { 
                                label: 'Cut', 
                                icon: <FileCode className="w-4 h-4" />, 
                                onClick: () => handleCopyCut(contextMenu.target, 'cut') 
                            },
                            { 
                                label: 'Delete', 
                                icon: <Trash2 className="w-4 h-4" />, 
                                onClick: () => handleDelete(contextMenu.target),
                                danger: true 
                            },
                        ] : []),
                        { 
                            label: 'Paste', 
                            icon: <Plus className="w-4 h-4" />, 
                            onClick: handlePaste,
                            disabled: !clipboard 
                        },
                        { 
                            label: 'Refresh', 
                            icon: <Activity className="w-4 h-4" />, 
                            onClick: () => loadDirectory(path) 
                        },
                    ]}
                />
            )}

            {/* Name Input Dialog */}
            {showNameDialog && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="glass w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col gap-4 scale-in">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-[#06b6d4]/10 text-[#06b6d4]">
                                {showNameDialog.type === 'folder' ? <FolderPlus className="w-5 h-5" /> : 
                                 showNameDialog.type === 'file' ? <FilePlus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                            </div>
                            <h3 className="text-sm font-bold font-mono uppercase tracking-widest">
                                {showNameDialog.type === 'folder' ? 'Create Folder' : 
                                 showNameDialog.type === 'file' ? 'Create File' : 'Rename Item'}
                            </h3>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            value={nameInputValue}
                            onChange={(e) => setNameInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (showNameDialog.type === 'rename') handleRename(showNameDialog.target, nameInputValue);
                                    else if (showNameDialog.type === 'folder') handleCreateFolder(nameInputValue);
                                    else if (showNameDialog.type === 'file') handleCreateFile(nameInputValue);
                                    setShowNameDialog(null);
                                } else if (e.key === 'Escape') setShowNameDialog(null);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-mono outline-none focus:border-[#06b6d4]/50"
                            placeholder="Enter name..."
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNameDialog(null)}
                                className="flex-1 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-muted hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (showNameDialog.type === 'rename') handleRename(showNameDialog.target, nameInputValue);
                                    else if (showNameDialog.type === 'folder') handleCreateFolder(nameInputValue);
                                    else if (showNameDialog.type === 'file') handleCreateFile(nameInputValue);
                                    setShowNameDialog(null);
                                }}
                                className="flex-1 py-2 rounded-xl bg-[#06b6d4] text-black text-[10px] font-mono font-bold uppercase tracking-widest"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const Settings: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Commands: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Configs: React.FC<{ server: Server, triggerAlert: (message: string, type: AlertType) => void }> = ({ server, triggerAlert }) => {
    return (
        <div className="glass rounded-2xl p-6 flex flex-col gap-6" style={{ background: 'rgba(8, 11, 22, 0.9)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#06b6d4]">Connection</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">ID</span>
                            <span className="text-primary">{server.id}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">Host</span>
                            <span className="text-primary">{server.host}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">Port</span>
                            <span className="text-primary">{server.port}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#a855f7]">Security</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">User</span>
                            <span className="text-primary">{server.username}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">Auth</span>
                            <span className="text-primary uppercase">{server.authType}</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-muted">OS</span>
                            <span className="text-primary capitalize">{server.os || 'Linux'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-end gap-3">
                <button
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-muted hover:text-white hover:bg-white/5 transition-all"
                    onClick={() => triggerAlert("Edit mode coming soon", "info")}
                >
                    Edit Configuration
                </button>
            </div>
        </div>
    );
}

const Health: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Apps: React.FC = () => {
    return (
        <div className="h-full">

        </div>
    );
}

const Graphics: React.FC<{ server: Server | null, connected: boolean, stats: ServerStats | null, history: any[] }> = ({ server, connected, stats, history }) => {
    const [loading, setLoading] = useState(!stats);

    useEffect(() => {
        if (stats) setLoading(false);
    }, [stats]);

    if (!connected || !server) return (
        <div className="h-full flex flex-col items-center justify-center opacity-40">
            <Activity className="w-12 h-12 mb-4" />
            <p className="text-sm font-mono tracking-widest uppercase">
                {!connected ? 'Connect to view live session telemetry' : 'Initializing Server Metadata...'}
            </p>
        </div>
    );

    if (loading && !stats) return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-xs font-mono text-muted animate-pulse">Initializing Data Stream...</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 animate-fade-in p-1">
            {/* Header / Summary Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted">
                        <Cpu className="w-4 h-4 text-cyan-500" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">CPU Usage</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white/90">
                        {stats?.cpu.usage.toFixed(1)}<span className="text-sm text-cyan-500">%</span>
                    </div>
                    <div className="text-[10px] text-muted font-mono">{stats?.cpu.cores} Cores Detected</div>
                </div>

                <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted">
                        <Database className="w-4 h-4 text-purple-500" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Memory</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white/90">
                        {stats?.memory.percent.toFixed(1)}<span className="text-sm text-purple-500">%</span>
                    </div>
                    <div className="text-[10px] text-muted font-mono">
                        {stats ? ((stats.memory.used / 1024 / 1024 / 1024).toFixed(1)) : '0'}G / {stats ? ((stats.memory.total / 1024 / 1024 / 1024).toFixed(1)) : '0'}G
                    </div>
                </div>

                <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">System Uptime</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-white/90 pt-1">
                        {stats?.uptime}
                    </div>
                    <div className="text-[10px] text-muted font-mono">Real-time Heartbeat</div>
                </div>

                {stats?.gpu && (
                    <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-muted">
                            <Gauge className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">GPU : {stats.gpu.name}</span>
                        </div>
                        <div className="text-2xl font-bold font-mono text-white/90">
                            {stats.gpu.usage.toFixed(0)}<span className="text-sm text-orange-500">%</span>
                        </div>
                        <div className="text-[10px] text-muted font-mono">{stats.gpu.temp}°C Thermal State</div>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[250px]">
                <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-4 left-6 flex items-center gap-2 z-10">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[9px] font-bold font-mono text-white/60 tracking-[0.2em] uppercase">Processor Load History</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="time" hide />
                            <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                stroke="rgba(255,255,255,0.1)"
                                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }}
                                width={25}
                            />
                            <Tooltip
                                contentStyle={{ background: '#080b16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                itemStyle={{ color: '#06b6d4' }}
                            />
                            <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-4 left-6 flex items-center gap-2 z-10">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[9px] font-bold font-mono text-white/60 tracking-[0.2em] uppercase">Memory Optimization</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="time" hide />
                            <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                stroke="rgba(255,255,255,0.1)"
                                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }}
                                width={25}
                            />
                            <Tooltip
                                contentStyle={{ background: '#080b16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                itemStyle={{ color: '#a855f7' }}
                            />
                            <Area type="monotone" dataKey="mem" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Per-Core Section */}
            <div className="glass p-5 rounded-3xl border border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[9px] font-bold font-mono text-white/60 tracking-[0.2em] uppercase">Core Allocation & Cluster Distribution</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-3">
                    {stats?.cpu.perCore.map((usage, i) => (
                        <div key={i} className="flex flex-col gap-1.5 group cursor-help" title={`Core ${i}: ${usage}%`}>
                            <div className="flex justify-between items-center text-[7px] font-mono text-muted group-hover:text-white/80 transition-colors">
                                <span>C{i < 10 ? `0${i}` : i}</span>
                                <span className={usage > 80 ? 'text-rose-400' : usage > 50 ? 'text-amber-400' : 'text-cyan-400'}>{usage}%</span>
                            </div>
                            <div className="h-10 w-full bg-white/5 rounded-lg flex flex-col justify-end overflow-hidden border border-white/5 transition-all group-hover:border-white/10">
                                <div
                                    className="w-full transition-all duration-700 ease-out"
                                    style={{
                                        height: `${usage}%`,
                                        background: usage > 80
                                            ? 'linear-gradient(to top, rgba(244,63,94,0.6) 0%, rgba(244,63,94,0.9) 100%)'
                                            : usage > 50
                                                ? 'linear-gradient(to top, rgba(245,158,11,0.5) 0%, rgba(245,158,11,0.8) 100%)'
                                                : 'linear-gradient(to top, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0.7) 100%)',
                                        boxShadow: usage > 90 ? '0 0 10px rgba(244,63,94,0.3)' : 'none'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    {(!stats?.cpu.perCore || stats.cpu.perCore.length === 0) && (
                        <div className="col-span-full py-4 text-center opacity-20 italic text-[9px] font-mono tracking-widest">Awaiting Processor Segmentation Data...</div>
                    )}
                </div>
            </div>

            {/* Disk Overview Section */}
            {stats?.disk && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xs font-black font-mono tracking-widest uppercase text-white/90">Storage Partition</h3>
                                    <p className="text-[10px] font-mono text-muted">{stats.disk.device} • {stats.disk.type} Node</p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-xl font-bold font-mono text-amber-500">{stats.disk.percent}%</span>
                                <span className="text-[8px] font-mono text-muted uppercase tracking-widest">Allocation</span>
                            </div>
                        </div>

                        {/* Usage Progress Bar */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[10px] font-mono text-muted italic">
                                <span>{stats.disk.used} used</span>
                                <span>{stats.disk.total} capacity</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                                    style={{ width: `${stats.disk.percent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
                         <div className="flex items-center gap-3">
                             <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                 <Layers className="w-4 h-4" />
                             </div>
                             <h4 className="text-xs font-black font-mono tracking-widest uppercase text-white/90">Storage Consumers</h4>
                         </div>
                         <div className="flex flex-col gap-3">
                             {stats.disk.topConsumers.map((item, idx) => (
                                 <div key={idx} className="flex items-center justify-between group">
                                     <div className="flex items-center gap-3 max-w-[70%]">
                                         <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/30 group-hover:bg-cyan-500 transition-colors" />
                                         <span className="text-[10px] font-mono text-muted truncate group-hover:text-white transition-colors">{item.path}</span>
                                     </div>
                                     <div className="flex items-center gap-4">
                                         <span className="text-[10px] font-mono text-white/30">{item.size}</span>
                                         <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                                             <div className="h-full bg-cyan-500/50" style={{ width: `${item.percent}%` }} />
                                         </div>
                                         <span className="text-[10px] font-mono font-bold text-cyan-500 w-8 text-right">{item.percent.toFixed(0)}%</span>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            )}

            {/* Processes Table */}
            <div className="glass overflow-hidden rounded-3xl border border-white/5 flex flex-col">
                <div className="p-4 px-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                            <Activity className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold font-mono tracking-widest uppercase">System Processes (Top 10)</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[8px] font-mono text-muted uppercase tracking-[0.2em]">Live Stream</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[10px]">
                        <thead>
                            <tr className="text-muted border-b border-white/5">
                                <th className="p-4 px-6 font-bold uppercase tracking-widest">PID</th>
                                <th className="p-4 px-6 font-bold uppercase tracking-widest">User</th>
                                <th className="p-4 px-6 font-bold uppercase tracking-widest text-[#06b6d4]">CPU%</th>
                                <th className="p-4 px-6 font-bold uppercase tracking-widest text-purple-400">MEM%</th>
                                <th className="p-4 px-6 font-bold uppercase tracking-widest">Command</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.processes.map((proc, idx) => (
                                <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors group">
                                    <td className="p-3 px-6 text-white/40">{proc.pid}</td>
                                    <td className="p-3 px-6 text-muted font-bold">{proc.user}</td>
                                    <td className="p-3 px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${Math.min(proc.cpu, 100)}%` }} />
                                            </div>
                                            <span className="text-cyan-500/90 font-bold">{proc.cpu.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3 px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(proc.mem, 100)}%` }} />
                                            </div>
                                            <span className="text-purple-400/90 font-bold">{proc.mem.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3 px-6 text-muted truncate max-w-[200px] group-hover:text-white transition-colors">{proc.command}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};



const ServerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [server, setServer] = useState<Server | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [systemInfo, setSystemInfo] = useState<any>(null);

    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<AlertType>('info');
    const [showAlert, setShowAlert] = useState(false);

    const [stats, setStats] = useState<ServerStats | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const api = (window as any).api;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (connected && server) {
            fetchStats();
            interval = setInterval(fetchStats, 1000);
        }
        return () => clearInterval(interval);
    }, [connected, server]);

    const fetchStats = async () => {
        if (!server) return;
        try {
            const result = await api.getServerStats(server.id);
            if (result && !result.error) {
                setStats(result);
                setHistory(prev => {
                    const newPoint = {
                        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        cpu: result.cpu.usage,
                        mem: result.memory.percent
                    };
                    return [...prev, newPoint].slice(-60);
                });
            }
        } catch (err) {
            console.error("Stats poll error:", err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!id || !api) return;
            try {
                const servers: Server[] = await api.getServers();
                const currentServer = servers.find((s: Server) => s.id === id);
                if (currentServer && isMounted) {
                    setServer(currentServer);
                    if (!connected && !connecting) connectToServer(id);
                } else if (isMounted) {
                    triggerAlert("Server not found", "error");
                }
            } catch (err) {
                if (isMounted) triggerAlert("Failed to load server data", "error");
            }
        };
        init();
        return () => { isMounted = false; };
    }, [id]);

    const triggerAlert = (msg: string, type: AlertType) => {
        setAlertMessage(msg); setAlertType(type); setShowAlert(true);
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
                const info = await api.getSystemInfo(serverId);
                if (info && !info.error) setSystemInfo(info);
            } else {
                setConnected(false);
                triggerAlert(`Connection failed: ${res?.error || 'Unknown error'}`, "error");
            }
        } catch (err: any) {
            setConnecting(false); setConnected(false);
            triggerAlert(`Error: ${err.message}`, "error");
        }
    };

    const handleDisconnect = async () => {
        if (!id) return;
        const res = await api.disconnectServer(id);
        if (res?.success) {
            setConnected(false); setSystemInfo(null);
            triggerAlert("Disconnected cleanly", "info");
        }
    };

    /* ── Loading screen ───────────────────────────────────────────────────── */
    if (!server) {
        return (
            <div
                className="flex h-full w-full items-center justify-center dot-grid-bg"
            >
                <div className="flex flex-col items-center gap-5">
                    {/* Spinning ring */}
                    <div className="relative w-12 h-12">
                        <div
                            className="absolute inset-0 rounded-full border-2 animate-spin"
                            style={{ borderColor: 'transparent', borderTopColor: '#06b6d4' }}
                        />
                        <div
                            className="absolute inset-1 rounded-full border-2"
                            style={{ borderColor: 'rgba(6,182,212,0.15)' }}
                        />
                    </div>
                    <p
                        className="text-sm font-mono"
                        style={{ color: 'rgba(6,182,212,0.6)', animation: 'flicker 2s ease-in-out infinite' }}
                    >
                        Establishing link...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-full relative"
            style={{ background: 'var(--bg-base)' }}
        >
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-6 flex flex-col gap-5 animate-fade-in">

                {/* ── Header card ───────────────────────────────────────────────── */}
                <div
                    className="glass rounded-2xl px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                    <div className="flex items-center gap-4">
                        {/* Back button */}
                        <button
                            onClick={() => navigate('/')}
                            className="p-2.5 rounded-xl transition-all duration-150 hover:bg-white/5"
                            style={{
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2
                                    className="text-lg font-bold font-mono"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {server.name}
                                </h2>
                                <span
                                    className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'var(--text-muted)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    {server.id.slice(0, 8)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="relative">
                                    <span
                                        className="w-2 h-2 rounded-full block"
                                        style={{
                                            background: connected ? '#10b981' : '#f43f5e',
                                            boxShadow: connected
                                                ? '0 0 8px rgba(16,185,129,0.6)'
                                                : '0 0 8px rgba(244,63,94,0.4)',
                                        }}
                                    />
                                    {connected && (
                                        <span
                                            className="absolute inset-0 w-2 h-2 rounded-full"
                                            style={{
                                                background: 'rgba(16,185,129,0.4)',
                                                animation: 'pulse-ring 2s ease-out infinite',
                                            }}
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                    {connecting ? 'connecting...' : connected ? 'online' : 'offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        {connected ? (
                            <button
                                onClick={handleDisconnect}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
                                style={{
                                    background: 'rgba(244,63,94,0.08)',
                                    color: '#f43f5e',
                                    border: '1px solid rgba(244,63,94,0.2)',
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    <line x1="8" y1="8" x2="16" y2="16" />
                                </svg>
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={() => connectToServer(id as string)}
                                disabled={connecting}
                                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                                style={{
                                    background: connecting
                                        ? 'rgba(6,182,212,0.2)'
                                        : 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
                                    boxShadow: connecting ? 'none' : '0 4px 20px rgba(6,182,212,0.25)',
                                    border: connecting ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
                                }}
                            >
                                {connecting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-cyan-300/40 border-t-cyan-400 rounded-full animate-spin" />
                                        Connecting...
                                    </>
                                ) : 'Establish Link'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Tabs System ─────────────────────────────────────────────────── */}
                <TabSystem
                    fullHeight={true}
                    className="min-h-[450px]"
                    tabs={[
                        {
                            id: 'overview',
                            label: 'Overview',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                </svg>
                            ),
                            content: <NeofetchInfo server={server} connected={connected} systemInfo={systemInfo} stats={stats} />
                        },
                        {
                            id: 'dir',
                            label: 'Directories',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 10L13 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M22 11.7979C22 9.16554 22 7.84935 21.2305 6.99383C21.1598 6.91514 21.0849 6.84024 21.0062 6.76946C20.1506 6 18.8345 6 16.2021 6H15.8284C14.6747 6 14.0979 6 13.5604 5.84678C13.2651 5.7626 12.9804 5.64471 12.7121 5.49543C12.2237 5.22367 11.8158 4.81578 11 4L10.4497 3.44975C10.1763 3.17633 10.0396 3.03961 9.89594 2.92051C9.27652 2.40704 8.51665 2.09229 7.71557 2.01738C7.52976 2 7.33642 2 6.94975 2C6.06722 2 5.62595 2 5.25839 2.06935C3.64031 2.37464 2.37464 3.64031 2.06935 5.25839C2 5.62595 2 6.06722 2 6.94975M21.9913 16C21.9554 18.4796 21.7715 19.8853 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            ),
                            content: (
                                <Directions server={server} connected={connected} triggerAlert={triggerAlert} />
                            )
                        },
                        {
                            id: 'scripts',
                            label: 'Scripts',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                                </svg>
                            ),
                            content: (
                                <div className="h-[400px]">
                                    <CodeEditor
                                        initialValue="#!/bin/bash\n\n# Welcome to UlakSSH Script Editor\necho 'Initializing secure link...'\n uptime\n free -m\n"
                                    />
                                </div>
                            )
                        },
                        {
                            id: 'commands',
                            label: 'Commands',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                                </svg>
                            ),
                            content: <Commands />
                        },
                        {
                            id: 'config',
                            label: 'Config',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.72V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.17a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
                                </svg>
                            ),
                            content: <Configs server={server} triggerAlert={triggerAlert} />
                        },
                        {
                            id: 'health',
                            label: 'Health',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            ),
                            content: <Health />
                        },
                        {
                            id: 'apps',
                            label: 'Apps',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                </svg>
                            ),
                            content: <Apps />
                        },
                        {
                            id: 'graphics',
                            label: 'Stats',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                                </svg>
                            ),
                            content: (
                                <div className="h-full overflow-y-auto pr-2 scrollbar-thin">
                                    <Graphics server={server} connected={connected} stats={stats} history={history} />
                                </div>
                            )
                        },
                        {
                            id: 'settings',
                            label: 'Settings',
                            icon: (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            ),
                            content: <Settings />
                        }
                    ]}
                />

                {/* ── Disconnected CTA ───────────────────────────────────────────── */}
                {!connected && !connecting && (
                    <div className="flex justify-center mt-4 animate-slide-up">
                        <button
                            onClick={() => connectToServer(id as string)}
                            className="group relative px-10 py-5 overflow-hidden rounded-2xl transition-all duration-300 active:scale-95"
                            style={{
                                background: 'rgba(6,182,212,0.05)',
                                border: '1px solid rgba(6,182,212,0.15)',
                            }}
                        >
                            {/* Hover fill */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(124,58,237,0.1) 100%)' }}
                            />
                            <div className="relative flex items-center gap-5">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background: 'rgba(6,182,212,0.1)',
                                        border: '1px solid rgba(6,182,212,0.2)',
                                        color: '#06b6d4',
                                    }}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                        Session
                                    </div>
                                    <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Initialize Connection
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                )}
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