import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import OsIcon from "../components/ui/OsIcon";
import type { Server, OsType } from "../../shared/server";

const Home: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [servers, setServers] = useState<Server[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState(22);
    const [username, setUsername] = useState('root');
    const [authType, setAuthType] = useState<"password" | "key">("password");
    const [password, setPassword] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [privateKeyPath, setPrivateKeyPath] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [os, setOs] = useState<OsType>('linux');

    const navigate = useNavigate();
    const api = (window as any).api;

    const loadServers = async () => {
        if (api?.getServers) {
            const data: Server[] = await api.getServers();
            // Get last 5 servers added (assuming append-only, reverse and take 5)
            setServers(data.reverse().slice(0, 5));
        }
    };

    useEffect(() => {
        loadServers();
    }, []);

    const resetForm = () => {
        setName('');
        setHost('');
        setPort(22);
        setUsername('root');
        setAuthType('password');
        setPassword('');
        setPrivateKey('');
        setPrivateKeyPath('');
        setPassphrase('');
        setOs('linux');
    };

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newServer: Server = {
            id: '',
            name: name || host, // fallback to host if name is empty
            host,
            port,
            username,
            authType,
            password: authType === 'password' ? password : undefined,
            privateKey: authType === 'key' ? privateKey : undefined,
            privateKeyPath: authType === 'key' ? privateKeyPath : undefined,
            passphrase: authType === 'key' && passphrase ? passphrase : undefined,
            os,
        };

        if (api?.addServer) {
            const success = await api.addServer(newServer);
            if (success) {
                setIsModalOpen(false);
                loadServers();
            } else {
                alert("Failed to add Server.");
            }
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Welcome to UlakSSH</h1>
                    <p className="text-gray-400 mt-2">Manage and connect to your servers effortlessly.</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add SSH
                </button>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-200">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Recent Connections
                </h2>

                {servers.length === 0 ? (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center flex flex-col items-center justify-center">
                        <div className="bg-gray-800 rounded-full p-4 mb-4">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-300">No servers found</h3>
                        <p className="text-gray-500 mt-2 max-w-sm">You haven't added any SSH connections yet. Click the Add SSH button to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {servers.map((server, idx) => (
                            <div key={server.id || idx} className="bg-gray-900 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-5 hover:bg-gray-800/80 transition-all group cursor-pointer shadow-sm hover:shadow-indigo-900/20">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3 truncate">
                                        <OsIcon os={server.os} className="w-8 h-8 flex-shrink-0" />
                                        <h3 className="font-semibold text-lg text-gray-100 truncate">{server.name}</h3>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-md font-medium">Ready</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/server/${server.id}`);
                                            }}
                                            className="text-gray-400 hover:text-indigo-400 bg-gray-800 hover:bg-gray-700 p-1.5 rounded-lg transition-all shadow-sm"
                                            title="Connect to Server"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400 space-y-1">
                                    <div className="flex items-center gap-2 truncate">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                        {server.host}:{server.port}
                                    </div>
                                    <div className="flex items-center gap-2 truncate">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        {server.username}
                                    </div>
                                    <div className="flex items-center gap-2 truncate mt-3 pt-3 border-t border-gray-800/60">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={server.authType === 'key' ? "text-amber-400" : "text-blue-400"}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        <span className="capitalize text-xs font-medium">{server.authType} Auth</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add SSH Server">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Name (Alias)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-700"
                                placeholder="e.g. Production Web"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Username *</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-1">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Host (IP or Domain) *</label>
                            <input
                                type="text"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-700 font-mono"
                                placeholder="192.168.1.1"
                                required
                            />
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Port *</label>
                            <input
                                type="number"
                                value={port}
                                onChange={(e) => setPort(parseInt(e.target.value) || 22)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                required
                                min="1"
                                max="65535"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Operating System</label>
                        <select
                            value={os}
                            onChange={(e) => setOs(e.target.value as OsType)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium appearance-none"
                        >
                            <option value="linux">Linux (Generic)</option>
                            <option value="ubuntu">Ubuntu</option>
                            <option value="debian">Debian</option>
                            <option value="centos">CentOS / RHEL</option>
                            <option value="fedora">Fedora</option>
                            <option value="arch">Arch Linux</option>
                            <option value="alpine">Alpine Linux</option>
                            <option value="suse">openSUSE</option>
                            <option value="macos">macOS</option>
                            <option value="windows">Windows</option>
                        </select>
                    </div>

                    <div className="pt-2 border-t border-gray-800">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Authentication Method</label>
                        <div className="flex bg-gray-950 rounded-lg border border-gray-800 overflow-hidden mb-4 p-1 space-x-1">
                            <button
                                type="button"
                                onClick={() => setAuthType("password")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${authType === 'password' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => setAuthType("key")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${authType === 'key' ? 'bg-gray-800 text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                SSH Key
                            </button>
                        </div>

                        {authType === 'password' ? (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password *</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                    required={authType === 'password'}
                                    placeholder="••••••••"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Private Key Path</label>
                                    <input
                                        type="text"
                                        value={privateKeyPath}
                                        onChange={(e) => setPrivateKeyPath(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm placeholder:text-gray-700"
                                        placeholder="/path/to/id_rsa or .pem"
                                    />
                                    <p className="text-[10px] text-gray-500">Provide the absolute path to your key file.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex justify-between">
                                        <span>Private Key Content (Optional)</span>
                                        <span className="text-[10px] lowercase normal-case text-gray-600">If path is not provided</span>
                                    </label>
                                    <textarea
                                        value={privateKey}
                                        onChange={(e) => setPrivateKey(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-xs placeholder:text-gray-700 h-24 resize-none"
                                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex justify-between">
                                        <span>Passphrase (Optional)</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={passphrase}
                                        onChange={(e) => setPassphrase(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                        placeholder="••••••••"
                                    />
                                    <p className="text-[10px] text-gray-500">Only needed if your key is encrypted.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 mt-6 border-t border-gray-800 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                        >
                            Connect & Save
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Home;