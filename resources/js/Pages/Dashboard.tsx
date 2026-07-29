import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

interface DashboardProps {
    recentBookings: Array<{
        id: number;
        start_date: string;
        end_date: string;
        total_amount: number;
        status: string;
        car: { brand: string; model: string };
    }>;
    stats: {
        total_bookings: number;
        active_bookings: number;
    };
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

const statusIcons: Record<string, string> = {
    pending: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    confirmed: 'M5 13l4 4L19 7',
    active: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
    completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    cancelled: 'M6 18L18 6M6 6l12 12',
};

export default function Dashboard({ recentBookings, stats }: DashboardProps) {
    const { auth } = usePage().props as any;
    const totalSpent = recentBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const upcomingCount = recentBookings.filter(b => b.status === 'confirmed').length;
    const activeBooking = recentBookings.find(b => b.status === 'active' || b.status === 'confirmed');

    const statCards = [
        { label: 'Total Bookings', value: stats.total_bookings, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', gradient: 'from-brand-600/20 to-brand-800/10', iconBg: 'bg-gradient-to-br from-brand-500 to-brand-700', iconColor: 'text-white' },
        { label: 'Active Bookings', value: stats.active_bookings, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', gradient: 'from-emerald-500/20 to-emerald-600/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', iconColor: 'text-white' },
        { label: 'Total Spent', value: formatPrice(totalSpent), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-accent-400/20 to-accent-500/10', iconBg: 'bg-gradient-to-br from-accent-400 to-accent-600', iconColor: 'text-white' },
        { label: 'Upcoming', value: upcomingCount, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', gradient: 'from-blue-500/20 to-blue-600/10', iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600', iconColor: 'text-white' },
    ];

    const quickActions = [
        { href: route('cars.index'), icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', label: 'Browse Cars', desc: 'Explore our fleet' },
        { href: route('bookings.index'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'My Bookings', desc: 'View reservation history' },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <AuthenticatedLayout
                header={
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="animate-fade-in-up">
                            <h1 className="text-3xl font-bold text-surface-900 tracking-tight">
                                Welcome back, <span className="gradient-text">{auth?.user?.name}</span>
                            </h1>
                            <p className="text-surface-500 mt-1.5 text-balance">Manage your rentals, track bookings, and hit the road.</p>
                        </div>
                        <Link href={route('cars.index')} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 rounded-xl transition-all duration-200 animate-fade-in">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Book a Car
                        </Link>
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
                                            {recentBookings.length > 0 && (
                                                <Link href={route('bookings.index')} className="text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors">
                                                    View all &rarr;
                                                </Link>
                                            )}
                                        </div>
                                        {recentBookings.length === 0 ? (
                                            <div className="text-center py-16">
                                                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
                                                    <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                    </svg>
                                                </div>
                                                <p className="text-surface-500 font-medium mb-1">No bookings yet</p>
                                                <p className="text-sm text-surface-400 mb-6">Start your journey by browsing our fleet.</p>
                                                <Link href={route('cars.index')} className="btn-primary !text-sm !px-5 !py-2.5">
                                                    Browse Cars
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {recentBookings.map((booking) => (
                                                    <Link key={booking.id} href={route('bookings.show', booking.id)}
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
                                                                    {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &mdash; {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                                {activeBooking && (
                                    <div className="animate-fade-in-up stagger-4">
                                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 p-[1px] shadow-lg shadow-accent-500/20">
                                            <div className="rounded-3xl bg-white p-6 sm:p-7">
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <span className="relative flex w-3 h-3">
                                                        <span className="absolute inline-flex w-full h-full rounded-full bg-accent-400 opacity-75 animate-ping" />
                                                        <span className="relative inline-flex w-3 h-3 rounded-full bg-accent-500" />
                                                    </span>
                                                    <span className="text-xs font-bold text-accent-600 uppercase tracking-widest">Active Booking</span>
                                                </div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md">
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-surface-900">{activeBooking.car.brand} {activeBooking.car.model}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-surface-500 mb-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>{new Date(activeBooking.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &mdash; {new Date(activeBooking.end_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <p className="text-2xl font-bold text-surface-900 mt-3">{formatPrice(activeBooking.total_amount)}</p>
                                                <Link href={route('bookings.show', activeBooking.id)}
                                                    className="mt-5 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold rounded-xl shadow-md hover:shadow-lg hover:from-accent-300 hover:to-accent-400 transition-all duration-200 text-sm">
                                                    View Details
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
