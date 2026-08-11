import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Badge } from '@/Components/ui/badge';

interface GuestItem {
    guest_id: number;
    title: string | null;
    first_name: string;
    last_name: string;
    company_name: string | null;
    email: string;
    phone: string | null;
    country: string | null;
    bookings_count: number;
    created_at: string;
}

interface GuestsIndexProps {
    guests: {
        data: GuestItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string | null;
        sort_field: string;
        sort_direction: string;
    };
    stats: {
        total: number;
        total_bookings: number;
        returning: number;
        this_month: number;
    };
}

export default function GuestsIndex({ guests, filters, stats }: GuestsIndexProps) {
    const route = useRoute();
    const [search, setSearch] = useState(filters?.search || '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get(route('admin.guests.index'), {
                search,
                sort_field: filters?.sort_field || 'created_at',
                sort_direction: filters?.sort_direction || 'desc',
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    function handleSort(field: string) {
        const same = filters?.sort_field === field;
        const dir = same && filters?.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('admin.guests.index'), {
            search,
            sort_field: field,
            sort_direction: dir,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function sortArrow(field: string) {
        if (filters?.sort_field !== field) return null;
        return filters.sort_direction === 'asc' ? ' ▲' : ' ▼';
    }

    function initials(g: GuestItem) {
        return `${g.first_name.charAt(0)}${g.last_name.charAt(0)}`.toUpperCase();
    }

    const hasActiveFilters = filters?.search;
    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Guests" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Guests' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Walk-in Customers
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Guests
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    View guests who have booked without a registered account.
                                </p>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        <div className="grid gap-4 sm:grid-cols-4">
                            {[
                                { label: 'Total Guests', value: stats.total, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0' },
                                { label: 'Total Bookings', value: stats.total_bookings, gradient: 'from-blue-500/20 to-blue-600/10', iconGradient: 'from-blue-500 to-blue-600', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                { label: 'Returning Guests', value: stats.returning, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75' },
                                { label: 'New This Month', value: stats.this_month, gradient: 'from-amber-500/20 to-amber-600/10', iconGradient: 'from-amber-500 to-amber-600', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
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
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">Guests</span>
                                {hasActiveFilters && <span className="text-[11px] text-surface-400 dark:text-surface-500">({guests.data.length} result{guests.data.length !== 1 ? 's' : ''})</span>}
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search name, email, phone..."
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

                            <div className="animate-fade-in-up rounded-xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th onClick={() => handleSort('first_name')}
                                                    className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                                    Name<span className="text-[9px]">{sortArrow('first_name')}</span>
                                                </th>
                                                <th onClick={() => handleSort('email')}
                                                    className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                                    Contact<span className="text-[9px]">{sortArrow('email')}</span>
                                                </th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Company</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Country</th>
                                                <th onClick={() => handleSort('bookings_count')}
                                                    className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                                    Bookings<span className="text-[9px]">{sortArrow('bookings_count')}</span>
                                                </th>
                                                <th onClick={() => handleSort('created_at')}
                                                    className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                                    First Booking<span className="text-[9px]">{sortArrow('created_at')}</span>
                                                </th>
                                                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {guests.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-20 text-center">
                                                        <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-7 h-7 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-surface-500 dark:text-surface-400 font-medium">No guests found</p>
                                                        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Try adjusting your search criteria.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                guests.data.map((guest) => (
                                                    <tr key={guest.guest_id}
                                                        className="group relative transition-all duration-200 hover:bg-gradient-to-r hover:from-brand-500/[0.04] hover:to-transparent dark:hover:from-brand-400/[0.06] dark:hover:to-transparent border-b border-surface-100/80 dark:border-surface-700/30 last:border-b-0">
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                                                                    {initials(guest)}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-surface-900 dark:text-white text-sm">{guest.first_name} {guest.last_name}</p>
                                                                    {guest.bookings_count >= 2 && (
                                                                        <Badge variant="secondary" className="mt-0.5 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-700/40 text-[10px] px-1.5 py-0">
                                                                            Returning
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-3.5 h-3.5 text-surface-400 dark:text-surface-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                                                                </svg>
                                                                <span className="text-sm text-surface-600 dark:text-surface-400 truncate max-w-[200px]">{guest.email}</span>
                                                            </div>
                                                            {guest.phone && (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <svg className="w-3 h-3 text-surface-300 dark:text-surface-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                                                                    </svg>
                                                                    <span className="text-[12px] text-surface-400 dark:text-surface-500">{guest.phone}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-sm text-surface-700 dark:text-surface-300">{guest.company_name || '—'}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-sm text-surface-600 dark:text-surface-400">{guest.country || '—'}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <Badge variant={guest.bookings_count > 0 ? 'default' : 'secondary'}>
                                                                {guest.bookings_count}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-sm text-surface-600 dark:text-surface-300">
                                                                {new Date(guest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <Link href={route('admin.guests.show', guest.guest_id)}
                                                                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-surface-400 dark:text-surface-500 bg-transparent hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-400 hover:shadow-sm hover:shadow-brand-500/10 hover:ring-1 hover:ring-brand-200/50 dark:hover:ring-brand-700/30 transition-all duration-200"
                                                                title="View guest details">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {guests.links && guests.links.length > 3 && (
                                    <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-700/50 bg-surface-50/30 dark:bg-surface-800/20">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {guests.links.map((link) => {
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
