import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface BookingsIndexProps {
    bookings: {
        data: Array<{
            id: number;
            start_date: string;
            end_date: string;
            total_amount: number;
            status: string;
            car: { id: number; brand: string; model: string };
        }>;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function BookingsIndex({ bookings }: BookingsIndexProps) {
    const route = useRoute();

    return (
        <>
            <Head title="My Bookings" />
            <AuthenticatedLayout header={<h2 className="text-2xl font-bold text-surface-900">My Bookings</h2>}>
                <div className="py-8 sm:py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {bookings.data.length === 0 ? (
                            <div className="card p-12 text-center">
                                <svg className="w-16 h-16 text-surface-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="text-lg font-semibold text-surface-900 mb-2">No bookings yet</h3>
                                <p className="text-surface-500 mb-6">Start by browsing our fleet and booking your perfect car.</p>
                                <Link href={route('cars.index')} className="btn-primary !text-sm">
                                    Browse Cars
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bookings.data.map((booking) => (
                                    <div key={booking.id} className="card p-6 hover:shadow-card-hover transition-all duration-300">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-brand-800/10 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-surface-900">{booking.car.brand} {booking.car.model}</h3>
                                                    <p className="text-sm text-surface-500">{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={statusBadge(booking.status)}>{booking.status}</span>
                                                <p className="text-lg font-bold text-surface-900">{formatPrice(booking.total_amount)}</p>
                                                {['pending', 'confirmed'].includes(booking.status) && (
                                                    <Link href={route('bookings.edit', booking.id)}
                                                        className="btn-ghost !text-sm !px-3 !py-1.5">
                                                        Modify
                                                    </Link>
                                                )}
                                                <Link href={route('bookings.show', booking.id)}
                                                    className="btn-ghost !text-sm !px-3 !py-1.5">
                                                    View
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {bookings.links && bookings.links.length > 3 && (
                                    <div className="flex justify-center pt-4">
                                        <div className="flex gap-2">
                                            {bookings.links.map((link) => (
                                                <Link key={link.label}
                                                    href={link.url || '#'}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                                        link.active
                                                            ? 'bg-brand-800 text-white shadow-md'
                                                            : 'bg-white text-surface-600 hover:bg-surface-50 border border-surface-200'
                                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    preserveState
                                                    preserveScroll
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
