import { useEffect, useMemo, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import type { VehicleDamage } from '@/lib/carZones';

export interface SwapCar {
    id: number;
    brand: string;
    model: string;
    year: number;
    daily_rate: number;
    image_path: string | null;
    vehicle_type?: string | null;
    license_plate?: string;
}

export interface SwapBooking {
    id: number;
    reference_code: string | null;
    start_date: string;
    end_date: string;
    pickup_time: string | null;
    return_time: string | null;
    total_amount: number;
    status: string;
    car: SwapCar;
    guest?: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string | null;
    } | null;
    user?: { name: string; email?: string; phone?: string | null } | null;
    pickup_location?: { location: string } | null;
    return_location?: { location: string } | null;
}

export interface SwapSegment {
    car: SwapCar | null;
    start_date: string;
    end_date: string;
    days: number;
    daily_rate: number;
    subtotal: number;
}

export interface SwapQuoteResult {
    from_car: SwapCar;
    to_car: SwapCar;
    swap_date: string;
    from_days: number;
    to_days: number;
    from_subtotal: number;
    to_subtotal: number;
    old_total_amount: number;
    new_total_amount: number;
    price_delta: number;
    segments: SwapSegment[];
    taxes: { tax_desc: string; amount: number; add_or_minus: boolean }[];
}

export interface SwapProps {
    booking: SwapBooking;
    cars: SwapCar[];
    swaps: Array<{
        id: number;
        swap_date: string;
        swap_time: string | null;
        from_days: number;
        to_days: number;
        from_subtotal: number;
        to_subtotal: number;
        old_total_amount: number;
        new_total_amount: number;
        price_delta: number;
        from_car: SwapCar | null;
        to_car: SwapCar | null;
    }>;
    pickup_handover?: {
        fuel_level: number | null;
        odometer: number | null;
        notes: string | null;
        damages: VehicleDamage[] | null;
    } | null;
    carDamages?: Record<string, VehicleDamage[]>;
    quoteUrl: string;
    submitUrl: string;
    backUrl: string;
    isGuest: boolean;
    isAdmin: boolean;
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

export const addHoursToTime = (time: string, hours: number) => {
    const [h, m] = time.split(':').map(Number);
    const total = (h || 0) + hours;
    const hh = total >= 24 ? total - 24 : total;
    return `${String(hh).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`;
};

export function useSwapQuote({
    booking,
    quoteUrl,
    submitUrl,
    captureHandover = false,
}: {
    booking: SwapBooking;
    quoteUrl: string;
    submitUrl: string;
    captureHandover?: boolean;
}) {
    const flash = (usePage().props as any).flash as { success?: string; error?: string } | undefined;
    const [flashVisible, setFlashVisible] = useState(true);
    useEffect(() => { if (flash?.success || flash?.error) setFlashVisible(true); }, []);

    const pickupTime = booking.pickup_time ? booking.pickup_time.substring(0, 5) : '10:00';
    const minSwapTime = addHoursToTime(pickupTime, 2);
    const minDate = booking.start_date;
    const maxDate = booking.end_date;

    // Default to the day after pickup so the prefilled swap time is never below
    // the minimum-usage threshold. Same-day rentals fall back to pickup + 2h.
    const defaultSwapDate = minDate !== maxDate ? addDays(minDate, 1) : minDate;
    const defaultSwapTime = defaultSwapDate === minDate ? minSwapTime : pickupTime;

    const [swapDate, setSwapDate] = useState(defaultSwapDate);
    const [swapTime, setSwapTime] = useState(defaultSwapTime);
    const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
    const [quote, setQuote] = useState<SwapQuoteResult | null>(null);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteTime, setQuoteTime] = useState<string | null>(null);

    const csrfToken = useMemo(
        () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
        [],
    );

    const fetchQuote = (date: string, time: string, carId: number) => {
        setQuoteLoading(true);
        setQuoteError(null);
        setQuoteTime(null);
        fetch(quoteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({ car_id: carId, swap_date: date, swap_time: time }),
        })
            .then(async r => {
                const data = await r.json();
                if (!r.ok) {
                    setQuoteError(data.error ?? 'Unable to check availability right now. Please try again.');
                    setQuote(null);
                    return;
                }
                setQuote(data as SwapQuoteResult);
                setQuoteTime(time);
            })
            .catch(() => {
                setQuoteError('Unable to check availability right now. Please try again.');
                setQuote(null);
            })
            .finally(() => setQuoteLoading(false));
    };

    useEffect(() => {
        if (selectedCarId === null) return;
        // Drop any stale error the moment the selection changes so the button is
        // not held disabled during the debounce before the new quote arrives.
        setQuoteError(null);
        const id = setTimeout(() => fetchQuote(swapDate, swapTime, selectedCarId), 400);
        return () => clearTimeout(id);
    }, [swapDate, swapTime, selectedCarId]);

    const form = useForm({
        car_id: null as number | null,
        swap_date: defaultSwapDate,
        swap_time: defaultSwapTime,
        swap_out_fuel: '',
        swap_out_odometer: '',
        swap_out_notes: '',
        swap_out_damages: [] as VehicleDamage[],
        swap_out_no_damage: false,
        swap_in_fuel: '',
        swap_in_odometer: '',
        swap_in_notes: '',
        swap_in_damages: [] as VehicleDamage[],
        swap_in_no_damage: false,
    });

    const handoverComplete = !captureHandover || (
        form.data.swap_out_fuel !== ''
        && form.data.swap_out_odometer !== ''
        && form.data.swap_in_fuel !== ''
        && form.data.swap_in_odometer !== ''
        && (form.data.swap_out_no_damage || form.data.swap_out_damages.length > 0)
        && (form.data.swap_in_no_damage || form.data.swap_in_damages.length > 0)
    );

    // True when the admin has entered anything into the handover form, used to
    // warn before leaving the page so inspection data is not lost.
    const hasHandoverInput = captureHandover && (
        form.data.swap_out_fuel !== ''
        || form.data.swap_out_odometer !== ''
        || form.data.swap_out_notes !== ''
        || form.data.swap_out_damages.length > 0
        || form.data.swap_out_no_damage
        || form.data.swap_in_fuel !== ''
        || form.data.swap_in_odometer !== ''
        || form.data.swap_in_notes !== ''
        || form.data.swap_in_damages.length > 0
        || form.data.swap_in_no_damage
    );

    const submit = () => {
        if (selectedCarId === null) {
            setQuoteError('Choose a vehicle to swap to first.');
            return;
        }
        form.setData(d => ({ ...d, car_id: selectedCarId, swap_date: swapDate, swap_time: swapTime }));
        form.post(submitUrl, { preserveScroll: true });
    };

    return {
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
        quoteTime,
        minDate,
        maxDate,
        minSwapTime,
        captureHandover,
        handoverComplete,
        hasHandoverInput,
        form,
        submit,
    };
}
