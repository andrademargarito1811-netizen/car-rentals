import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { useBookingBroadcast } from '@/Hooks/useBookingBroadcast';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/Components/ui/card';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell,
} from 'recharts';
import {
    Car, CarFront, Users, User, CalendarCheck, Banknote,
    ArrowRight, TrendingUp, AlertTriangle, MessageSquare,
    Clock, MapPin, Sun, CalendarDays, Download,
    Gauge, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

interface AdminDashboardProps {
    period: string;
    total_cars: number;
    available_cars: number;
    available_for_rent: number;
    rented_cars: number;
    total_bookings: number;
    active_bookings: number;
    total_users: number;
    total_guests: number;
    recent_bookings: Array<{
        id: number;
        start_date: string;
        end_date: string;
        total_amount: number;
        status: string;
        user: { name: string } | null;
        guest: { first_name: string; last_name: string } | null;
        car: { brand: string; model: string };
    }>;
    revenue: number;
    revenue_trend: Array<{ month: string; revenue: number }>;
    booking_status_breakdown: Array<{ status: string; count: number }>;
    upcoming_pickups: Array<{
        id: number;
        start_date: string;
        pickup_time: string;
        user: { name: string } | null;
        guest: { first_name: string; last_name: string } | null;
        car: { brand: string; model: string };
        status: string;
    }>;
    upcoming_returns: Array<{
        id: number;
        end_date: string;
        return_time: string;
        user: { name: string } | null;
        guest: { first_name: string; last_name: string } | null;
        car: { brand: string; model: string };
        status: string;
    }>;
    top_rented_cars: Array<{
        id: number;
        brand: string;
        model: string;
        image_path: string | null;
        bookings_count: number;
        daily_rate: number;
    }>;
    revenue_by_location: Array<{ location: string; revenue: number }>;
    unread_messages: number;
    overdue_bookings: number;
    heatmap_data: Array<{ date: string; count: number }>;
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    active: '#10b981',
    completed: '#6b7280',
    cancelled: '#ef4444',
};

type Period = 'today' | '7d' | '30d' | '90d' | 'all';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

function compactNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
}

function getCustomerName(booking: { user: { name: string } | null; guest: { first_name: string; last_name: string } | null }): string {
    if (booking.user?.name) return booking.user.name;
    if (booking.guest) return `${booking.guest.first_name} ${booking.guest.last_name}`;
    return 'Guest';
}

const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'all', label: 'All Time' },
];

const PERIOD_LABELS: Record<Period, string> = {
    today: 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    all: 'All time',
};

export default function AdminDashboard({
    period: initialPeriod,
    total_cars, available_cars, available_for_rent, rented_cars,
    total_bookings, active_bookings, total_users, total_guests,
    revenue, recent_bookings, revenue_trend,
    booking_status_breakdown, upcoming_pickups, upcoming_returns,
    top_rented_cars, revenue_by_location,
    unread_messages, overdue_bookings, heatmap_data,
}: AdminDashboardProps) {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const [period, setPeriod] = useState<Period>(PERIODS.some(p => p.key === initialPeriod) ? initialPeriod as Period : '30d');

    useBookingBroadcast([
        'total_cars', 'available_cars', 'available_for_rent', 'rented_cars',
        'total_bookings', 'active_bookings', 'revenue', 'recent_bookings',
        'revenue_trend', 'booking_status_breakdown', 'upcoming_pickups',
        'upcoming_returns', 'top_rented_cars', 'revenue_by_location',
        'overdue_bookings', 'heatmap_data',
    ]);

    const changePeriod = (p: Period) => {
        if (p === period) return;
        router.get(route('admin.dashboard'), { period: p }, {
            preserveScroll: true,
        });
    };

    const hasAlerts = unread_messages > 0 || overdue_bookings > 0 || available_for_rent <= 3;

    const todayStr = new Date().toISOString().split('T')[0];
    const heatmapFull = useMemo(() => Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toISOString().split('T')[0];
        const found = heatmap_data.find(h => h.date?.startsWith(dateStr));
        return { date: dateStr, count: found?.count ?? 0 };
    }), [heatmap_data]);

    const maxHeat = Math.max(...heatmapFull.map(d => d.count), 1);

    const fleetUtilization = total_cars > 0 ? Math.round(((total_cars - available_cars) / total_cars) * 100) : 0;
    const occupancyRate = total_cars > 0 ? Math.round((active_bookings / total_cars) * 100) : 0;
    const avgPerBooking = total_bookings > 0 ? revenue / total_bookings : 0;

    const revenueChange = useMemo(() => {
        if (revenue_trend.length < 6) return null;
        const half = Math.floor(revenue_trend.length / 2);
        const firstHalf = revenue_trend.slice(0, half).reduce((s, r) => s + r.revenue, 0);
        const secondHalf = revenue_trend.slice(half).reduce((s, r) => s + r.revenue, 0);
        if (firstHalf === 0) return null;
        return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
    }, [revenue_trend]);

    const statCards = useMemo(() => [
        {
            label: 'Total Cars', value: total_cars, sub: `${available_cars} available`,
            icon: Car, href: route('admin.cars.index'),
            gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600',
            change: null,
        },
        {
            label: 'Currently Rented', value: rented_cars, sub: `${fleetUtilization}% fleet used`,
            icon: CarFront, href: route('admin.reservations.index'),
            gradient: 'from-orange-400/20 to-rose-500/10', iconGradient: 'from-orange-500 to-rose-600',
            change: null,
        },
        {
            label: 'Active Bookings', value: active_bookings, sub: `${total_bookings} total`,
            icon: CalendarCheck, href: route('admin.reservations.index'),
            gradient: 'from-emerald-400/20 to-emerald-500/10', iconGradient: 'from-emerald-500 to-emerald-600',
            change: null,
        },
        {
            label: 'Revenue', value: formatPrice(revenue), sub: `${formatPrice(avgPerBooking)} avg`,
            icon: Banknote, href: '#',
            gradient: 'from-violet-400/20 to-purple-500/10', iconGradient: 'from-violet-500 to-purple-600',
            change: revenueChange,
        },
        {
            label: 'Total Users', value: compactNumber(total_users), sub: `${compactNumber(total_guests)} guests`,
            icon: Users, href: route('admin.users.index'),
            gradient: 'from-sky-400/20 to-blue-500/10', iconGradient: 'from-sky-500 to-blue-600',
            change: null,
        },
        {
            label: 'Overdue Returns', value: overdue_bookings, sub: 'require attention',
            icon: Clock, href: '#',
            gradient: 'from-red-400/20 to-red-500/10', iconGradient: 'from-red-500 to-red-600',
            change: null,
        },
    ], [total_cars, available_cars, rented_cars, active_bookings, total_bookings,
        revenue, total_users, total_guests, overdue_bookings, fleetUtilization,
        avgPerBooking, revenueChange, route]);

    return (
        <>
            <Head title="Admin Dashboard" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Dashboard' }]}
                header={
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
                                    Welcome back,{' '}
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-400 via-accent-300 to-accent-500">
                                        {auth.user.name.split(' ')[0]}
                                    </span>
                                </h1>
                                <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm">
                                    Here's what's happening with your fleet.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center rounded-xl bg-white dark:bg-brand-800/60 border border-surface-200 dark:border-surface-700/50 p-0.5">
                                    {PERIODS.map((p) => (
                                        <button
                                            key={p.key}
                                            onClick={() => changePeriod(p.key)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                                period === p.key
                                                    ? 'bg-brand-600 text-white shadow-sm'
                                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <Link href={route('admin.dashboard.export')} target="_blank"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-brand-800/60 border border-surface-200 dark:border-surface-700/50 text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-brand-50 dark:hover:bg-brand-800/80 hover:border-brand-300 dark:hover:border-brand-700 transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Export</span>
                                </Link>
                            </div>
                        </div>

                        {hasAlerts && (
                            <div className="grid gap-3 sm:grid-cols-3">
                                {available_for_rent <= 3 && (
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
                                        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                            Only {available_for_rent} car{available_for_rent !== 1 ? 's' : ''} free to rent today
                                        </p>
                                    </div>
                                )}
                                {unread_messages > 0 && (
                                    <Link href={route('admin.contact-messages.index')}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 hover:shadow-sm transition-all"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-800/40 flex items-center justify-center shrink-0">
                                            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                            {unread_messages} unread message{unread_messages !== 1 ? 's' : ''}
                                        </p>
                                    </Link>
                                )}
                                {overdue_bookings > 0 && (
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30">
                                        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-800/40 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                                            {overdue_bookings} overdue return{overdue_bookings !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                }
            >
                <div className="px-6 lg:px-10 py-8 space-y-6">

                    {/* KPI Cards — Row 1: Primary Metrics */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                        {statCards.slice(0, 3).map((stat) => {
                            const StatIcon = stat.icon;
                            const content = (
                                <div className="group relative p-5 rounded-2xl bg-white dark:bg-brand-800/60 border border-surface-200 dark:border-surface-700/50 transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-20 opacity-50 rounded-2xl pointer-events-none`} />
                                    <div className="relative flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-md shadow-black/5 text-white shrink-0`}>
                                            <StatIcon className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">{stat.label}</p>
                                                {stat.change !== null && (
                                                    <span className={`flex items-center gap-0.5 text-xs font-bold ${
                                                        stat.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(stat.change)}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight mt-1">{stat.value}</p>
                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{stat.sub}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                            return stat.href && stat.href !== '#' ? (
                                <Link key={stat.label} href={stat.href}>{content}</Link>
                            ) : (
                                <div key={stat.label}>{content}</div>
                            );
                        })}
                    </div>

                    {/* KPI Cards — Row 2: Secondary Metrics */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                        {statCards.slice(3).map((stat) => {
                            const StatIcon = stat.icon;
                            const content = (
                                <div className="group relative p-4 rounded-2xl bg-white dark:bg-brand-800/60 border border-surface-200 dark:border-surface-700/50 transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-20 opacity-50 rounded-2xl pointer-events-none`} />
                                    <div className="relative flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-md shadow-black/5 text-white shrink-0`}>
                                            <StatIcon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{stat.label}</p>
                                                {stat.change !== null && (
                                                    <span className={`flex items-center gap-0.5 text-xs font-bold ${
                                                        stat.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(stat.change)}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">{stat.value}</p>
                                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.25">{stat.sub}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                            return stat.href && stat.href !== '#' ? (
                                <Link key={stat.label} href={stat.href}>{content}</Link>
                            ) : (
                                <div key={stat.label}>{content}</div>
                            );
                        })}
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                        <div>
                                            <CardTitle>Revenue Trend</CardTitle>
                                            <CardDescription>Monthly revenue</CardDescription>
                                        </div>
                                    </div>
                                    {revenueChange !== null && (
                                        <span className={`flex items-center gap-1 text-sm font-bold ${
                                            revenueChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                            {Math.abs(revenueChange)}% vs prior period
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenue_trend.length > 0 ? revenue_trend : [{ month: 'No data', revenue: 0 }]}>
                                            <defs>
                                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-surface-700/50" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} stroke="#9ca3af" width={50} />
                                            <Tooltip
                                                formatter={(value: any) => [formatPrice(Number(value) || 0), 'Revenue']}
                                                contentStyle={{
                                                    borderRadius: '12px', border: '1px solid #e5e7eb',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                    background: 'rgba(255,255,255,0.95)',
                                                }}
                                                labelStyle={{ fontWeight: 600 }}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#8b5cf6' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <Gauge className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                    <div>
                                        <CardTitle>Fleet at a Glance</CardTitle>
                                        <CardDescription>Occupancy & utilization</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-surface-500 dark:text-surface-400">Occupancy Rate</span>
                                        <span className="text-sm font-bold text-surface-900 dark:text-white">{occupancyRate}%</span>
                                    </div>
                                    <div className="w-full bg-surface-100 dark:bg-surface-700/50 rounded-full h-2.5 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-brand-500 to-accent-400 rounded-full transition-all duration-700" style={{ width: `${occupancyRate}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-surface-500 dark:text-surface-400">Fleet Utilized</span>
                                        <span className="text-sm font-bold text-surface-900 dark:text-white">{total_cars - available_cars}/{total_cars}</span>
                                    </div>
                                    <div className="w-full bg-surface-100 dark:bg-surface-700/50 rounded-full h-2.5 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-accent-400 to-brand-500 rounded-full transition-all duration-700" style={{ width: `${fleetUtilization}%` }} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50/50 dark:bg-brand-900/20 border border-brand-100/50 dark:border-brand-800/30">
                                    <div>
                                        <p className="text-xs text-surface-500 dark:text-surface-400">Avg per Booking</p>
                                        <p className="text-base font-bold text-surface-900 dark:text-white mt-0.5">{formatPrice(avgPerBooking)}</p>
                                    </div>
                                    <Banknote className="w-6 h-6 text-brand-500/40 dark:text-brand-400/30" />
                                </div>

                                {booking_status_breakdown.length > 0 && (
                                    <div className="pt-2 border-t border-surface-100 dark:border-surface-700/50">
                                        <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2">Booking Status</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {booking_status_breakdown.map((e) => {
                                                const total = booking_status_breakdown.reduce((s, x) => s + x.count, 0);
                                                const pct = total > 0 ? Math.round((e.count / total) * 100) : 0;
                                                return (
                                                    <span key={e.status}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                                                        style={{ backgroundColor: STATUS_COLORS[e.status] + '20', color: STATUS_COLORS[e.status] }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[e.status] }} />
                                                        {e.status} {pct}%
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Today's Schedule + Top Cars */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <CalendarDays className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                    <div>
                                        <CardTitle>Today's Schedule</CardTitle>
                                        <CardDescription>Pickups & returns</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">Pickups ({upcoming_pickups.length})</span>
                                        </div>
                                        {upcoming_pickups.length === 0 ? (
                                            <p className="text-xs text-surface-400 dark:text-surface-500 italic">No pickups today</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {upcoming_pickups.map((b) => (
                                                    <Link key={b.id} href={route('admin.bookings.show', b.id)}
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors group"
                                                    >
                                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                                                            <Car className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-surface-900 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                                                                {b.car.brand} {b.car.model}
                                                            </p>
                                                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                                                                {getCustomerName(b)} {b.pickup_time ? `@ ${b.pickup_time}` : ''}
                                                            </p>
                                                        </div>
                                                        <ArrowRight className="w-3.5 h-3.5 text-surface-300 dark:text-surface-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 shrink-0" />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">Returns ({upcoming_returns.length})</span>
                                        </div>
                                        {upcoming_returns.length === 0 ? (
                                            <p className="text-xs text-surface-400 dark:text-surface-500 italic">No returns today</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {upcoming_returns.map((b) => (
                                                    <Link key={b.id} href={route('admin.bookings.show', b.id)}
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors group"
                                                    >
                                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                                                            <Car className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-surface-900 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                                                                {b.car.brand} {b.car.model}
                                                            </p>
                                                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                                                                {getCustomerName(b)} {b.return_time ? `@ ${b.return_time}` : ''}
                                                            </p>
                                                        </div>
                                                        <ArrowRight className="w-3.5 h-3.5 text-surface-300 dark:text-surface-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 shrink-0" />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                    <div>
                                        <CardTitle>Top Cars</CardTitle>
                                        <CardDescription>{PERIOD_LABELS[period]}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {top_rented_cars.length === 0 ? (
                                    <p className="text-xs text-surface-400 dark:text-surface-500 text-center py-6 italic">No rental data for this period</p>
                                ) : (
                                    <div className="space-y-2">
                                        {top_rented_cars.map((car, i) => (
                                            <div key={car.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-700/30">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 flex items-center justify-center shrink-0 text-white text-[10px] font-bold">
                                                    {i + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-surface-900 dark:text-white truncate">{car.brand} {car.model}</p>
                                                    <p className="text-[10px] text-surface-500 dark:text-surface-400">{formatPrice(car.daily_rate)}/day</p>
                                                </div>
                                                <Badge variant="active">{car.bookings_count}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 pt-2.5 border-t border-surface-100 dark:border-surface-700/50">
                                    <Link href={route('admin.cars.index')}
                                        className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors flex items-center gap-1"
                                    >
                                        View all cars <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Bookings + Revenue by Location */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CalendarCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                    <div>
                                        <CardTitle>Recent Bookings</CardTitle>
                                        <CardDescription>Latest reservations</CardDescription>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" asChild className="text-xs">
                                    <Link href={route('admin.reservations.index')}>
                                        View all <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {recent_bookings.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CalendarCheck className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                                        <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">No bookings yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recent_bookings.slice(0, 6).map((booking) => (
                                            <Link key={booking.id} href={route('admin.bookings.show', booking.id)}
                                                className="group flex items-center justify-between p-3 rounded-xl bg-surface-50/80 dark:bg-surface-700/30 hover:bg-white dark:hover:bg-surface-700/60 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-brand-200/50 dark:hover:border-brand-700/30"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/20">
                                                        <Car className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-surface-900 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                                                            {booking.car.brand} {booking.car.model}
                                                        </p>
                                                        <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
                                                            {getCustomerName(booking)} &middot;{' '}
                                                            {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &mdash;{' '}
                                                            {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                                    <span className="text-xs font-bold text-surface-900 dark:text-white hidden sm:block">{formatPrice(booking.total_amount)}</span>
                                                    <Badge variant={booking.status as any}>{booking.status}</Badge>
                                                    <ArrowRight className="w-3.5 h-3.5 text-surface-300 dark:text-surface-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                    <div>
                                        <CardTitle>Revenue by Location</CardTitle>
                                        <CardDescription>Top locations</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {revenue_by_location.length === 0 ? (
                                    <p className="text-xs text-surface-400 dark:text-surface-500 text-center py-6 italic">No location data</p>
                                ) : (
                                    <div className="h-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={revenue_by_location} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200 dark:stroke-surface-700/50" horizontal={false} />
                                                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                                <YAxis type="category" dataKey="location" tick={{ fontSize: 10 }} stroke="#9ca3af" width={80} />
                                                <Tooltip
                                                    formatter={(value: any) => [formatPrice(Number(value) || 0), 'Revenue']}
                                                    contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                                                />
                                                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                                    {revenue_by_location.map((_, idx) => (
                                                        <Cell key={idx} fill={['#8b5cf6', '#7c3aed', '#a78bfa', '#6366f1', '#818cf8'][idx % 5]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Activity Heatmap */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <Sun className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                <div>
                                    <CardTitle>Booking Activity</CardTitle>
                                    <CardDescription>Last 30 days — darker means busier</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1">
                                {heatmapFull.map((d) => {
                                    const day = new Date(d.date).getDay();
                                    const isWeekend = day === 0 || day === 6;
                                    const pct = maxHeat > 0 ? d.count / maxHeat : 0;
                                    const bg = d.count === 0
                                        ? 'bg-surface-100 dark:bg-surface-800/50'
                                        : pct <= 0.25
                                            ? 'bg-brand-200 dark:bg-brand-800'
                                            : pct <= 0.5
                                                ? 'bg-brand-300 dark:bg-brand-700'
                                                : pct <= 0.75
                                                    ? 'bg-brand-500 dark:bg-brand-600'
                                                    : 'bg-brand-700 dark:bg-brand-500';
                                    return (
                                        <div
                                            key={d.date}
                                            className={`w-7 h-7 rounded ${bg} flex items-center justify-center text-[9px] font-semibold cursor-default transition-transform hover:scale-110 ${
                                                d.count > 0 ? 'text-white' : 'text-surface-400 dark:text-surface-600'
                                            } ${isWeekend ? 'ring-1 ring-surface-200 dark:ring-surface-700/50' : ''}`}
                                            title={`${new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.count} booking${d.count !== 1 ? 's' : ''}`}
                                        >
                                            {d.count > 0 ? d.count : ''}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2 text-[10px] text-surface-400 dark:text-surface-500">
                                    <span>Less</span>
                                    <div className="flex gap-0.5">
                                        <div className="w-3.5 h-3.5 rounded bg-surface-100 dark:bg-surface-800/50" />
                                        <div className="w-3.5 h-3.5 rounded bg-brand-200 dark:bg-brand-800" />
                                        <div className="w-3.5 h-3.5 rounded bg-brand-300 dark:bg-brand-700" />
                                        <div className="w-3.5 h-3.5 rounded bg-brand-500 dark:bg-brand-600" />
                                        <div className="w-3.5 h-3.5 rounded bg-brand-700 dark:bg-brand-500" />
                                    </div>
                                    <span>More</span>
                                </div>
                                <span className="text-[10px] text-surface-400 dark:text-surface-500">
                                    Max: {maxHeat} booking{maxHeat !== 1 ? 's' : ''} in a day
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </AuthenticatedLayout>
        </>
    );
}
