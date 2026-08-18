import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent } from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    Clipboard,
    ChevronRight,
    CalendarPlus,
    User,
    Car,
    Hash,
    Clock,
    Banknote,
    ArrowLeft,
    AlertTriangle,
    ArrowRightLeft,
} from 'lucide-react';
import {
    useExtensionQuote,
    formatPrice,
    formatDate,
    formatTime,
    calcRentalDays,
    type ExtendProps,
    type ExtendCar,
} from '@/Components/Bookings/useExtensionQuote';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

function customerName(booking: ExtendProps['booking']): string {
    return booking.user?.name ?? (booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : 'Guest');
}

function customerEmail(booking: ExtendProps['booking']): string {
    return booking.user?.email ?? booking.guest?.email ?? '—';
}

function customerPhone(booking: ExtendProps['booking']): string | null {
    return booking.user?.phone ?? booking.guest?.phone ?? null;
}

function initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function AlternateCarItem({ car, selected, onSelect, onKeep }: { car: ExtendCar; selected: boolean; onSelect: () => void; onKeep?: () => void }) {
    const route = useRoute();
    return (
        <div
            onClick={onSelect}
            className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                selected ? 'border-primary bg-primary/5' : 'border-surface-200 bg-white hover:border-primary/40 dark:border-surface-700 dark:bg-brand-900/40'
            }`}
        >
            <div className="w-14 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {car.image_path ? (
                    <img src={`/storage/${car.image_path}`} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                ) : (
                    <Car className="w-5 h-5 text-muted-foreground" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">{car.brand} {car.model}</p>
                <p className="text-xs text-muted-foreground">{car.year} · {formatPrice(car.daily_rate)}/day</p>
            </div>
            {selected && onKeep && (
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onKeep(); }}
                    className="shrink-0 text-xs font-bold text-primary underline underline-offset-2 hover:text-primary/80"
                >
                    Keep current
                </button>
            )}
            {!selected && (
                <Link href={route('admin.cars.edit', car.id)} onClick={e => e.stopPropagation()} className="shrink-0 text-xs font-bold text-primary hover:text-primary/80">
                    View
                </Link>
            )}
        </div>
    );
}

export default function AdminBookingExtend({ booking, extendable, extendBlockedMessage, maxExtendableDate, quoteUrl, submitUrl, backUrl, isAdmin, maxReturnTime }: ExtendProps) {
    const route = useRoute();
    const {
        flash,
        flashVisible,
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

    const name = customerName(booking);
    const email = customerEmail(booking);
    const phone = customerPhone(booking);
    const inits = initials(name);

    const totalAmount = Number(booking.total_amount) || 0;
    const totalPaid = (booking.payments ?? [])
        .filter(p => p.payment_status === 'completed' && p.type !== 'refund')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = Math.max(0, totalAmount - totalPaid);
    const paymentPercent = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

    const rentalDays = calcRentalDays(booking.start_date, booking.pickup_time, booking.end_date, booking.return_time);

    return (
        <>
            <Head title={`Extend Rental ${booking.reference_code ?? `#${booking.id}`}`} />

            <AuthenticatedLayout
                header={
                    <div>
                        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Link href={route('admin.reservations.index')} className="hover:text-foreground transition-colors">
                                Reservations
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <Link href={backUrl} className="hover:text-foreground transition-colors truncate">
                                {booking.reference_code ?? `#${booking.id}`}
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-foreground font-medium">Extend Rental</span>
                        </nav>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                                    <CalendarPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Extend Rental</h1>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{name}</span>
                                        <span className="text-muted-foreground/40">|</span>
                                        <span className="flex items-center gap-1"><Car className="w-3 h-3" />{booking.car.brand} {booking.car.model}</span>
                                    </p>
                                </div>
                            </div>
                            <Badge variant={booking.status as 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'}>
                                {STATUS_LABELS[booking.status] ?? booking.status}
                            </Badge>
                        </div>
                    </div>
                }
            >
                {!extendable ? (
                    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Extension unavailable</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {extendBlockedMessage || 'This rental cannot be extended right now.'}
                                        </p>
                                    </div>
                                </div>
                                <Link href={backUrl} className="inline-flex mt-5">
                                    <Button variant="outline" size="sm">
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        Back to Booking
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto">
                        {flashVisible && flash?.success && (
                            <div className="mb-5 px-4 py-3 rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-start gap-2.5">
                                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold">✓</span>
                                <span>{flash.success}</span>
                            </div>
                        )}
                        {flashVisible && flash?.error && (
                            <div className="mb-5 px-4 py-3 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm font-medium flex items-start gap-2.5">
                                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 flex items-center justify-center text-[10px] font-bold">✕</span>
                                <span>{flash.error}</span>
                            </div>
                        )}

                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Sidebar */}
                            <aside className="w-full lg:w-80 shrink-0 space-y-4">
                                <div className="lg:sticky lg:top-6 space-y-4">
                                    {/* Customer */}
                                    <Card>
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                    {inits}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-foreground truncate">{name}</p>
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 mt-0.5">
                                                        {booking.user ? 'Registered' : 'Guest'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                    <Mail className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{email}</span>
                                                </a>
                                                {phone && (
                                                    <a href={`tel:${phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                        <Phone className="w-3.5 h-3.5 shrink-0" />
                                                        <span>{phone}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Booking summary */}
                                    <Card>
                                        <CardContent className="p-5 space-y-3">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                                    {booking.car.image_path ? (
                                                        <img src={`/storage/${booking.car.image_path}`} alt={`${booking.car.brand} ${booking.car.model}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Car className="w-6 h-6 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{booking.car.brand} {booking.car.model}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Hash className="w-3 h-3" />
                                                        {booking.car.license_plate}
                                                    </p>
                                                </div>
                                            </div>

                                            <Separator />

                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rental Window</p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{formatDate(booking.start_date)} {formatTime(booking.pickup_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{formatDate(booking.end_date)} {formatTime(booking.return_time)}</span>
                                                </div>
                                                {booking.pickup_location?.location && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">{booking.pickup_location.location}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <Separator />

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Rental</span>
                                                <span className="font-semibold text-foreground">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-foreground">Total</span>
                                                <span className="text-base font-bold text-foreground">{formatPrice(totalAmount)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Payments */}
                                    <Card>
                                        <CardContent className="p-5">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <Banknote className="w-3.5 h-3.5" />
                                                Payments
                                            </p>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm text-muted-foreground">Total Paid</span>
                                                <span className="text-sm font-bold text-foreground">{formatPrice(totalPaid)}</span>
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Remaining</span>
                                                {remainingBalance > 0 ? (
                                                    <Badge variant="destructive" className="text-xs font-bold">{formatPrice(remainingBalance)}</Badge>
                                                ) : (
                                                    <span className="text-sm font-bold text-emerald-600">{formatPrice(remainingBalance)}</span>
                                                )}
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${paymentPercent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                    style={{ width: `${paymentPercent}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">{paymentPercent}% paid</p>
                                        </CardContent>
                                    </Card>

                                    <Link href={backUrl} className="block">
                                        <Button variant="outline" className="w-full">
                                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                                            Back to Booking
                                        </Button>
                                    </Link>
                                </div>
                            </aside>

                            {/* Main */}
                            <main className="flex-1 min-w-0 space-y-4">
                                {/* Current vs New window */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Current Return</p>
                                            <p className="text-base font-bold text-foreground">{formatDate(booking.end_date)}</p>
                                            <p className="text-sm text-muted-foreground">{formatTime(booking.return_time)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-2 border-dashed border-primary/40 dark:border-primary/50">
                                        <CardContent className="p-4">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">New Return</p>
                                            <p className="text-base font-bold text-primary">{formatDate(newEndDate)}</p>
                                            <p className="text-sm text-muted-foreground">{formatTime(newReturnTime)}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Form */}
                                <form onSubmit={e => { e.preventDefault(); submit(); }}>
                                    <Card>
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">Choose a New Return Date</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {maxExtendableDate && maxExtendableDate >= booking.end_date
                                                            ? `This car is available for extension until ${formatDate(maxExtendableDate)}.`
                                                            : 'Pick a new return date for this rental.'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-xs font-medium text-muted-foreground">Current return {formatTime(booking.return_time)}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs font-medium">New Return Date</Label>
                                                    <Input
                                                        type="date"
                                                        min={minDate}
                                                        max={maxDate}
                                                        value={newEndDate}
                                                        onChange={e => setNewEndDate(e.target.value)}
                                                        className="mt-1.5"
                                                    />
                                                    <p className="text-[11px] text-muted-foreground mt-1">Earliest: {formatDate(minDate)}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-medium">New Return Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={newReturnTime}
                                                        min={timeMin}
                                                        max={timeMax}
                                                        onChange={e => setNewReturnTime(e.target.value)}
                                                        className="mt-1.5"
                                                    />
                                                    <p className="text-[11px] text-muted-foreground mt-1">
                                                        {isSameDay
                                                            ? `Must be after ${formatTime(booking.return_time)}${timeMax ? ` and before ${formatTime(timeMax)}` : ''}`
                                                            : `Any time on ${formatDate(newEndDate)}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {quoteError && (
                                                <div className="px-4 py-3.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 flex items-start gap-3">
                                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-medium">{quoteError.error}</p>
                                                        {quoteError.max_extendable_date && quoteError.max_extendable_date > booking.end_date && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewEndDate(quoteError.max_extendable_date!)}
                                                                className="mt-1.5 text-xs font-bold text-red-700 dark:text-red-400 underline underline-offset-2"
                                                            >
                                                                Extend until {formatDate(quoteError.max_extendable_date!)} instead
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {alternates.length > 0 && (selectedCarId !== null || quoteError) && (
                                                <div className="rounded-xl border border-border bg-muted/40 p-4">
                                                    <p className="text-xs font-bold text-foreground mb-2.5">
                                                        {selectedCarId !== null
                                                            ? 'Switch to another vehicle for this period:'
                                                            : 'Available alternative vehicles for this period:'}
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                        {paginatedAlternates.map(car => (
                                                            <AlternateCarItem
                                                                key={car.id}
                                                                car={car}
                                                                selected={selectedCarId === car.id}
                                                                onSelect={() => setSelectedCarId(selectedCarId === car.id ? null : car.id)}
                                                                onKeep={() => setSelectedCarId(null)}
                                                            />
                                                        ))}
                                                    </div>
                                                    {alternateTotalPages > 1 && (
                                                        <div className="mt-2.5 flex items-center justify-between gap-2">
                                                            <button
                                                                type="button"
                                                                disabled={alternatePage <= 1}
                                                                onClick={() => setAlternatePage(p => Math.max(1, p - 1))}
                                                                className="text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                ← Prev
                                                            </button>
                                                            <span className="text-xs text-muted-foreground">Page {alternatePage} of {alternateTotalPages}</span>
                                                            <button
                                                                type="button"
                                                                disabled={alternatePage >= alternateTotalPages}
                                                                onClick={() => setAlternatePage(p => Math.min(alternateTotalPages, p + 1))}
                                                                className="text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                Next →
                                                            </button>
                                                        </div>
                                                    )}
                                                    {selectedCarId !== null && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedCarId(null)}
                                                            className="mt-2.5 text-xs font-bold text-primary underline underline-offset-2 hover:text-primary/80"
                                                        >
                                                            Keep {booking.car.brand} {booking.car.model} instead
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                    {quoteLoading && (
                                                        <>
                                                            <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                            Checking availability…
                                                        </>
                                                    )}
                                                    {!quoteLoading && !quote && !quoteError && 'Choose a date to see the cost.'}
                                                </p>
                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    disabled={form.processing || !!quoteError}
                                                >
                                                    {form.processing ? 'Saving…' : (quote?.is_swap ? 'Reserve This Vehicle' : 'Confirm Extension')}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </form>

                                {/* Quote summary */}
                                {quote && !quoteError && (
                                    <Card>
                                        <CardContent className="p-5 space-y-2.5">
                                            <p className="text-sm font-bold text-foreground">
                                                {quote.is_swap ? 'New Reservation Summary' : 'Extension Summary'}
                                            </p>

                                            {quote.is_swap && (
                                                <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 space-y-1">
                                                    <p className="text-xs font-bold text-primary">Vehicle Changed — New Reservation</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {quote.car.brand} {quote.car.model} ({quote.car.year}) · {formatPrice(quote.daily_rate)}/day
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Pickup {formatDate(quote.current_end_date)} {quote.current_return_time ? `(${formatTime(quote.current_return_time)})` : ''} → Return {formatDate(quote.new_end_date)}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {formatPrice(quote.daily_rate)} × {daysChanged} {quote.is_swap ? '' : 'extra '}{daysChanged === 1 ? 'day' : 'days'}
                                                </span>
                                                <span className="font-semibold text-foreground">{formatPrice(quote.extension_subtotal)}</span>
                                            </div>

                                            {quote.taxes.filter(t => t.add_or_minus).length > 0 && (
                                                <div className="border-t border-dashed border-border pt-2.5 space-y-1.5">
                                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Taxes & Fees</p>
                                                    {quote.taxes.filter(t => t.add_or_minus).map((t, i) => (
                                                        <div key={i} className="flex items-center justify-between text-sm">
                                                            <span className="text-muted-foreground">{t.tax_desc}</span>
                                                            <span className="font-medium text-foreground">+{formatPrice(t.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {quote.total_surcharge > 0 && quote.taxes.filter(t => t.add_or_minus).length === 0 && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Surcharges</span>
                                                    <span className="font-medium text-foreground">+{formatPrice(quote.total_surcharge)}</span>
                                                </div>
                                            )}

                                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                                <span className="text-sm font-bold text-foreground">
                                                    {quote.is_swap ? 'New Reservation Total' : 'Additional Amount Due'}
                                                </span>
                                                <span className="text-lg font-extrabold text-accent-600 dark:text-accent-400">{formatPrice(quote.is_swap ? quote.new_total_amount : quote.additional_total)}</span>
                                            </div>

                                            {!quote.is_swap && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">New Booking Total</span>
                                                    <span className="text-sm font-bold text-foreground">{formatPrice(quote.new_total_amount)}</span>
                                                </div>
                                            )}

                                            {quote.is_swap && (
                                                <p className="text-[11px] text-muted-foreground pt-1">
                                                    This is a separate reservation. The original booking ({booking.car.brand} {booking.car.model}, returning {formatDate(booking.end_date)}) is unchanged.
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Payment hint */}
                                {quote && !quoteError && (
                                    <Card>
                                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    <Banknote className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        Additional amount due {formatPrice(quote.additional_total)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        After confirming, record the payment from the booking page. Current balance outstanding: {formatPrice(remainingBalance)}.
                                                    </p>
                                                </div>
                                            </div>
                                            <Link href={backUrl} className="shrink-0">
                                                <Button variant="outline" size="sm">
                                                    <Banknote className="w-4 h-4 mr-1.5" />
                                                    Record Payment
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                )}
                            </main>
                        </div>
                    </div>
                )}
            </AuthenticatedLayout>
        </>
    );
}
