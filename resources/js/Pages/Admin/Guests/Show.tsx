import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Badge } from '@/Components/ui/badge';

interface GuestDetail {
    guest_id: number;
    title: string | null;
    first_name: string;
    last_name: string;
    company_name: string | null;
    driver_age: number | null;
    phone: string | null;
    email: string;
    address: string | null;
    address2: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    postal_code: string | null;
    flight_no: string | null;
    created_at: string;
}

interface GuestBooking {
    id: number;
    reference_code: string;
    start_date: string;
    end_date: string;
    pickup_time: string | null;
    return_time: string | null;
    total_amount: string | number;
    status: string;
    car: { brand: string; model: string } | null;
    pickup_location: { location: string } | null;
    return_location: { location: string } | null;
}

interface GuestDriver {
    driver_id: number;
    first_name: string;
    last_name: string;
    birth_date: string | null;
    license_number: string;
    license_category: string | null;
    license_expiry: string | null;
}

interface GuestShowProps {
    guest: GuestDetail;
    bookings: {
        data: GuestBooking[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    drivers: GuestDriver[];
    stats: {
        total_bookings: number;
        active_bookings: number;
        total_spent: number;
    };
}

const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
    confirmed: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
    active: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
    completed: 'bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400',
    cancelled: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',
};

function formatPrice(value: string | number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}

function ageFromBirthDate(birthDate: string | null): number | null {
    if (!birthDate) return null;
    const dob = new Date(birthDate + 'T00:00:00');
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

export default function GuestShow({ guest, bookings, drivers, stats }: GuestShowProps) {
    const route = useRoute();

    const derivedAge = ageFromBirthDate(drivers.find((d) => d.birth_date)?.birth_date ?? null);

    const infoRows: Array<{ label: string; value: string | null; href?: string }> = [
        { label: 'Full Name', value: `${guest.title ? guest.title + ' ' : ''}${guest.first_name} ${guest.last_name}` },
        { label: 'Company', value: guest.company_name },
        { label: 'Email', value: guest.email, href: `mailto:${guest.email}` },
        { label: 'Phone', value: guest.phone, href: guest.phone ? `tel:${guest.phone}` : undefined },
        { label: 'Driver Age', value: guest.driver_age ? `${guest.driver_age} yrs` : (derivedAge !== null ? `${derivedAge} yrs` : null) },
        { label: 'Flight Number', value: guest.flight_no },
        { label: 'Address', value: [guest.address, guest.address2].filter(Boolean).join(', ') || null },
        { label: 'Location', value: [guest.city, guest.state, guest.country, guest.postal_code].filter(Boolean).join(', ') || null },
        { label: 'First Booking', value: guest.created_at ? new Date(guest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null },
    ];

    return (
        <>
            <Head title={`Guest — ${guest.first_name} ${guest.last_name}`} />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Guests', href: 'admin.guests.index' }, { label: `${guest.first_name} ${guest.last_name}` }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <span className="w-14 h-14 rounded-2xl bg-white/15 text-white flex items-center justify-center text-xl font-bold backdrop-blur-sm ring-1 ring-white/20">
                                    {`${guest.first_name.charAt(0)}${guest.last_name.charAt(0)}`.toUpperCase()}
                                </span>
                                <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Guest Profile
                                    </span>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                        {guest.first_name} {guest.last_name}
                                    </h1>
                                    <p className="text-white/60 text-sm">{guest.email}</p>
                                </div>
                            </div>
                            <Link href={route('admin.guests.index')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl ring-1 ring-white/20 hover:bg-white/20 transition-all duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                                Back to Guests
                            </Link>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Total Bookings', value: stats.total_bookings, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                { label: 'Active Bookings', value: stats.active_bookings, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Total Spent', value: formatPrice(stats.total_spent), gradient: 'from-blue-500/20 to-blue-600/10', iconGradient: 'from-blue-500 to-blue-600', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
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

                        <div className="grid gap-8 lg:grid-cols-3">
                            <div className="space-y-6">
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700/50 flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-surface-900 dark:text-white">Contact Information</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {infoRows.map((row) => (
                                            <div key={row.label}>
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-0.5">{row.label}</p>
                                                {row.value ? (
                                                    row.href ? (
                                                        <a href={row.href} className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline break-words">{row.value}</a>
                                                    ) : (
                                                        <p className="text-sm font-semibold text-surface-900 dark:text-white break-words">{row.value}</p>
                                                    )
                                                ) : (
                                                    <p className="text-sm text-surface-400 dark:text-surface-500">—</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {drivers.length > 0 && (
                                    <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700/50 flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-white">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Additional Drivers ({drivers.length})</h3>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            {drivers.map((driver) => (
                                                <div key={driver.driver_id} className="p-4 rounded-xl bg-surface-50/70 dark:bg-brand-900/30 border border-surface-100 dark:border-surface-700/50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-bold text-surface-900 dark:text-white">{driver.first_name} {driver.last_name}</p>
                                                        <Badge variant="secondary">{driver.license_category || 'Standard'}</Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-surface-500 dark:text-surface-400">
                                                        {driver.birth_date && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="font-semibold text-surface-400">DOB:</span> {new Date(driver.birth_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-semibold text-surface-400">License:</span> <span className="font-mono">{driver.license_number}</span>
                                                        </span>
                                                        {driver.license_expiry && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="font-semibold text-surface-400">Expires:</span> {new Date(driver.license_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-surface-100 dark:border-surface-700/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Booking History</h3>
                                        </div>
                                        <Badge variant="secondary">{stats.total_bookings} total</Badge>
                                    </div>

                                    {bookings.data.length === 0 ? (
                                        <div className="px-5 py-16 text-center">
                                            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-semibold text-surface-900 dark:text-white mb-1">No bookings yet</p>
                                            <p className="text-xs text-surface-400 dark:text-surface-500">This guest hasn't made any reservations.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr>
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Reference</th>
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Vehicle</th>
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Dates</th>
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Amount</th>
                                                        <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bookings.data.map((booking) => (
                                                        <tr key={booking.id}
                                                            className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-brand-500/[0.04] hover:to-transparent dark:hover:from-brand-400/[0.06] dark:hover:to-transparent border-b border-surface-100/80 dark:border-surface-700/30 last:border-b-0">
                                                            <td className="px-5 py-4">
                                                                <Link href={route('admin.bookings.show', booking.id)}
                                                                    className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline font-mono">
                                                                    {booking.reference_code}
                                                                </Link>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-sm font-semibold text-surface-900 dark:text-white">{booking.car ? `${booking.car.brand} ${booking.car.model}` : '—'}</span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-nowrap">
                                                                    {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    {booking.pickup_time ? ` ${booking.pickup_time.slice(0, 5)}` : ''}
                                                                    {' → '}
                                                                    {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    {booking.return_time ? ` ${booking.return_time.slice(0, 5)}` : ''}
                                                                </p>
                                                                {(booking.pickup_location || booking.return_location) && (
                                                                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                                                                        {booking.pickup_location?.location}{booking.pickup_location && booking.return_location && booking.pickup_location.location !== booking.return_location.location ? ' → ' + booking.return_location.location : ''}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-sm font-bold text-surface-900 dark:text-white">{formatPrice(booking.total_amount)}</span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${STATUS_BADGE[booking.status] || STATUS_BADGE.completed}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${booking.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-current opacity-60'}`} />
                                                                    {booking.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

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
                </div>
            </AuthenticatedLayout>
        </>
    );
}
