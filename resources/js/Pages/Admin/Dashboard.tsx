import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface AdminDashboardProps {
    total_cars: number;
    available_cars: number;
    total_bookings: number;
    active_bookings: number;
    total_users: number;
    recent_bookings: Array<{
        id: number;
        start_date: string;
        end_date: string;
        total_amount: number;
        status: string;
        user: { name: string };
        car: { brand: string; model: string };
    }>;
    revenue: number;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        pending: 'badge-pending',
        confirmed: 'badge-confirmed',
        active: 'badge-active',
        completed: 'badge-completed',
        cancelled: 'badge-cancelled',
    };
    return map[status] || 'badge-completed';
}

function compactNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

export default function AdminDashboard({ total_cars, available_cars, total_bookings, active_bookings, total_users, revenue, recent_bookings }: AdminDashboardProps) {
    const route = useRoute();
    const { auth } = usePage().props as any;

    const statCards = [
        { label: 'Total Cars', value: total_cars, sub: `${compactNumber(available_cars)} available`, icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', gradient: 'from-brand-600/20 to-brand-800/10', iconBg: 'bg-gradient-to-br from-brand-500 to-brand-700', iconColor: 'text-white' },
        { label: 'Active Bookings', value: active_bookings, sub: `${compactNumber(total_bookings)} total`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', gradient: 'from-blue-500/20 to-blue-600/10', iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600', iconColor: 'text-white' },
        { label: 'Total Revenue', value: formatPrice(revenue), sub: `${compactNumber(total_bookings)} bookings`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-500/20 to-emerald-600/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', iconColor: 'text-white' },
        { label: 'Total Users', value: compactNumber(total_users), sub: 'Registered accounts', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', gradient: 'from-accent-400/20 to-accent-500/10', iconBg: 'bg-gradient-to-br from-accent-400 to-accent-600', iconColor: 'text-white' },
    ];

    const quickActions = [
        { href: route('admin.cars.index'), icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', label: 'Manage Cars', desc: 'Add, edit, or remove vehicles' },
        { href: route('admin.bookings.index'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Manage Bookings', desc: 'View and update reservations' },
        { href: route('admin.users.index'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', label: 'Manage Users', desc: 'Manage customer accounts' },
    ];

    return (
        <>
            <Head title="Admin Dashboard" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Dashboard' }]}
                header={
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="animate-fade-in-up">
                            <h1 className="text-3xl font-bold text-surface-900 tracking-tight">
                                Admin <span className="gradient-text">Dashboard</span>
                            </h1>
                            <p className="text-surface-500 mt-1.5 text-balance">Monitor your fleet, bookings, and business performance.</p>
                        </div>
                        <div className="flex items-center gap-3 animate-fade-in">
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {active_bookings} active
                            </span>
                        </div>
                    </div>
                }
            >
                <div className="py-8 sm:py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {statCards.map((stat, i) => (
                                <div key={stat.label} className={`card-hover animate-fade-in-up stagger-${i + 1}`}>
                                    <div className="relative p-6 overflow-hidden rounded-3xl">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60`} />
                                        <div className="relative flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center shadow-lg shadow-black/10`}>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-surface-500">{stat.label}</p>
                                                <p className="text-2xl font-bold text-surface-900 tracking-tight">{stat.value}</p>
                                                <p className="text-xs text-surface-400 mt-0.5">{stat.sub}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-8 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="card-shine animate-fade-in-up stagger-5">
                                    <div className="p-6 sm:p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-surface-900">Recent Bookings</h3>
                                            <Link href={route('admin.bookings.index')} className="text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors">
                                                View all &rarr;
                                            </Link>
                                        </div>
                                        {recent_bookings.length === 0 ? (
                                            <div className="text-center py-16">
                                                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
                                                    <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                                <p className="text-surface-500 font-medium mb-1">No bookings yet</p>
                                                <p className="text-sm text-surface-400">Bookings will appear here once customers start renting.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {recent_bookings.map((booking) => (
                                                    <Link key={booking.id} href={route('admin.bookings.show', booking.id)}
                                                        className="group flex items-center justify-between p-4 rounded-2xl bg-surface-50 hover:bg-white hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-surface-100">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20">
                                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                </svg>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-surface-900 text-sm truncate">{booking.car.brand} {booking.car.model}</p>
                                                                <p className="text-xs text-surface-500 mt-0.5">
                                                                    {booking.user.name} &middot; {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &mdash; {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 shrink-0 ml-4">
                                                            <p className="text-sm font-bold text-surface-900 hidden sm:block">{formatPrice(booking.total_amount)}</p>
                                                            <span className={statusBadge(booking.status)}>{booking.status}</span>
                                                            <svg className="w-4 h-4 text-surface-300 group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="card-shine animate-fade-in-up stagger-4">
                                    <div className="p-6 sm:p-7">
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-surface-900">Quick Overview</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                                                <span className="text-sm text-surface-600">Occupancy Rate</span>
                                                <span className="text-sm font-bold text-surface-900">
                                                    {total_cars > 0 ? Math.round((active_bookings / total_cars) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                                                <span className="text-sm text-surface-600">Avg per Booking</span>
                                                <span className="text-sm font-bold text-surface-900">
                                                    {total_bookings > 0 ? formatPrice(revenue / total_bookings) : formatPrice(0)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                                                <span className="text-sm text-surface-600">Available Fleet</span>
                                                <span className="text-sm font-bold text-surface-900">{available_cars} / {total_cars}</span>
                                            </div>
                                            <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full transition-all duration-500"
                                                    style={{ width: `${total_cars > 0 ? ((total_cars - available_cars) / total_cars) * 100 : 0}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-hover animate-fade-in-up stagger-5">
                                    <div className="p-6 sm:p-7">
                                        <h3 className="text-lg font-bold text-surface-900 mb-6">Quick Actions</h3>
                                        <div className="space-y-3">
                                            {quickActions.map((action) => (
                                                <Link key={action.label} href={action.href}
                                                    className="group flex items-center gap-4 p-4 rounded-2xl bg-surface-50 hover:bg-brand-800/5 hover:border-brand-800/20 transition-all duration-200 border border-transparent">
                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md shadow-brand-500/20 shrink-0">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-surface-900 text-sm group-hover:text-brand-800 transition-colors">{action.label}</p>
                                                        <p className="text-xs text-surface-500">{action.desc}</p>
                                                    </div>
                                                    <svg className="w-4 h-4 ml-auto text-surface-400 group-hover:text-brand-800 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
