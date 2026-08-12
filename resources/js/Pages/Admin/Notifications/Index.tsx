import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Bell, Car, Mail, Star, Banknote, Calendar, CheckCheck, Inbox, Trash2, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { categoryOf, CATEGORY_META, TYPE_FILTERS } from '@/lib/notifications';

interface NotificationItem {
    id: string;
    data: {
        type: string;
        title: string;
        message: string;
        icon?: string;
        action_url?: string;
    };
    read_at: string | null;
    created_at: string;
}

interface NotificationsIndexProps {
    notifications: {
        data: NotificationItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filter?: string;
    type?: string;
    stats: {
        total: number;
        unread: number;
    };
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    car: Car,
    mail: Mail,
    star: Star,
    banknote: Banknote,
    calendar: Calendar,
    bell: Bell,
};

const ICON_COLORS: Record<string, string> = {
    car: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
    mail: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    star: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    banknote: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    calendar: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
};

const FILTER_TABS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
];

type DayGroup = 'today' | 'yesterday' | 'week' | 'earlier';

const DAY_GROUP_LABELS: Record<DayGroup, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'This Week',
    earlier: 'Earlier',
};

function dayGroupOf(dateStr: string): DayGroup {
    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
    if (dayDiff <= 0) return 'today';
    if (dayDiff === 1) return 'yesterday';
    if (dayDiff < 7) return 'week';
    return 'earlier';
}

function groupByDay(items: NotificationItem[]): Array<{ group: DayGroup; items: NotificationItem[] }> {
    const map: Record<DayGroup, NotificationItem[]> = { today: [], yesterday: [], week: [], earlier: [] };
    for (const item of items) {
        map[dayGroupOf(item.created_at)].push(item);
    }
    return (Object.keys(DAY_GROUP_LABELS) as DayGroup[])
        .map((group) => ({ group, items: map[group] }))
        .filter((g) => g.items.length > 0);
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
}

export default function NotificationsIndex({ notifications, filter = 'all', type = 'all', stats }: NotificationsIndexProps) {
    const route = useRoute();
    const [deleting, setDeleting] = useState<NotificationItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const dayGroups = useMemo(() => groupByDay(notifications.data), [notifications.data]);

    const toggleSelected = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected((prev) => {
            if (prev.size === notifications.data.length) return new Set();
            return new Set(notifications.data.map((n) => n.id));
        });
    };

    const selectedCount = selected.size;
    const allSelected = notifications.data.length > 0 && selectedCount === notifications.data.length;

    const openNotification = (item: NotificationItem) => {
        if (selectedCount > 0) return;
        if (!item.read_at) {
            router.patch(route('admin.notifications.read', item.id), {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
        if (item.data.action_url) {
            router.visit(item.data.action_url);
        }
    };

    const markAsRead = (item: NotificationItem) => {
        if (!item.read_at) {
            router.patch(route('admin.notifications.read', item.id), {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const markAllAsRead = () => {
        if (stats.unread === 0) return;
        router.post(route('admin.notifications.read-all'), {}, {
            preserveScroll: true,
            onSuccess: () => setSelected(new Set()),
        });
    };

    const bulkMarkRead = () => {
        if (selectedCount === 0) return;
        router.post(route('admin.notifications.read-bulk'), { ids: [...selected] }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setSelected(new Set()),
        });
    };

    const bulkDelete = () => {
        if (selectedCount === 0) return;
        router.post(route('admin.notifications.delete-bulk'), { ids: [...selected] }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setSelected(new Set()),
        });
    };

    const readCount = stats.total - stats.unread;
    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Notifications" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Notifications' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Admin Center
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Notifications
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    Stay on top of new bookings, payments, messages and reviews.
                                </p>
                            </div>
                            {stats.unread > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all duration-200"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Total', value: stats.total, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600' },
                                { label: 'Unread', value: stats.unread, gradient: 'from-red-500/20 to-red-600/10', iconGradient: 'from-red-500 to-red-600' },
                                { label: 'Read', value: readCount, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600' },
                            ].map((stat) => (
                                <div key={stat.label} className="animate-fade-in-up">
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30 opacity-100`} />
                                        <div className="relative p-4 sm:p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg shadow-black/10 text-white relative z-10`}>
                                                        <Bell className="w-5 h-5" />
                                                    </div>
                                                    <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${stat.iconGradient} opacity-20 blur-md`} />
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
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">Notifications</span>
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100/70 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 w-fit">
                                    {FILTER_TABS.map((tab) => {
                                        const isActive = filter === tab.key;
                                        return (
                                            <Link key={tab.key}
                                                href={tab.key === 'all' ? route('admin.notifications.index', { type: type === 'all' ? undefined : type }) : route('admin.notifications.index', { filter: tab.key, type: type === 'all' ? undefined : type })}
                                                preserveState
                                                preserveScroll
                                                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-white dark:bg-brand-800 shadow-sm text-brand-700 dark:text-brand-300 ring-1 ring-surface-200 dark:ring-surface-700'
                                                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                                                }`}
                                            >
                                                {tab.label}
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100/70 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 w-fit">
                                    {TYPE_FILTERS.map((tab) => {
                                        const isActive = type === tab.key;
                                        return (
                                            <Link key={tab.key}
                                                href={tab.key === 'all' ? route('admin.notifications.index', { filter: filter === 'all' ? undefined : filter }) : route('admin.notifications.index', { filter: filter === 'all' ? undefined : filter, type: tab.key })}
                                                preserveState
                                                preserveScroll
                                                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-white dark:bg-brand-800 shadow-sm text-brand-700 dark:text-brand-300 ring-1 ring-surface-200 dark:ring-surface-700'
                                                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                                                }`}
                                            >
                                                {tab.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedCount > 0 && (
                                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-700/50 animate-fade-in-up">
                                    <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                                        {selectedCount} selected
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={bulkMarkRead}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-brand-800 text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-700/50 hover:bg-brand-100 dark:hover:bg-brand-800/70 transition-all duration-200"
                                        >
                                            <CheckCheck className="w-3.5 h-3.5" />
                                            Mark read
                                        </button>
                                        <button
                                            onClick={bulkDelete}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/25 transition-all duration-200"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setSelected(new Set())}
                                            className="px-3.5 py-2 text-xs font-semibold rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {notifications.data.length === 0 ? (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 p-12 sm:p-16 animate-fade-in-up">
                                    <div className="text-center max-w-sm mx-auto">
                                        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-5">
                                            <Inbox className="w-8 h-8 text-surface-400 dark:text-surface-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">No notifications</h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">
                                            {filter === 'all' && type === 'all' ? 'Notifications will appear here as bookings, payments and messages come in.' : 'No notifications in this filter.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-surface-100 dark:border-surface-700/40">
                                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-surface-500 dark:text-surface-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleAll}
                                                className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500"
                                            />
                                            Select all ({notifications.data.length})
                                        </label>
                                    </div>
                                    <div className="divide-y divide-surface-100 dark:divide-surface-700/40">
                                        {dayGroups.map(({ group, items: groupItems }) => (
                                            <div key={group}>
                                                <div className="px-5 pt-4 pb-1 flex items-center gap-2">
                                                    <ChevronDown className="w-3.5 h-3.5 text-surface-300 dark:text-surface-600" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                                                        {DAY_GROUP_LABELS[group]}
                                                    </span>
                                                    <span className="text-[10px] text-surface-300 dark:text-surface-600">{groupItems.length}</span>
                                                </div>
                                                {groupItems.map((item) => {
                                                    const Icon = ICON_MAP[item.data.icon ?? 'bell'] ?? Bell;
                                                    const iconColor = ICON_COLORS[item.data.icon ?? 'bell'] ?? ICON_COLORS.car;
                                                    const category = categoryOf(item.data.type);
                                                    const meta = CATEGORY_META[category];
                                                    const isSelected = selected.has(item.id);
                                                    return (
                                                        <div key={item.id} className={`group flex items-start gap-3 px-5 py-4 transition-colors duration-150 ${isSelected ? 'bg-brand-50/60 dark:bg-brand-900/40' : !item.read_at ? 'bg-brand-50/40 dark:bg-brand-900/30' : 'hover:bg-surface-50/50 dark:hover:bg-brand-900/20'}`}>
                                                            <label className="pt-1 shrink-0 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleSelected(item.id)}
                                                                    className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500"
                                                                />
                                                            </label>
                                                            <button
                                                                onClick={() => openNotification(item)}
                                                                className="flex items-start gap-4 flex-1 min-w-0 text-left"
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
                                                                    <Icon className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <p className={`text-sm font-bold truncate ${item.read_at ? 'text-surface-700 dark:text-surface-300' : 'text-surface-900 dark:text-white'}`}>
                                                                            {item.data.title}
                                                                        </p>
                                                                        <span className="text-[10px] text-surface-400 dark:text-surface-500 shrink-0 font-mono">{timeAgo(item.created_at)}</span>
                                                                    </div>
                                                                    <p className={`text-xs mt-1 ${item.read_at ? 'text-surface-400 dark:text-surface-500' : 'text-surface-500 dark:text-surface-400'}`}>
                                                                        {item.data.message}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-md ring-1 ${meta.chip}`}>
                                                                            {meta.label}
                                                                        </span>
                                                                        <span className="text-[10px] text-surface-400 dark:text-surface-500 font-mono">{formatDate(item.created_at)}</span>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                                                {!item.read_at && (
                                                                    <button
                                                                        onClick={() => markAsRead(item)}
                                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                                        title="Mark as read"
                                                                    >
                                                                        <CheckCheck className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                                {!item.read_at && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                                                                <button
                                                                    onClick={() => { setDeleting(item); setShowDeleteModal(true); }}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                                    title="Delete notification"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    {notifications.links && notifications.links.length > 3 && (
                                        <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-surface-100 dark:border-surface-700/40">
                                            {notifications.links.map((link) => {
                                                const label = link.label
                                                    .replace('&laquo;', '\u2039')
                                                    .replace('&raquo;', '\u203A')
                                                    .replace('&lsaquo;', '\u2039')
                                                    .replace('&rsaquo;', '\u203A');
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
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            {showDeleteModal && deleting && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-white dark:bg-brand-800 rounded-2xl shadow-2xl shadow-black/20 border border-surface-100 dark:border-surface-700/60 animate-fade-in-up overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="relative p-6 sm:p-7 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                                    <Trash2 className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">Delete Notification</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                                Are you sure you want to remove this notification?
                            </p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700/60 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-all duration-200">
                                    Cancel
                                </button>
                                <button onClick={() => {
                                    router.delete(route('admin.notifications.destroy', deleting.id), {
                                        onSuccess: () => setShowDeleteModal(false),
                                        preserveScroll: true,
                                    });
                                }}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
