import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { useBookingBroadcast } from '@/Hooks/useBookingBroadcast';

interface Reservation {
    id: number;
    reference_code: string | null;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    user: { id: number; name: string } | null;
    guest: { guest_id: number; first_name: string; last_name: string } | null;
    car: { id: number; brand: string; model: string; license_plate: string };
    created_at: string;
}

interface ReservationsIndexProps {
    bookings: {
        data: Reservation[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters?: {
        status?: string;
        search?: string | null;
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

function getCustomerName(b: Reservation): string {
    return b.user?.name ?? (b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : 'Guest');
}

function getInitials(b: Reservation): string {
    const name = getCustomerName(b);
    if (name === 'Guest') return 'G';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ReservationsIndex({ bookings, filters }: ReservationsIndexProps) {
    useBookingBroadcast();
    const route = useRoute();
    const [search, setSearch] = useState(filters?.search || '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get(route('admin.reservations.index'), {
                status: filters?.status || '',
                search,
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    function updateFilter(status: string) {
        router.get(route('admin.reservations.index'), { status, search }, { preserveState: true, preserveScroll: true });
    }

    const filterBtns = ['', 'pending', 'confirmed', 'active', 'completed', 'cancelled'];
    const filterLabels = ['All', 'Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'];

    const statusCounts = {
        total: bookings.data.length,
        pending: bookings.data.filter((b) => b.status === 'pending').length,
        active: bookings.data.filter((b) => b.status === 'active' || b.status === 'confirmed').length,
        completed: bookings.data.filter((b) => b.status === 'completed').length,
        cancelled: bookings.data.filter((b) => b.status === 'cancelled').length,
    };

    return (
        <>
            <Head title="Reservations" />
            <AuthenticatedLayout
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Booking Management
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Reservations
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    View and manage all customer reservations and bookings.
                                </p>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        {/* Stats bar */}
                        <div className="grid gap-4 sm:grid-cols-5">
                            {[
                                { label: 'Total Reservations', value: statusCounts.total, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                { label: 'Pending', value: statusCounts.pending, gradient: 'from-accent-400/20 to-accent-500/10', iconGradient: 'from-accent-400 to-accent-500', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
                                { label: 'Active', value: statusCounts.active, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M5 13l4 4L19 7' },
                                { label: 'Completed', value: statusCounts.completed, gradient: 'from-blue-500/20 to-blue-600/10', iconGradient: 'from-blue-500 to-blue-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Cancelled', value: statusCounts.cancelled, gradient: 'from-red-500/20 to-red-600/10', iconGradient: 'from-red-500 to-red-600', icon: 'M6 18L18 6M6 6l12 12' },
                            ].map((stat, i) => (
                                <div key={stat.label} className={`animate-fade-in-up stagger-${i + 1}`}>
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30 opacity-100`} />
                                        <div className="relative p-4 sm:p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg shadow-black/10 text-white relative z-10`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                                        </svg>
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

                        {/* Reservations table */}
                        <div className="space-y-5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {filterBtns.map((status, i) => (
                                        <button key={status} onClick={() => updateFilter(status)}
                                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                (!filters?.status && !status) || filters?.status === status
                                                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 ring-1 ring-brand-500/30'
                                                    : 'text-surface-600 dark:text-surface-300 bg-white dark:bg-brand-800/60 hover:bg-surface-100 dark:hover:bg-surface-700/60 hover:text-surface-900 dark:hover:text-white ring-1 ring-surface-200 dark:ring-surface-600/30'
                                            }`}>
                                            {filterLabels[i]}
                                        </button>
                                    ))}
                                </div>
                                <span className="hidden sm:block flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                                <div className="relative w-full sm:w-60">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search name, car, reference..."
                                        className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200" />
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

                            <div className="animate-fade-in-up rounded-xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Reference</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Customer</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Vehicle</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Dates</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Amount</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Status</th>
                                                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-20 text-center">
                                                        <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-7 h-7 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-surface-500 dark:text-surface-400 font-medium">No reservations found</p>
                                                        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">No bookings match your search criteria.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                bookings.data.map((booking, i) => (
                                                    <tr key={booking.id}
                                                        className="group relative transition-all duration-200 hover:bg-gradient-to-r hover:from-brand-500/[0.04] hover:to-transparent dark:hover:from-brand-400/[0.06] dark:hover:to-transparent border-b border-surface-100/80 dark:border-surface-700/30 last:border-b-0">

                                                        {/* Reference */}
                                                        <td className="px-5 py-4 relative">
                                                            <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-brand-500 dark:bg-brand-400 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-y-0 group-hover:scale-y-100 origin-top" />
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-sm shrink-0">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                    </svg>
                                                                </div>
                                                                <span className="font-semibold text-sm text-surface-900 dark:text-white font-mono">
                                                                    {booking.reference_code ?? `#${booking.id}`}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Customer */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center text-xs font-bold text-surface-600 dark:text-surface-300 shrink-0">
                                                                    {getInitials(booking)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate max-w-[160px]">
                                                                        {getCustomerName(booking)}
                                                                    </p>
                                                                    <p className="text-[10px] text-surface-400 dark:text-surface-500">
                                                                        {booking.user ? 'Registered' : 'Guest'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Vehicle */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                    </svg>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate max-w-[140px]">
                                                                        {booking.car?.brand ?? '—'} {booking.car?.model ?? ''}
                                                                    </p>
                                                                    <p className="text-[10px] font-mono text-surface-400 dark:text-surface-500">
                                                                        {booking.car?.license_plate ?? '—'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Dates */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs text-surface-600 dark:text-surface-300">
                                                                    {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    <span className="text-surface-300 dark:text-surface-600 mx-1">&mdash;</span>
                                                                    {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                                <span className="text-[10px] text-surface-400 dark:text-surface-500">
                                                                    {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))} day(s)
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Amount */}
                                                        <td className="px-5 py-4">
                                                            <div className="leading-none">
                                                                <div className="text-sm font-bold text-surface-900 dark:text-white tracking-tight">
                                                                    {formatPrice(booking.total_amount)}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-5 py-4">
                                                            <span className={statusBadge(booking.status)}>
                                                                {booking.status}
                                                            </span>
                                                        </td>

                                                        {/* Action */}
                                                        <td className="px-5 py-4 text-center">
                                                            <Link href={route('admin.bookings.show', booking.id)}
                                                                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-surface-400 dark:text-surface-500 bg-transparent hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-400 hover:shadow-sm hover:shadow-brand-500/10 hover:ring-1 hover:ring-brand-200/50 dark:hover:ring-brand-700/30 transition-all duration-200"
                                                                title="View booking details">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                                </svg>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {bookings.links && bookings.links.length > 3 && (
                                    <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-700/50 bg-surface-50/30 dark:bg-surface-800/20">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {bookings.links.map((link) => {
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
        </>
    );
}
