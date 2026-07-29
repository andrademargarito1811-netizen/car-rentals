import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface BookingShowProps {
    booking: {
        id: number;
        reference_code: string | null;
        start_date: string;
        end_date: string;
        total_amount: number;
        status: string;
        notes: string | null;
        car: { id: number; brand: string; model: string; year: number; license_plate: string };
        payment: { id: string; amount: number; payment_method: string; payment_status: string } | null;
    };
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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

export default function BookingShow({ booking }: BookingShowProps) {
    const route = useRoute();
    const cancelForm = useForm({});

    function cancelBooking() {
        if (confirm('Are you sure you want to cancel this booking?')) {
            cancelForm.patch(route('bookings.cancel', booking.id));
        }
    }

    const flash = (usePage().props as any).flash as { success?: string; error?: string } | undefined;
    const [flashVisible, setFlashVisible] = useState(true);
    useEffect(() => { if (flash?.success || flash?.error) setFlashVisible(true); }, []);

    return (
        <>
            <Head title="Booking Details" />
            <AuthenticatedLayout header={<h2 className="text-2xl font-bold text-surface-900 font-mono">{booking.reference_code ?? `Booking #${booking.id}`}</h2>}>
                <div className="py-8 sm:py-12">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        {flashVisible && flash?.success && (
                            <div className="mb-6 px-5 py-3.5 rounded-2xl border shadow-sm bg-emerald-50 border-emerald-200 text-emerald-800 flex items-start gap-3">
                                <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200 text-emerald-600">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </span>
                                <p className="text-sm font-medium flex-1">{flash.success}</p>
                                <button type="button" onClick={() => setFlashVisible(false)} className="shrink-0 p-0.5 opacity-60 hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        )}
                        {flashVisible && flash?.error && (
                            <div className="mb-6 px-5 py-3.5 rounded-2xl border shadow-sm bg-red-50 border-red-200 text-red-800 flex items-start gap-3">
                                <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-red-200 text-red-600">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                </span>
                                <p className="text-sm font-medium flex-1">{flash.error}</p>
                                <button type="button" onClick={() => setFlashVisible(false)} className="shrink-0 p-0.5 opacity-60 hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        )}

                        <div className="card overflow-hidden">
                            <div className="p-8 sm:p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-brand-800/10 flex items-center justify-center">
                                            <svg className="w-7 h-7 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-surface-900">{booking.car.brand} {booking.car.model}</h3>
                                            <p className="text-sm text-surface-500">{booking.car.year} · {booking.car.license_plate}</p>
                                        </div>
                                    </div>
                                    <span className={statusBadge(booking.status)}>{booking.status}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-surface-50 rounded-xl">
                                        <dt className="text-sm text-surface-500 mb-1">Start Date</dt>
                                        <dd className="text-base font-semibold text-surface-900">{formatDate(booking.start_date)}</dd>
                                    </div>
                                    <div className="p-4 bg-surface-50 rounded-xl">
                                        <dt className="text-sm text-surface-500 mb-1">End Date</dt>
                                        <dd className="text-base font-semibold text-surface-900">{formatDate(booking.end_date)}</dd>
                                    </div>
                                    <div className="p-4 bg-brand-800/5 rounded-xl">
                                        <dt className="text-sm text-surface-500 mb-1">Total Amount</dt>
                                        <dd className="text-2xl font-bold text-brand-800">{formatPrice(booking.total_amount)}</dd>
                                    </div>
                                    {booking.payment && (
                                        <div className="p-4 bg-surface-50 rounded-xl">
                                            <dt className="text-sm text-surface-500 mb-1">Payment</dt>
                                            <dd className="text-base font-semibold text-surface-900 capitalize">{booking.payment.payment_status}</dd>
                                        </div>
                                    )}
                                </div>

                                {booking.notes && (
                                    <div className="mt-6 p-4 bg-surface-50 rounded-xl">
                                        <h4 className="text-sm font-medium text-surface-500 mb-2">Notes</h4>
                                        <p className="text-surface-900">{booking.notes}</p>
                                    </div>
                                )}

                                {['pending', 'confirmed'].includes(booking.status) && (
                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <Link href={route('bookings.edit', booking.id)}
                                            className="px-6 py-3 bg-brand-800 text-white font-medium rounded-xl hover:bg-brand-700 transition-all duration-200 shadow-md shadow-brand-200/30 text-sm">
                                            Modify Booking
                                        </Link>
                                        {booking.status === 'pending' && (
                                            <button onClick={cancelBooking}
                                                disabled={cancelForm.processing}
                                                className="px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all duration-200 disabled:opacity-50 border border-red-200 text-sm">
                                                {cancelForm.processing ? 'Cancelling...' : 'Cancel Booking'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="mt-6">
                                    <Link href={route('bookings.index')}
                                        className="inline-flex items-center gap-2 text-sm text-brand-800 hover:text-brand-700 transition-colors font-medium">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Bookings
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
