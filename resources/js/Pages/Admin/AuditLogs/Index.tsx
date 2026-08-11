import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';

interface AuditLog {
    id: number;
    user: { id: number; name: string; email: string } | null;
    action: string;
    model_type: string | null;
    model_id: string | number | null;
    description: string | null;
    ip_address: string | null;
    user_agent: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
}

interface AuditLogsIndexProps {
    logs: {
        data: AuditLog[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string | null;
        action: string | null;
        model_type: string | null;
        user_id: string | null;
        date_from: string | null;
        date_to: string | null;
    };
    availableActions: string[];
    availableModelTypes: string[];
    users: Array<{ id: number; name: string }>;
    stats: {
        total: number;
        today: number;
        users_count: number;
    };
}

const ACTION_STYLES: Record<string, string> = {
    booking_created: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    booking_modified: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
    booking_rescheduled: 'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400',
    booking_cancelled: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',
    booking_status_updated: 'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400',
    status_updated: 'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400',
    payment_recorded: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    payment_updated: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
    extra_charges_applied: 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
    car_created: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    car_updated: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
    car_deleted: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',
    user_created: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    user_updated: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
    user_deleted: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',
    review_approved: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    review_rejected: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',
    review_deleted: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',
    unauthorized_access: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',
};

function humanizeAction(action: string): string {
    if (/^(GET|POST|PUT|PATCH|DELETE)\s/.test(action)) {
        return action;
    }
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function actionBadge(action: string) {
    const cls = ACTION_STYLES[action.toLowerCase()] || 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${cls}`}>
            {humanizeAction(action)}
        </span>
    );
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AuditLogsIndex({ logs, filters, availableActions, availableModelTypes, users, stats }: AuditLogsIndexProps) {
    const route = useRoute();
    const [search, setSearch] = useState(filters?.search || '');
    const [viewing, setViewing] = useState<AuditLog | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get(route('admin.audit-logs.index'), {
                search,
                action: filters?.action || '',
                model_type: filters?.model_type || '',
                user_id: filters?.user_id || '',
                date_from: filters?.date_from || '',
                date_to: filters?.date_to || '',
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    function applyFilter(key: string, value: string) {
        router.get(route('admin.audit-logs.index'), {
            search,
            action: key === 'action' ? value : (filters?.action || ''),
            model_type: key === 'model_type' ? value : (filters?.model_type || ''),
            user_id: key === 'user_id' ? value : (filters?.user_id || ''),
            date_from: key === 'date_from' ? value : (filters?.date_from || ''),
            date_to: key === 'date_to' ? value : (filters?.date_to || ''),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    const hasActiveFilters = filters?.search || filters?.action || filters?.model_type || filters?.user_id || filters?.date_from || filters?.date_to;
    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    function renderValues(label: string, values: Record<string, unknown> | null) {
        if (!values) return null;
        const entries = Object.entries(values).filter(([, v]) => v !== null && v !== '' && typeof v !== 'object');
        if (entries.length === 0) return null;
        return (
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">{label}</p>
                <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 overflow-hidden">
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-700/40">
                            {entries.map(([key, value]) => (
                                <tr key={key}>
                                    <td className="px-4 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 w-2/5 align-top capitalize">{key.replace(/_/g, ' ')}</td>
                                    <td className="px-4 py-2 text-xs text-surface-800 dark:text-surface-200 break-words">{String(value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title="Audit Logs" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Audit Logs' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Activity
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Audit Logs
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    Track every action taken across the admin panel.
                                </p>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Total Entries', value: stats.total, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Today', value: stats.today, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
                                { label: 'Active Users', value: stats.users_count, gradient: 'from-blue-500/20 to-blue-600/10', iconGradient: 'from-blue-500 to-blue-600', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0' },
                            ].map((stat) => (
                                <div key={stat.label} className="animate-fade-in-up">
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30 opacity-100`} />
                                        <div className="relative p-4 sm:p-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg shadow-black/10 text-white`}>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{stat.label}</p>
                                                    <p className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">{stat.value}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">Activity Log</span>
                                {hasActiveFilters && <span className="text-[11px] text-surface-400 dark:text-surface-500">({logs.data.length} result{logs.data.length !== 1 ? 's' : ''})</span>}
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search actions, IP, description..."
                                        className="w-64 h-9 pl-9 pr-3 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200" />
                                    {search && (
                                        <button onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={filters?.action || ''}
                                    onChange={e => applyFilter('action', e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 px-3 min-w-[150px]">
                                    <option value="">All Actions</option>
                                    {availableActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                                </select>
                                <select
                                    value={filters?.model_type || ''}
                                    onChange={e => applyFilter('model_type', e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 px-3 min-w-[140px]">
                                    <option value="">All Models</option>
                                    {availableModelTypes.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select
                                    value={filters?.user_id || ''}
                                    onChange={e => applyFilter('user_id', e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 px-3 min-w-[140px]">
                                    <option value="">All Users</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <input
                                    type="date"
                                    value={filters?.date_from || ''}
                                    onChange={e => applyFilter('date_from', e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 px-3"
                                />
                                <span className="text-xs text-surface-400 dark:text-surface-500">to</span>
                                <input
                                    type="date"
                                    value={filters?.date_to || ''}
                                    onChange={e => applyFilter('date_to', e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 px-3"
                                />
                                {hasActiveFilters && (
                                    <Link href={route('admin.audit-logs.index')}
                                        className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800/60 transition-all duration-200">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear
                                    </Link>
                                )}
                            </div>

                            <div className="animate-fade-in-up rounded-xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">User</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Action</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Model</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Description</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">IP Address</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Date</th>
                                                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-20 text-center">
                                                        <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-7 h-7 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-surface-500 dark:text-surface-400 font-medium">No audit logs found</p>
                                                        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Try adjusting your search or filter criteria.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                logs.data.map((log) => (
                                                    <tr key={log.id}
                                                        className="group relative transition-all duration-200 hover:bg-gradient-to-r hover:from-brand-500/[0.04] hover:to-transparent dark:hover:from-brand-400/[0.06] dark:hover:to-transparent border-b border-surface-100/80 dark:border-surface-700/30 last:border-b-0">
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                                                                    {(log.user?.name || 'S').charAt(0).toUpperCase()}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-surface-900 dark:text-white text-sm truncate max-w-[140px]">{log.user?.name || 'System'}</p>
                                                                    {log.user?.email && <p className="text-xs text-surface-500 dark:text-surface-400 truncate max-w-[180px]">{log.user.email}</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">{actionBadge(log.action)}</td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-surface-700 dark:text-surface-300 font-medium">{log.model_type || '—'}</span>
                                                                {log.model_id !== null && log.model_id !== undefined && (
                                                                    <span className="text-xs text-surface-400 dark:text-surface-500 font-mono">#{log.model_id}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 max-w-xs">
                                                            <p className="text-sm text-surface-600 dark:text-surface-400 truncate">{log.description || '—'}</p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-mono text-surface-500 dark:text-surface-400">{log.ip_address || '—'}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs text-surface-500 dark:text-surface-400 font-mono whitespace-nowrap">{formatDate(log.created_at)}</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <button
                                                                onClick={() => { setViewing(log); setShowPanel(true); }}
                                                                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-surface-400 dark:text-surface-500 bg-transparent hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-400 hover:shadow-sm hover:ring-1 hover:ring-brand-200/50 transition-all duration-200"
                                                                title="View details">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {logs.links && logs.links.length > 3 && (
                                    <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-700/50 bg-surface-50/30 dark:bg-surface-800/20">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {logs.links.map((link) => {
                                                const label = link.label
                                                    .replace('&laquo;', '‹')
                                                    .replace('&raquo;', '›')
                                                    .replace('&lsaquo;', '‹')
                                                    .replace('&rsaquo;', '›');
                                                return (
                                                    <Link key={link.label}
                                                        href={link.url || '#'}
                                                        preserveState
                                                        preserveScroll
                                                        className={`inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                            link.active
                                                                ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/20 ring-1 ring-brand-500/30'
                                                                : 'text-surface-600 dark:text-surface-300 bg-white dark:bg-brand-800/60 hover:bg-surface-100 dark:hover:bg-surface-700/60 hover:text-surface-900 dark:hover:text-white hover:shadow-sm ring-1 ring-surface-200 dark:ring-surface-600/30'
                                                        } ${!link.url ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                                                        dangerouslySetInnerHTML={{ __html: label }} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            <SlidePanel
                show={showPanel}
                onClose={() => setShowPanel(false)}
                title="Audit Log Detail"
            >
                {viewing && (
                    <div className="space-y-6">
                        <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                        {(viewing.user?.name || 'S').charAt(0).toUpperCase()}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-surface-900 dark:text-white">{viewing.user?.name || 'System'}</p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400">{viewing.user?.email || 'Automated / guest action'}</p>
                                    </div>
                                </div>
                                {actionBadge(viewing.action)}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Model</p>
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{viewing.model_type || '—'}{viewing.model_id !== null && viewing.model_id !== undefined ? ` #${viewing.model_id}` : ''}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Date</p>
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{formatDate(viewing.created_at)}</p>
                                </div>
                            </div>
                            {viewing.ip_address && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">IP Address</p>
                                    <p className="text-sm font-mono text-surface-900 dark:text-white">{viewing.ip_address}</p>
                                </div>
                            )}
                        </div>

                        {viewing.description && (
                            <div>
                                <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">Description</p>
                                <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5">
                                    <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">{viewing.description}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-5">
                            {renderValues('Changes', viewing.new_values)}
                            {renderValues('Previous Values', viewing.old_values)}
                        </div>

                        {viewing.user_agent && (
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">User Agent</p>
                                <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-4">
                                    <p className="text-xs text-surface-500 dark:text-surface-400 break-words font-mono">{viewing.user_agent}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </SlidePanel>
        </>
    );
}
