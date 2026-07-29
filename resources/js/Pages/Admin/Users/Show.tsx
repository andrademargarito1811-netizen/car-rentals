import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    phone: string | null;
    address: string | null;
    created_at: string;
}

interface BookingData {
    id: number;
    reference_code: string;
    start_date: string;
    end_date: string;
    status: string;
    total_amount: number;
    car: { id: number; brand: string; model: string } | null;
}

interface AuditLogData {
    id: number;
    action: string;
    description: string;
    old_values: Record<string, string> | null;
    new_values: Record<string, string> | null;
    created_at: string;
}

interface AdminUsersShowProps {
    user: UserData;
    bookings: BookingData[];
    auditLogs: AuditLogData[];
    stats: {
        total_bookings: number;
        active_bookings: number;
        total_spent: number;
    };
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        active: 'badge-active',
        suspended: 'badge-cancelled',
        pending: 'badge-pending',
        confirmed: 'badge-confirmed',
        completed: 'badge-completed',
        cancelled: 'badge-cancelled',
    };
    return map[status] || 'badge-completed';
}

export default function AdminUsersShow({ user, bookings, auditLogs, stats }: AdminUsersShowProps) {
    const route = useRoute();

    return (
        <>
            <Head title={user.name} />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Users', href: 'admin.users.index' }, { label: 'User Details' }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative">
                            <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Account Management
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1">
                                {user.name}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-white/60 text-sm">{user.email}</span>
                                <span className={statusBadge(user.role)}>{user.role}</span>
                                <span className={statusBadge(user.status)}>{user.status}</span>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        {/* Back link */}
                        <Link href={route('admin.users.index')}
                            className="inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Accounts
                        </Link>

                        {/* Stats */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Total Bookings', value: stats.total_bookings, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600' },
                                { label: 'Active Bookings', value: stats.active_bookings, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600' },
                                { label: 'Total Spent', value: `$${Number(stats.total_spent).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, gradient: 'from-blue-500/20 to-blue-600/10', iconGradient: 'from-blue-500 to-blue-600' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30 opacity-100`} />
                                        <div className="relative p-4 sm:p-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg shadow-black/10 text-white`}>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
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

                        {/* Profile + Bookings grid */}
                        <div className="grid gap-8 lg:grid-cols-3">

                            {/* Profile card */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="card p-6 sm:p-7">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Profile Details</h3>
                                            <p className="text-xs text-surface-500 dark:text-surface-400">Account information</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Name</span>
                                            <p className="text-sm font-medium text-surface-900 dark:text-white mt-0.5">{user.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Email</span>
                                            <p className="text-sm font-medium text-surface-900 dark:text-white mt-0.5">{user.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Phone</span>
                                            <p className="text-sm font-medium text-surface-900 dark:text-white mt-0.5">{user.phone || '\u2014'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Address</span>
                                            <p className="text-sm font-medium text-surface-900 dark:text-white mt-0.5">{user.address || '\u2014'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Role</span>
                                            <p className="mt-0.5"><span className={statusBadge(user.role)}>{user.role}</span></p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Status</span>
                                            <p className="mt-0.5"><span className={statusBadge(user.status)}>{user.status}</span></p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Member Since</span>
                                            <p className="text-sm font-medium text-surface-900 dark:text-white mt-0.5">
                                                {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-5 border-t border-surface-100 dark:border-surface-700/40">
                                        <Link href={route('admin.users.edit', user.id)}
                                            className="btn-primary w-full justify-center text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                            Edit Account
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Bookings + Audit Log */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Recent Bookings */}
                                <div className="card p-6 sm:p-7">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Recent Bookings</h3>
                                            <p className="text-xs text-surface-500 dark:text-surface-400">Last 10 bookings</p>
                                        </div>
                                    </div>

                                    {bookings.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-surface-500 dark:text-surface-400 text-sm">No bookings yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {bookings.map((booking) => (
                                                <div key={booking.id}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-surface-900 dark:text-white text-sm font-mono">{booking.reference_code}</span>
                                                            <span className={statusBadge(booking.status)}>{booking.status}</span>
                                                        </div>
                                                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                                            {booking.car ? `${booking.car.brand} ${booking.car.model}` : 'Unknown car'}
                                                            {' \u00B7 '}
                                                            {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            {' - '}
                                                            {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0 ml-4 text-right">
                                                        <p className="text-sm font-bold text-surface-900 dark:text-white">
                                                            ${Number(booking.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Audit Log */}
                                <div className="card p-6 sm:p-7">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                                            <svg className="w-5 h-5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Activity Log</h3>
                                            <p className="text-xs text-surface-500 dark:text-surface-400">Recent account activity</p>
                                        </div>
                                    </div>

                                    {auditLogs.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-surface-500 dark:text-surface-400 text-sm">No activity recorded.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {auditLogs.map((log) => (
                                                <div key={log.id}
                                                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                                                    <div className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="w-3 h-3 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-surface-900 dark:text-white capitalize">
                                                            {log.description}
                                                        </p>
                                                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{log.created_at}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
