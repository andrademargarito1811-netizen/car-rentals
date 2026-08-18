import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    useExtensionQuote,
    formatPrice,
    formatDate,
    formatTime,
    type ExtendProps,
} from '@/Components/Bookings/useExtensionQuote';

const STYLES = `
@keyframes fadeIn { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
.anim-fade { animation: fadeIn 0.5s ease-out both; }
`;

export default function BookingExtend({ booking, extendable, extendBlockedMessage, maxExtendableDate, quoteUrl, submitUrl, backUrl, isGuest, isAdmin, maxReturnTime }: ExtendProps) {
    const {
        flash,
        flashVisible,
        setFlashVisible,
        newEndDate,
        setNewEndDate,
        newReturnTime,
        setNewReturnTime,
        quote,
        quoteError,
        quoteLoading,
        selectedCarId,
        setSelectedCarId,
        alternates,
        paginatedAlternates,
        alternatePage,
        setAlternatePage,
        alternateTotalPages,
        isSameDay,
        minDate,
        maxDate,
        timeMin,
        timeMax,
        daysChanged,
        form,
        submit,
    } = useExtensionQuote({ booking, extendable, maxExtendableDate, quoteUrl, submitUrl, maxReturnTime });

    const Layout = isGuest ? GuestLayout : AuthenticatedLayout;

    return (
        <>
            <Head title={`Extend Rental ${booking.reference_code ?? `#${booking.id}`}`} />
            <Layout>
                <style>{STYLES}</style>

                <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900">
                    <div className="pointer-events-none absolute inset-0 opacity-20">
                        <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-accent-400 blur-3xl" />
                        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-brand-400 blur-3xl" />
                    </div>
                    <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                        <Link href={backUrl} className="inline-flex items-center gap-2 text-sm font-medium text-brand-200 hover:text-white transition-colors mb-4 group">
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Booking
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Extend Your Rental</h1>
                        <p className="text-brand-200 text-sm mt-1">
                            Reservation <span className="font-semibold text-white">{booking.reference_code ?? `#${booking.id}`}</span>
                            {' '}· {booking.car.brand} {booking.car.model}
                        </p>
                    </div>
                </div>

                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 pb-14">
                    {flashVisible && flash?.success && (
                        <div className="mb-6 px-5 py-3.5 rounded-2xl border shadow-sm bg-emerald-50 border-emerald-200 text-emerald-800 flex items-start gap-3">
                            <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200 text-emerald-600">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </span>
                            <p className="text-sm font-medium flex-1">{flash.success}</p>
                        </div>
                    )}
                    {flashVisible && flash?.error && (
                        <div className="mb-6 px-5 py-3.5 rounded-2xl border shadow-sm bg-red-50 border-red-200 text-red-800 flex items-start gap-3">
                            <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-red-200 text-red-600">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </span>
                            <p className="text-sm font-medium flex-1">{flash.error}</p>
                        </div>
                    )}

                    {!extendable ? (
                        <div className="anim-fade rounded-2xl border border-amber-200/70 bg-amber-50 p-6 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-800">Extension unavailable</p>
                                    <p className="text-sm text-amber-700 mt-0.5">{extendBlockedMessage || 'This rental cannot be extended right now.'}</p>
                                </div>
                            </div>
                            <Link href={backUrl} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-700 transition-colors">
                                Back to Booking
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Current vs New window */}
                            <div className="anim-fade grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="rounded-2xl border border-surface-100/80 bg-white shadow-sm p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400 mb-2">Current Return</p>
                                    <p className="text-base font-bold text-surface-800">{formatDate(booking.end_date)}</p>
                                    <p className="text-sm text-surface-500">{formatTime(booking.return_time)}</p>
                                </div>
                                <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-500 mb-2">New Return</p>
                                    <p className="text-base font-bold text-brand-800">{formatDate(newEndDate)}</p>
                                    <p className="text-sm text-brand-600">{formatTime(newReturnTime)}</p>
                                </div>
                            </div>

                            <form className="anim-fade rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden mb-6" onSubmit={e => {
                                e.preventDefault();
                                submit();
                            }}>
                                <div className="px-5 py-4 border-b border-surface-100/60">
                                    <h2 className="text-sm font-bold text-surface-900">Choose a New Return Date</h2>
                                    <p className="text-xs text-surface-400 mt-0.5">
                                        {maxExtendableDate && maxExtendableDate >= booking.end_date
                                            ? `This car is available for extension until ${formatDate(maxExtendableDate)}.`
                                            : 'Pick a new return date for your rental.'}
                                    </p>
                                </div>

                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-surface-600 mb-1.5 block">New Return Date</label>
                                        <input
                                            type="date"
                                            min={minDate}
                                            max={maxDate}
                                            value={newEndDate}
                                            onChange={e => setNewEndDate(e.target.value)}
                                            className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                                        />
                                        <p className="text-[11px] text-surface-400 mt-1">Earliest: {formatDate(minDate)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-surface-600 mb-1.5 block">New Return Time</label>
                                        <input
                                            type="time"
                                            value={newReturnTime}
                                            min={timeMin}
                                            max={timeMax}
                                            onChange={e => setNewReturnTime(e.target.value)}
                                            className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                                        />
                                        <p className="text-[11px] text-surface-400 mt-1">
                                            {isSameDay
                                                ? `Must be after ${formatTime(booking.return_time)}${timeMax ? ` and before ${formatTime(timeMax)}` : ''}`
                                                : `Any time on ${formatDate(newEndDate)}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Quote error */}
                                {quoteError && (
                                    <div className="mx-5 mb-5 px-4 py-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-800 flex items-start gap-3">
                                        <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-red-200 text-red-600">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium">{quoteError.error}</p>
                                            {quoteError.max_extendable_date && quoteError.max_extendable_date > booking.end_date && (
                                                <button
                                                    type="button"
                                                    onClick={() => setNewEndDate(quoteError.max_extendable_date!)}
                                                    className="mt-2 text-xs font-bold text-red-700 underline underline-offset-2 hover:text-red-900"
                                                >
                                                    Extend until {formatDate(quoteError.max_extendable_date!)} instead
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Alternate cars — switchable */}
                                {alternates.length > 0 && (selectedCarId !== null || quoteError) && (
                                    <div className="mx-5 mb-5 rounded-2xl border border-surface-100 bg-surface-50/70 p-4">
                                        <p className="text-xs font-bold text-surface-700 mb-2.5">
                                            {selectedCarId !== null
                                                ? 'Switch to another vehicle for this period:'
                                                : 'Available alternative vehicles for this period:'}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {paginatedAlternates.map(car => {
                                                const selected = selectedCarId === car.id;
                                                return (
                                                    <div
                                                        key={car.id}
                                                        onClick={() => setSelectedCarId(selected ? null : car.id)}
                                                        className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                                                            selected ? 'border-brand-500 bg-brand-50' : 'border-surface-100 bg-white hover:border-brand-200'
                                                        }`}
                                                    >
                                                        <div className="w-14 h-10 rounded-lg bg-surface-100 flex items-center justify-center overflow-hidden shrink-0">
                                                            {car.image_path ? (
                                                                <img src={`/storage/${car.image_path}`} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-bold text-surface-800 truncate">{car.brand} {car.model}</p>
                                                            <p className="text-xs text-surface-400">{car.year} · {formatPrice(car.daily_rate)}/day</p>
                                                        </div>
                                                        <Link href={isAdmin ? route('admin.cars.edit', car.id) : route('cars.show', car.id)} onClick={e => e.stopPropagation()} className="shrink-0 text-xs font-bold text-brand-700 hover:text-brand-900">View</Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {alternateTotalPages > 1 && (
                                            <div className="mt-2.5 flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    disabled={alternatePage <= 1}
                                                    onClick={() => setAlternatePage(p => Math.max(1, p - 1))}
                                                    className="text-xs font-bold text-brand-700 hover:text-brand-900 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    ← Prev
                                                </button>
                                                <span className="text-xs text-surface-500">Page {alternatePage} of {alternateTotalPages}</span>
                                                <button
                                                    type="button"
                                                    disabled={alternatePage >= alternateTotalPages}
                                                    onClick={() => setAlternatePage(p => Math.min(alternateTotalPages, p + 1))}
                                                    className="text-xs font-bold text-brand-700 hover:text-brand-900 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        )}
                                        {selectedCarId !== null && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCarId(null)}
                                                className="mt-2.5 text-xs font-bold text-brand-700 underline underline-offset-2 hover:text-brand-900"
                                            >
                                                Keep {booking.car.brand} {booking.car.model} instead
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="px-5 py-4 border-t border-surface-100/60 bg-surface-50/50 flex items-center justify-between gap-3">
                                    <p className="text-sm text-surface-400 flex items-center gap-1.5">
                                        {quoteLoading && (
                                            <>
                                                <svg className="w-4 h-4 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                Checking availability…
                                            </>
                                        )}
                                        {!quoteLoading && !quote && !quoteError && 'Choose a date to see the cost.'}
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={form.processing || !!quoteError}
                                        className="rounded-xl bg-brand-800 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-200/30"
                                    >
                                        {form.processing ? 'Saving…' : (quote?.is_swap ? 'Reserve This Vehicle' : 'Confirm Extension')}
                                    </button>
                                </div>
                            </form>

                            {/* Quote summary */}
                            {quote && !quoteError && (
                                <div className="anim-fade rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-surface-100/60">
                                        <h2 className="text-sm font-bold text-surface-900">{quote.is_swap ? 'New Reservation Summary' : 'Extension Summary'}</h2>
                                    </div>
                                    {quote.is_swap && (
                                        <div className="mx-5 mt-4 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
                                            <p className="text-xs font-bold text-brand-800 mb-0.5">Vehicle Changed — New Reservation</p>
                                            <p className="text-sm font-semibold text-surface-800">
                                                {quote.car.brand} {quote.car.model} ({quote.car.year}) · {formatPrice(quote.daily_rate)}/day
                                            </p>
                                            <p className="text-[11px] text-surface-500 mt-1">
                                                Pickup {formatDate(quote.current_end_date)} {quote.current_return_time ? `(${formatTime(quote.current_return_time)})` : ''} → Return {formatDate(quote.new_end_date)}
                                            </p>
                                        </div>
                                    )}
                                    <div className="p-5 space-y-2.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-surface-400">
                                                {formatPrice(quote.daily_rate)} × {daysChanged} {quote.is_swap ? '' : 'extra '}{daysChanged === 1 ? 'day' : 'days'}
                                            </span>
                                            <span className="font-semibold text-surface-800">{formatPrice(quote.extension_subtotal)}</span>
                                        </div>
                                        {quote.taxes.filter(t => t.add_or_minus).length > 0 && (
                                            <div className="border-t border-dashed border-surface-200/60 pt-2.5 space-y-1.5">
                                                <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400 mb-1.5">Taxes & Fees</p>
                                                {quote.taxes.filter(t => t.add_or_minus).map((t, i) => (
                                                    <div key={i} className="flex items-center justify-between text-sm">
                                                        <span className="text-surface-400">{t.tax_desc}</span>
                                                        <span className="font-medium text-surface-600">+{formatPrice(t.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {quote.total_surcharge > 0 && quote.taxes.filter(t => t.add_or_minus).length === 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-surface-400">Surcharges</span>
                                                <span className="font-medium text-surface-600">+{formatPrice(quote.total_surcharge)}</span>
                                            </div>
                                        )}
                                        {quote.is_swap ? (
                                            <div className="mt-3 pt-3 border-t border-surface-200/80 flex items-center justify-between">
                                                <span className="text-sm font-bold text-surface-900">New Reservation Total</span>
                                                <span className="text-lg font-extrabold text-accent-600">{formatPrice(quote.new_total_amount)}</span>
                                            </div>
                                        ) : (
                                            <div className="mt-3 pt-3 border-t border-surface-200/80 flex items-center justify-between">
                                                <span className="text-sm font-bold text-surface-900">Additional Amount Due</span>
                                                <span className="text-lg font-extrabold text-accent-600">{formatPrice(quote.additional_total)}</span>
                                            </div>
                                        )}
                                        {quote.is_swap ? (
                                            <p className="text-[11px] text-surface-400 pt-1">
                                                This is a separate reservation. Your original booking ({booking.car.brand} {booking.car.model}, returning {formatDate(booking.end_date)}) is unchanged.
                                            </p>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-surface-400">New Booking Total</span>
                                                <span className="text-sm font-bold text-brand-800">{formatPrice(quote.new_total_amount)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Layout>
        </>
    );
}
