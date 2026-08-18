import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    useSwapQuote,
    formatPrice,
    formatDate,
    formatTime,
    type SwapProps,
} from '@/Components/Bookings/useSwapQuote';
import SwapPriceComparison from '@/Components/Bookings/SwapPriceComparison';

const STYLES = `
@keyframes fadeIn { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
.anim-fade { animation: fadeIn 0.5s ease-out both; }
`;

export default function BookingSwap({ booking, cars, swaps, quoteUrl, submitUrl, backUrl, isGuest, isAdmin }: SwapProps) {
    const {
        flash,
        flashVisible,
        setFlashVisible,
        swapDate,
        setSwapDate,
        swapTime,
        setSwapTime,
        selectedCarId,
        setSelectedCarId,
        quote,
        quoteError,
        quoteLoading,
        minDate,
        maxDate,
        minSwapTime,
        form,
        submit,
    } = useSwapQuote({ booking, quoteUrl, submitUrl });

    const Layout = isGuest ? GuestLayout : AuthenticatedLayout;

    return (
        <>
            <Head title={`Swap Vehicle ${booking.reference_code ?? `#${booking.id}`}`} />
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Swap Your Vehicle</h1>
                        <p className="text-brand-200 text-sm mt-1">
                            Reservation <span className="font-semibold text-white">{booking.reference_code ?? `#${booking.id}`}</span>
                            {' '}· {booking.car.brand} {booking.car.model}
                        </p>
                    </div>
                </div>

                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 pb-14">
                    {flashVisible && flash?.success && (
                        <div className="mb-6 px-5 py-3.5 rounded-2xl border shadow-sm bg-emerald-50 border-emerald-200 text-emerald-800 flex items-start gap-3">
                            <p className="text-sm font-medium flex-1">{flash.success}</p>
                        </div>
                    )}
                    {flashVisible && flash?.error && (
                        <div className="mb-6 px-5 py-3.5 rounded-2xl border shadow-sm bg-red-50 border-red-200 text-red-800 flex items-start gap-3">
                            <p className="text-sm font-medium flex-1">{flash.error}</p>
                        </div>
                    )}

                    {(swaps?.length ?? 0) > 0 && (
                        <div className="anim-fade rounded-2xl border border-violet-200 bg-violet-50/60 p-5 mb-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-violet-700 mb-2">Previous Vehicle Changes</p>
                            <div className="space-y-2">
                                {swaps.map((swap, i) => (
                                    <div key={swap.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 border border-violet-100 px-4 py-2.5">
                                        <span className="text-sm text-surface-600">
                                            <span className="font-semibold text-surface-800">{swap.from_car?.brand} {swap.from_car?.model}</span>
                                            <span className="text-surface-400 mx-2">→</span>
                                            <span className="font-semibold text-surface-800">{swap.to_car?.brand} {swap.to_car?.model}</span>
                                        </span>
                                        <span className="text-xs text-surface-500">Swap #{i + 1} · {formatDate(swap.swap_date)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <form className="anim-fade rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden mb-6" onSubmit={e => {
                        e.preventDefault();
                        submit();
                    }}>
                        <div className="px-5 py-4 border-b border-surface-100/60">
                            <h2 className="text-sm font-bold text-surface-900">Choose a New Vehicle</h2>
                            <p className="text-xs text-surface-400 mt-0.5">
                                Your rental is unchanged; only the daily-rate difference on the new vehicle applies from the swap time onward.
                            </p>
                        </div>

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-surface-600 mb-1.5 block">Swap Date</label>
                                <input
                                    type="date"
                                    min={minDate}
                                    max={maxDate}
                                    value={swapDate}
                                    onChange={e => setSwapDate(e.target.value)}
                                    className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                                />
                                <p className="text-[11px] text-surface-400 mt-1">Day the current vehicle is returned. Same-day swaps are allowed after 2 hours of use.</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-surface-600 mb-1.5 block">Swap Time</label>
                                <input
                                    type="time"
                                    min={swapDate === booking.start_date ? minSwapTime : undefined}
                                    value={swapTime}
                                    onChange={e => setSwapTime(e.target.value)}
                                    className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                                />
                                <p className="text-[11px] text-surface-400 mt-1">
                                    {swapDate === booking.start_date
                                        ? `Same-day swap requires at least 2 hours of use (${minSwapTime} or later).`
                                        : 'Return time for the current vehicle.'}
                                </p>
                            </div>
                        </div>

                        {/* Alternate cars */}
                        <div className="px-5 pb-5">
                            <p className="text-xs font-bold text-surface-700 mb-2.5">Available alternative vehicles:</p>
                            {cars.length === 0 ? (
                                <p className="text-sm text-surface-400">No other vehicles are currently available.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {cars.map(car => {
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
                                                {selected && (
                                                    <span className="shrink-0 text-xs font-bold text-brand-700">Selected</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {quoteError && (
                            <div className="mx-5 mb-5 px-4 py-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-800 flex items-start gap-3">
                                <p className="text-sm font-medium">{quoteError}</p>
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
                                {!quoteLoading && !quote && 'Choose a vehicle to see the cost.'}
                            </p>
                            <button
                                type="submit"
                                disabled={form.processing || !!quoteError || selectedCarId === null}
                                className="rounded-xl bg-brand-800 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-200/30"
                            >
                                {form.processing ? 'Saving…' : 'Confirm Vehicle Swap'}
                            </button>
                        </div>
                    </form>

                    {quote && !quoteError && (
                        <div className="anim-fade rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-surface-100/60 flex items-center justify-between gap-3">
                                <h2 className="text-sm font-bold text-surface-900">Vehicle Swap Summary</h2>
                                <span className="text-[11px] text-surface-400">{formatDate(swapDate)} · {swapTime || '—'}</span>
                            </div>
                            <div className="p-5 space-y-4">
                                <SwapPriceComparison
                                    fromSubtotal={quote.from_subtotal}
                                    toSubtotal={quote.to_subtotal}
                                    oldTotal={quote.old_total_amount}
                                    newTotal={quote.new_total_amount}
                                    priceDelta={quote.price_delta}
                                    taxes={quote.taxes}
                                    fromLabel={booking.car.brand}
                                    toLabel={quote.to_car?.brand ?? 'New vehicle'}
                                />
                                <div className="border-t border-dashed border-surface-200/60 pt-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400 mb-2">What's changing</p>
                                    <div className="space-y-1.5">
                                        {quote.segments.map((seg, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <span className="text-surface-400">
                                                    {seg.car?.brand} {seg.car?.model} · {seg.days} {seg.days === 1 ? 'day' : 'days'} × {formatPrice(seg.daily_rate)}/day
                                                </span>
                                                <span className="font-semibold text-surface-800 tabular-nums">{formatPrice(seg.subtotal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[11px] text-surface-400 -mt-1">
                                    You do not need a new downpayment — the difference is added to or deducted from your balance.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Layout>
        </>
    );
}
