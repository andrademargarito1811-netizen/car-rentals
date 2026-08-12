import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell, Car, Mail, Star, Banknote, Calendar, CheckCheck, Inbox, ArrowRight,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/Components/ui/popover';
import { categoryOf, CATEGORY_META } from '@/lib/notifications';

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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    car: Car,
    mail: Mail,
    star: Star,
    banknote: Banknote,
    calendar: Calendar,
    bell: Bell,
};

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

export default function NotificationBell({ collapsed = false }: { collapsed?: boolean }) {
    const { auth, unreadNotificationCount, latestNotifications } = usePage().props as {
        auth: { user: { role: string } | null };
        unreadNotificationCount?: number | null;
        latestNotifications?: NotificationItem[];
    };

    const unread = unreadNotificationCount ?? 0;
    const notifications = latestNotifications ?? [];
    const dayGroups = useMemo(() => groupByDay(notifications), [notifications]);

    const prevUnreadRef = useRef(unread);
    const prevNewestIdRef = useRef<string | undefined>(undefined);
    const [wiggling, setWiggling] = useState(false);
    const [newestId, setNewestId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (unread > prevUnreadRef.current) {
            setWiggling(true);
            const t = setTimeout(() => setWiggling(false), 800);
            return () => clearTimeout(t);
        }
    }, [unread]);

    useEffect(() => {
        prevUnreadRef.current = unread;
    }, [unread]);

    useEffect(() => {
        const newest = notifications[0]?.id;
        if (newest && newest !== prevNewestIdRef.current) {
            prevNewestIdRef.current = newest;
            setNewestId(newest);
            const t = setTimeout(() => setNewestId(undefined), 1500);
            return () => clearTimeout(t);
        }
    }, [notifications]);

    const markAsRead = (item: NotificationItem) => {
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

    const markAllAsRead = () => {
        if (unread === 0) return;
        router.post(route('admin.notifications.read-all'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const iconClasses = useMemo(() => [
        'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
        'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    ], []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    title="Notifications"
                    className={`relative flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-white transition-all duration-200 group ${
                        collapsed ? 'justify-center' : 'gap-3'
                    }`}
                >
                    <span className="relative shrink-0">
                        <Bell className={`w-5 h-5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors ${wiggling ? 'animate-notification-bell' : ''}`} />
                        {unread > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 text-[9px] font-bold rounded-full bg-red-500 text-white ring-2 ring-white dark:ring-brand-900">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </span>
                    <span className="truncate">{collapsed ? '' : 'Notifications'}</span>
                    {unread > 0 && (
                        <span className={`ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/30 ${collapsed ? 'hidden' : ''}`}>
                            {unread > 99 ? '99+' : unread}
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="right"
                align="start"
                sideOffset={8}
                className="w-[22rem] p-0 overflow-hidden rounded-2xl border-surface-200 dark:border-surface-700 bg-white dark:bg-brand-800 shadow-2xl shadow-black/10"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700 bg-surface-50/70 dark:bg-brand-900/30">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span className="text-sm font-bold text-surface-900 dark:text-white">Notifications</span>
                        {unread > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={markAllAsRead}
                        disabled={unread === 0}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                    </button>
                </div>

                <div className="max-h-[22rem] overflow-y-auto divide-y divide-surface-100 dark:divide-surface-700/50">
                    {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                            <Inbox className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                            <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">No notifications yet</p>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Updates will appear here.</p>
                        </div>
                    ) : (
                        dayGroups.map(({ group, items: groupItems }) => (
                            <div key={group}>
                                <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                                    {DAY_GROUP_LABELS[group]}
                                </div>
                                {groupItems.map((item, i) => {
                                    const Icon = ICON_MAP[item.data.icon ?? 'bell'] ?? Bell;
                                    const category = categoryOf(item.data.type);
                                    const meta = CATEGORY_META[category];
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => markAsRead(item)}
                                            className={`flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-brand-900/30 transition-colors duration-150 ${
                                                item.read_at ? '' : 'bg-brand-50/40 dark:bg-brand-900/20'
                                            } ${item.id === newestId ? 'animate-notification-arrive' : ''}`}
                                        >
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClasses[i % iconClasses.length]}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-xs font-semibold truncate ${item.read_at ? 'text-surface-700 dark:text-surface-300' : 'text-surface-900 dark:text-white'}`}>
                                                        {item.data.title}
                                                    </p>
                                                    {!item.read_at && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                                                </div>
                                                <p className={`text-xs mt-0.5 line-clamp-2 ${item.read_at ? 'text-surface-400 dark:text-surface-500' : 'text-surface-500 dark:text-surface-400'}`}>
                                                    {item.data.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-md ring-1 ${meta.chip}`}>
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-[10px] text-surface-400 dark:text-surface-500">{timeAgo(item.created_at)}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                <Link
                    href={route('admin.notifications.index')}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 border-t border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-brand-900/30 transition-colors"
                >
                    View all notifications
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </PopoverContent>
        </Popover>
    );
}
