import { useEffect, useMemo, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';

export const ALTERNATES_PER_PAGE = 8;

export interface ExtendCar {
    id: number;
    brand: string;
    model: string;
    year: number;
    daily_rate: number;
    image_path: string | null;
    vehicle_type?: string | null;
}

export interface ExtendBooking {
    id: number;
    reference_code: string | null;
    start_date: string;
    end_date: string;
    pickup_time: string | null;
    return_time: string | null;
    total_amount: number;
    status: string;
    car: ExtendCar & { license_plate: string };
    guest?: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string | null;
    } | null;
    user?: { name: string; email?: string; phone?: string | null } | null;
    pickup_location?: { location: string } | null;
    return_location?: { location: string } | null;
    coupon_usage?: { code: string; discount_amount: number } | null;
    booking_taxes?: { tax_desc: string; amount: number; add_or_minus: boolean }[];
    payments?: { id: number; type: string; amount: number; payment_status: string; created_at: string }[];
}

export interface QuoteResult {
    extension_days: number;
    daily_rate: number;
    extension_subtotal: number;
    taxes: { tax_desc: string; amount: number; add_or_minus: boolean }[];
    total_tax: number;
    total_surcharge: number;
    additional_total: number;
    new_total_amount: number;
    current_end_date: string;
    current_return_time: string | null;
    new_end_date: string;
    new_return_time: string | null;
    max_extendable_date: string | null;
    max_return_time: string | null;
    alternate_cars: ExtendCar[];
    car_id: number;
    is_swap: boolean;
    car: ExtendCar;
}

export interface QuoteError {
    error: string;
    max_extendable_date?: string | null;
    alternate_cars?: ExtendCar[];
}

export const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const formatDate = (value: string) =>
    new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

export const formatTime = (value: string | null) => {
    if (!value) return '—';
    const [h, m] = value.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return value;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const toInputDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const addDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return toInputDate(d);
};

export const addMinutesToTime = (t: string, mins: number) => {
    const [h, m] = t.split(':').map(Number);
    const total = (h * 60 + m + mins) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export function calcRentalDays(pickupDate: string, pickupTime: string | null, returnDate: string, returnTime: string | null): number {
    const toHHMM = (t?: string | null) => (t && t.length >= 5 ? t.substring(0, 5) : t || '');
    const start = new Date(`${pickupDate}T${toHHMM(pickupTime) || '00:00'}:00`);
    const end = new Date(`${returnDate}T${toHHMM(returnTime) || '23:59'}:00`);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export interface ExtendProps {
    booking: ExtendBooking;
    extendable: boolean;
    extendBlockedMessage: string | null;
    maxExtendableDate: string | null;
    quoteUrl: string;
    submitUrl: string;
    backUrl: string;
    isGuest: boolean;
    isAdmin: boolean;
    maxReturnTime: string | null;
}

interface UseExtensionQuoteOptions {
    booking: ExtendBooking;
    extendable: boolean;
    maxExtendableDate: string | null;
    quoteUrl: string;
    submitUrl: string;
    maxReturnTime: string | null;
}

export function useExtensionQuote({ booking, extendable, maxExtendableDate, quoteUrl, submitUrl, maxReturnTime }: UseExtensionQuoteOptions) {
    const flash = (usePage().props as any).flash as { success?: string; error?: string } | undefined;
    const [flashVisible, setFlashVisible] = useState(true);
    useEffect(() => { if (flash?.success || flash?.error) setFlashVisible(true); }, []);

    const currentTime = booking.return_time ? booking.return_time.substring(0, 5) : '23:59';
    const [newEndDate, setNewEndDate] = useState(booking.end_date);
    const [newReturnTime, setNewReturnTime] = useState(currentTime);
    const [quote, setQuote] = useState<QuoteResult | null>(null);
    const [quoteError, setQuoteError] = useState<QuoteError | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
    const [alternates, setAlternates] = useState<ExtendCar[]>([]);
    const [alternatePage, setAlternatePage] = useState(1);

    // Jump back to the first page whenever a new availability result arrives.
    useEffect(() => {
        setAlternatePage(1);
    }, [alternates]);

    const paginatedAlternates = useMemo(() => {
        const start = (alternatePage - 1) * ALTERNATES_PER_PAGE;

        return alternates.slice(start, start + ALTERNATES_PER_PAGE);
    }, [alternates, alternatePage]);

    const alternateTotalPages = Math.max(1, Math.ceil(alternates.length / ALTERNATES_PER_PAGE));

    const minDate = booking.end_date;

    // The date cap follows the currently selected car. A successful quote is
    // authoritative even when its cap is null (car free = unlimited); only when
    // there is no quote yet do we fall back to the original car's page-level cap,
    // then a 60-day safety window.
    const effectiveMaxDate = quote !== null ? quote.max_extendable_date : maxExtendableDate;
    const maxDate = effectiveMaxDate && effectiveMaxDate >= minDate
        ? effectiveMaxDate
        : addDays(booking.end_date, 60);

    // Same-day extensions are bounded in time too: the new return time must be
    // after the current one and before the next pickup on the same day. Again,
    // a successful quote's null cap means the selected car has no time limit.
    const isSameDay = newEndDate === booking.end_date;
    const returnTimeCap = quote !== null ? quote.max_return_time : maxReturnTime;
    const timeMin = isSameDay && currentTime !== '23:59' ? addMinutesToTime(currentTime, 1) : undefined;
    const timeMax = isSameDay && returnTimeCap ? returnTimeCap : undefined;

    const form = useForm({
        new_end_date: booking.end_date,
        new_return_time: currentTime,
        car_id: null as number | null,
    });

    const csrfToken = useMemo(
        () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
        [],
    );

    const fetchQuote = (endDate: string, returnTime: string) => {
        setQuoteLoading(true);
        setQuoteError(null);
        fetch(quoteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({
                new_end_date: endDate,
                new_return_time: returnTime,
                car_id: selectedCarId ?? null,
            }),
        })
            .then(async r => {
                const data = await r.json();
                if (!r.ok) {
                    setQuoteError(data as QuoteError);
                    setAlternates((data as QuoteError).alternate_cars ?? []);
                    setQuote(null);
                    return;
                }
                const result = data as QuoteResult;
                setQuote(result);
                if (selectedCarId === null) setAlternates([]);
            })
            .catch(() => {
                setQuoteError({ error: 'Unable to check availability right now. Please try again.' });
                setQuote(null);
            })
            .finally(() => setQuoteLoading(false));
    };

    useEffect(() => {
        if (!extendable) return;
        const id = setTimeout(() => fetchQuote(newEndDate, newReturnTime), 400);
        return () => clearTimeout(id);
    }, [newEndDate, newReturnTime, extendable, selectedCarId]);

    const daysChanged = quote ? quote.extension_days : 0;

    const submit = () => {
        form.setData({ new_end_date: newEndDate, new_return_time: newReturnTime, car_id: selectedCarId ?? null });
        form.post(submitUrl, { preserveScroll: true });
    };

    return {
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
        effectiveMaxDate,
        daysChanged,
        form,
        submit,
    };
}
