import React from 'react';
import { 
    Activity, Database, Layers, RefreshCw, 
    Trash2, Plus, Terminal, Shield, Cpu, HardDrive,
    Search, Package, X
} from 'lucide-react';

interface ActionButtonProps {
    type: string;
    action: string;
    target: string;
    icon: any;
    color: string;
    onAction: (type: string, action: string, target: string) => void;
    disabled?: boolean;
    loadingId?: string | null;
    onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
    type, action, target, icon: Icon, color, onAction, disabled, loadingId, onClick 
}) => {
    const actionId = `${type}-${action}-${target}`;
    const isLoading = loadingId === actionId;
    
    return (
        <button
            onClick={onClick || (() => onAction(type, action, target))}
            disabled={disabled || isLoading}
            className={`p-1.5 rounded-lg border transition-all disabled:opacity-30 ${color} bg-opacity-10 hover:bg-opacity-20`}
            title={`${action} ${target}`}
        >
            {isLoading ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <Icon className="w-3 h-3" />
            )}
        </button>
    );
};

interface HealthSectionProps {
    title: string;
    icon: any;
    color: string;
    children: React.ReactNode;
    isEmpty?: boolean;
    emptyMessage?: string;
}

const HealthSection: React.FC<HealthSectionProps> = ({ 
    title, icon: Icon, color, children, isEmpty, emptyMessage 
}) => (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <h3 className={`text-[11px] font-black font-mono uppercase tracking-widest ${color.includes('text-') ? color : 'text-white/90'}`}>
                {title}
            </h3>
        </div>
        <div className={`glass border rounded-3xl overflow-hidden bg-white/[0.01] ${color.includes('text-') ? color.replace('text-', 'border-').replace('500', '500/10') : 'border-white/5'}`}>
            {isEmpty ? (
                <div className="p-10 text-center text-muted font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
                    {emptyMessage || "No data detected"}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {children}
                </div>
            )}
        </div>
    </div>
);

const TableHeader = ({ titles }: { titles: string[] }) => (
    <thead>
        <tr className="text-muted border-b border-white/10 bg-white/[0.01]">
            {titles.map(t => (
                <th key={t} className="p-3 px-6 font-bold uppercase tracking-widest text-[9px] whitespace-nowrap">{t}</th>
            ))}
        </tr>
    </thead>
);

export const PortTable: React.FC<{ ports: any[], onAction: any, loadingId: any }> = ({ ports, onAction, loadingId }) => (
    <HealthSection title="Active Ports & Process Details" icon={Database} color="text-[#06b6d4]">
        <table className="w-full text-left font-mono text-[10px]">
            <TableHeader titles={['Port', 'Proto', 'Process Name', 'Command', 'PID', 'Actions']} />
            <tbody>
                {ports.map((p, idx) => (
                    <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors group">
                        <td className="p-3 px-6 font-bold text-emerald-400">:{p.port}</td>
                        <td className="p-3 px-6 uppercase text-muted/60">{p.protocol}</td>
                        <td className="p-3 px-6 font-bold text-white/80">{p.process}</td>
                        <td className="p-3 px-6 text-muted/40 text-[9px] max-w-[200px] truncate" title={p.command}>{p.command || '-'}</td>
                        <td className="p-3 px-6 text-muted font-mono">{p.pid}</td>
                        <td className="p-3 px-6">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ActionButton type="pid" action="kill" target={p.pid} icon={Trash2} color="text-rose-500 border-rose-500/20" onAction={onAction} loadingId={loadingId} />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </HealthSection>
);

export const PM2Table: React.FC<{ data: any[], onAction: any, onFetchLogs: any, loadingId: any }> = ({ data, onAction, onFetchLogs, loadingId }) => (
    <HealthSection 
        title="PM2 Ecosystem" 
        icon={Layers} 
        color="text-[#a855f7]"
        isEmpty={!data || data.length === 0}
        emptyMessage="No PM2 processes found"
    >
        <table className="w-full text-left font-mono text-[10px]">
            <TableHeader titles={['ID', 'Name', 'Status', 'Port', 'CPU/Mem', 'Uptime', 'Actions']} />
            <tbody>
                {data.map((p, idx) => (
                    <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors">
                        <td className="p-3 px-6 text-muted">{p.id}</td>
                        <td className="p-3 px-6 font-bold text-white">{p.name}</td>
                        <td className="p-3 px-6">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${p.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {p.status}
                            </span>
                        </td>
                        <td className="p-3 px-6 text-emerald-400 font-bold">{p.port ? `:${p.port}` : '-'}</td>
                        <td className="p-3 px-6 text-muted/60">{p.cpu} / {p.mem}</td>
                        <td className="p-3 px-6 text-[9px] text-muted/40 whitespace-nowrap">{p.uptime.split('T')[0]}</td>
                        <td className="p-3 px-6">
                            <div className="flex items-center gap-2">
                                <ActionButton type="pm2" action="logs" target={p.id} icon={Terminal} color="text-amber-500 border-amber-500/20" onAction={onAction} onClick={() => onFetchLogs('pm2', p.id, `PM2: ${p.name}`)} loadingId={loadingId} />
                                {p.status === 'online' ? (
                                    <ActionButton type="pm2" action="stop" target={p.id} icon={X} color="text-orange-500 border-orange-500/20" onAction={onAction} loadingId={loadingId} />
                                ) : (
                                    <ActionButton type="pm2" action="start" target={p.id} icon={Plus} color="text-emerald-500 border-emerald-500/20" onAction={onAction} loadingId={loadingId} />
                                )}
                                <ActionButton type="pm2" action="restart" target={p.id} icon={RefreshCw} color="text-purple-400 border-purple-500/20" onAction={onAction} loadingId={loadingId} />
                                <ActionButton type="pm2" action="delete" target={p.id} icon={Trash2} color="text-rose-500 border-rose-500/20" onAction={onAction} loadingId={loadingId} />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </HealthSection>
);

export const DockerTable: React.FC<{ data: any[], onAction: any, onFetchLogs: any, loadingId: any }> = ({ data, onAction, onFetchLogs, loadingId }) => (
    <HealthSection 
        title="Docker Containers" 
        icon={Database} 
        color="text-[#06b6d4]"
        isEmpty={!data || data.length === 0}
        emptyMessage="No Docker containers detected"
    >
        <table className="w-full text-left font-mono text-[10px]">
            <TableHeader titles={['Name', 'Image', 'Status', 'Ports', 'Actions']} />
            <tbody>
                {data.map((p, idx) => (
                    <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors">
                        <td className="p-3 px-6 font-bold text-white">{p.name}</td>
                        <td className="p-3 px-6 text-muted/60 max-w-[150px] truncate">{p.image}</td>
                        <td className="p-3 px-6">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${p.status.includes('Up') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {p.status}
                            </span>
                        </td>
                        <td className="p-3 px-6 text-[9px] text-muted/40">{p.ports}</td>
                        <td className="p-3 px-6">
                            <div className="flex items-center gap-2">
                                <ActionButton type="docker" action="logs" target={p.name} icon={Terminal} color="text-amber-500 border-amber-500/20" onAction={onAction} onClick={() => onFetchLogs('docker', p.name, `Docker: ${p.name}`)} loadingId={loadingId} />
                                {p.status.includes('Up') ? (
                                    <ActionButton type="docker" action="stop" target={p.name} icon={X} color="text-orange-500 border-orange-500/20" onAction={onAction} loadingId={loadingId} />
                                ) : (
                                    <ActionButton type="docker" action="start" target={p.name} icon={Plus} color="text-emerald-500 border-emerald-500/20" onAction={onAction} loadingId={loadingId} />
                                )}
                                <ActionButton type="docker" action="restart" target={p.name} icon={RefreshCw} color="text-cyan-400 border-cyan-500/20" onAction={onAction} loadingId={loadingId} />
                                <ActionButton type="docker" action="delete" target={p.name} icon={Trash2} color="text-rose-500 border-rose-500/20" onAction={onAction} loadingId={loadingId} />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </HealthSection>
);

export const ForeverTable: React.FC<{ data: any[], onAction: any, onFetchLogs: any, loadingId: any }> = ({ data, onAction, onFetchLogs, loadingId }) => (
    <HealthSection 
        title="Forever Processes" 
        icon={HardDrive} 
        color="text-amber-500"
        isEmpty={!data || data.length === 0}
        emptyMessage="No Forever processes detected"
    >
        <table className="w-full text-left font-mono text-[10px]">
            <TableHeader titles={['ID', 'UID', 'Port', 'Forever PID', 'PID', 'Command/Script', 'Uptime', 'Actions']} />
            <tbody>
                {data.map((p, idx) => (
                    <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors">
                        <td className="p-3 px-6 text-amber-500 font-bold">[{p.id}]</td>
                        <td className="p-3 px-6 text-white font-bold">{p.uid}</td>
                        <td className="p-3 px-6 text-emerald-400 font-bold">{p.port ? `:${p.port}` : '-'}</td>
                        <td className="p-3 px-6 text-muted/40">{p.forever_pid}</td>
                        <td className="p-3 px-6 text-muted/40">{p.pid}</td>
                        <td className="p-3 px-6 text-white/70 max-w-[200px] truncate" title={`${p.command} ${p.script}`}>
                            {p.command.split('/').pop()} {p.script}
                        </td>
                        <td className="p-3 px-6 text-muted text-[9px]">{p.uptime}</td>
                        <td className="p-3 px-6">
                            <div className="flex items-center gap-2">
                                <ActionButton type="forever" action="logs" target={p.id} icon={Terminal} color="text-amber-500 border-amber-500/20" onAction={onAction} onClick={() => onFetchLogs('forever', p.id, `Forever: ${p.uid || p.id}`)} loadingId={loadingId} />
                                <ActionButton type="forever" action="stop" target={p.id} icon={X} color="text-orange-500 border-orange-500/20" onAction={onAction} loadingId={loadingId} />
                                <ActionButton type="forever" action="restart" target={p.id} icon={RefreshCw} color="text-amber-400 border-amber-500/20" onAction={onAction} loadingId={loadingId} />
                                <ActionButton type="forever" action="delete" target={p.id} icon={Trash2} color="text-rose-500 border-rose-500/20" onAction={onAction} loadingId={loadingId} />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </HealthSection>
);

export const ServiceTable: React.FC<{ 
    title: string, icon: any, color: string, data: any[], columns: string[], type: string, onAction: any, onFetchLogs: any, loadingId: any 
}> = ({ 
    title, icon, color, data, columns, type, onAction, onFetchLogs, loadingId 
}) => (
    <HealthSection 
        title={title} 
        icon={icon} 
        color={color}
        isEmpty={!data || data.length === 0}
        emptyMessage={`No ${title} found`}
    >
        <table className="w-full text-left font-mono text-[10px]">
            <TableHeader titles={[...columns, 'Actions']} />
            <tbody>
                {data.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors">
                        {columns.map(col => {
                            const key = col.toLowerCase().replace(/ /g, '');
                            const val = item[key];
                            if (key === 'status') {
                                const isOnline = ['online', 'running', 'active', 'up'].some(s => val?.toLowerCase().includes(s));
                                return (
                                    <td key={col} className="p-3 px-6">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {val}
                                        </span>
                                    </td>
                                );
                            }
                            return <td key={col} className={`p-3 px-6 ${key === 'name' || key === 'service' ? 'font-bold text-white' : 'text-muted/60'}`}>{val}</td>;
                        })}
                        <td className="p-3 px-6 text-muted/60 lowercase flex items-center gap-2">
                            <ActionButton 
                                type={type} 
                                action="logs" 
                                target={item.id || item.name || item.service} 
                                icon={Terminal} 
                                color="text-amber-500 border-amber-500/20" 
                                onAction={onAction} 
                                onClick={() => onFetchLogs(type, item.id || item.name || item.service, `Logs: ${item.name || item.service}`)}
                                loadingId={loadingId} 
                            />
                            <div className="flex items-center gap-1">
                                <ActionButton 
                                    type={type} 
                                    action="stop" 
                                    target={item.id || item.name || item.service} 
                                    icon={X} 
                                    color="text-orange-500 border-orange-500/20" 
                                    onAction={onAction} 
                                    loadingId={loadingId} 
                                />
                                <ActionButton 
                                    type={type} 
                                    action="start" 
                                    target={item.id || item.name || item.service} 
                                    icon={Plus} 
                                    color="text-emerald-500 border-emerald-500/20" 
                                    onAction={onAction} 
                                    loadingId={loadingId} 
                                />
                                <ActionButton 
                                    type={type} 
                                    action="restart" 
                                    target={item.id || item.name || item.service} 
                                    icon={RefreshCw} 
                                    color="text-amber-400 border-amber-500/20" 
                                    onAction={onAction} 
                                    loadingId={loadingId} 
                                />
                                <ActionButton 
                                    type={type} 
                                    action="delete" 
                                    target={item.id || item.name || item.service} 
                                    icon={Trash2} 
                                    color="text-rose-500 border-rose-500/20" 
                                    onAction={onAction} 
                                    loadingId={loadingId} 
                                />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </HealthSection>
);

interface HealthDashboardProps {
    status: any;
    onAction: (type: string, action: string, target: string) => void;
    onFetchLogs: (type: string, target: string, title: string) => void;
    onRefresh: () => void;
    loadingId: string | null;
}

const HealthDashboard: React.FC<HealthDashboardProps> = ({ status, onAction, onFetchLogs, onRefresh, loadingId }) => {
    return (
        <div className="h-full overflow-y-auto pr-2 scrollbar-thin flex flex-col gap-10 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center justify-between glass p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <Cpu className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black font-mono uppercase tracking-[0.3em] text-white">Health Dashboard</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] font-mono text-muted uppercase tracking-widest">Real-time control center</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onRefresh}
                    className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition-all text-xs font-mono font-bold uppercase tracking-widest group"
                >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Refresh
                </button>
            </div>

            {status.ports && status.ports.length > 0 && (
                <PortTable ports={status.ports} onAction={onAction} loadingId={loadingId} />
            )}
            
            {status.pm2 && status.pm2.length > 0 && (
                <PM2Table data={status.pm2} onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}
            
            {status.docker && status.docker.length > 0 && (
                <DockerTable data={status.docker} onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}
            
            {status.forever && status.forever.length > 0 && (
                <ForeverTable data={status.forever} onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}

            {/* Other Process Managers */}
            {status.systemd && status.systemd.length > 0 && (
                <ServiceTable title="systemd Services" icon={Activity} color="text-amber-400" data={status.systemd} columns={['Name', 'Status', 'Description']} type="systemd" onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}
            
            {status.supervisor && status.supervisor.length > 0 && (
                <ServiceTable title="Supervisor Processes" icon={Database} color="text-indigo-400" data={status.supervisor} columns={['Name', 'Status', 'PID', 'Uptime']} type="supervisor" onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}
            
            {status.dockerCompose && status.dockerCompose.length > 0 && (
                <ServiceTable title="Docker Compose" icon={Layers} color="text-blue-400" data={status.dockerCompose} columns={['Service', 'Status', 'ID', 'Ports']} type="docker-compose" onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}
            
            {status.circus && status.circus.length > 0 && (
                <ServiceTable title="Circus Watchers" icon={RefreshCw} color="text-orange-400" data={status.circus} columns={['Name', 'Status']} type="circus" onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}
            
            {status.oxmgr && status.oxmgr.length > 0 && (
                <ServiceTable title="Oxmgr Monitoring" icon={Search} color="text-lime-400" data={status.oxmgr} columns={['ID', 'Name', 'Status', 'CPU', 'Mem']} type="oxmgr" onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}
            
            {status.strongPm && status.strongPm.length > 0 && (
                <ServiceTable title="Strong-PM" icon={Shield} color="text-red-400" data={status.strongPm} columns={['ID', 'Name', 'Status']} type="strong-pm" onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}
            
            {status.pmc && status.pmc.length > 0 && (
                <ServiceTable title="PMC Status" icon={Package} color="text-pink-400" data={status.pmc} columns={['ID', 'Name', 'Status']} type="pmc" onAction={onAction} onFetchLogs={onFetchLogs} loadingId={loadingId} />
            )}

            {/* OS Logs */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                    <Terminal className="w-4 h-4 text-rose-500" />
                    <h3 className="text-[11px] font-black font-mono uppercase tracking-widest text-rose-500">System Runtime Logs</h3>
                </div>
                <div className="glass border border-rose-500/20 rounded-3xl p-5 bg-black/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)]">
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                        <pre className="text-[10px] font-mono text-muted/80 leading-relaxed whitespace-pre-wrap">
                            {status.osLogs || "Waiting for system data..."}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthDashboard;
