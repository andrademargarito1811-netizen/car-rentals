import { router } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRoute } from 'ziggy-js';
import { countries } from '@/data/countries';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface Location {
    location_id: number;
    location: string;
    address: string | null;
}

interface CarBrief {
    id: number;
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    daily_rate: number;
    grace_minutes: number;
    image_path: string | null;
    location: { location: string } | null;
    bookings: { start_date: string; end_date: string; pickup_time?: string | null; return_time?: string | null; status: string }[];
}

function parseOverlapStart(b: { start_date: string; pickup_time?: string | null }): Date {
    const [y, m, d] = b.start_date.split('-').map(Number);
    const [h, mn] = (b.pickup_time || '00:00').split(':').map(Number);
    return new Date(y, m - 1, d, h, mn);
}
function parseOverlapEnd(b: { end_date: string; return_time?: string | null }): Date {
    const [y, m, d] = b.end_date.split('-').map(Number);
    const [h, mn] = (b.return_time || '23:59').split(':').map(Number);
    return new Date(y, m - 1, d, h, mn);
}
function parseOverlapEndWithBuffer(b: { end_date: string; return_time?: string | null }, graceMinutes: number = 30): Date {
    const date = parseOverlapEnd(b);
    date.setMinutes(date.getMinutes() + graceMinutes);
    return date;
}

function getEarliestAvailable(
    car: CarBrief,
    start: string,
    end: string,
    pickupTime: string,
    returnTime: string,
): Date | null {
    const [y1, m1, d1] = start.split('-').map(Number);
    const [h1, mn1] = (pickupTime || '10:00').split(':').map(Number);
    const [y2, m2, d2] = end.split('-').map(Number);
    const [h2, mn2] = (returnTime || '10:00').split(':').map(Number);
    const newStart = new Date(y1, m1 - 1, d1, h1, mn1);
    const newEnd = new Date(y2, m2 - 1, d2, h2, mn2);
    const grace = car.grace_minutes ?? 30;
    let latest: Date | null = null;
    for (const b of car.bookings) {
        const bs = parseOverlapStart(b);
        const be = parseOverlapEndWithBuffer(b, grace);
        if (newStart < be && bs < newEnd) {
            if (!latest || be > latest) latest = be;
        }
    }
    return latest;
}

function formatDateTime(d: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[d.getMonth()];
    const day = d.getDate();
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${m} ${day}, ${h12}:${mins} ${ampm}`;
}

function toLocalIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

const TITLE_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Mx.', 'Dr.', 'Prof.'];

const selectClass = `w-full text-sm px-2 py-1.5 rounded-lg border border-surface-200 dark:border-surface-600/40 bg-white dark:bg-brand-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-accent-400/30 appearance-none bg-[length:0.75rem] bg-[right_0.5rem_center] bg-no-repeat pr-7`;

interface QuickBookingPanelProps {
    open: boolean;
    onClose: () => void;
    selectedCarIds: number[];
    selectedCars: CarBrief[];
    defaultDate: string;
    locations?: Location[];
    bookingTerms?: string | null;
}

const CAR_IMAGES = [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop',
];

function getCarImage(car: CarBrief) {
    return car.image_path ? `/storage/${car.image_path}` : CAR_IMAGES[car.id % CAR_IMAGES.length];
}

function getDatesBetween(start: string, end: string): string[] {
    const dates: string[] = [];
    const cursor = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    while (cursor <= endDate) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
}

function hasOverlap(start: string, end: string, pickupTime: string, returnTime: string, bookings: { start_date: string; end_date: string; pickup_time?: string | null; return_time?: string | null }[], graceMinutes: number = 30): boolean {
    const [y1, m1, d1] = start.split('-').map(Number);
    const [h1, mn1] = (pickupTime || '10:00').split(':').map(Number);
    const [y2, m2, d2] = end.split('-').map(Number);
    const [h2, mn2] = (returnTime || '10:00').split(':').map(Number);
    const newStart = new Date(y1, m1 - 1, d1, h1, mn1);
    const newEnd = new Date(y2, m2 - 1, d2, h2, mn2);
    return bookings.some((b) => {
        const bs = parseOverlapStart(b);
        const be = parseOverlapEndWithBuffer(b, graceMinutes);
        return newStart < be && bs < newEnd;
    });
}

function formatPrice(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

const inputClass =
    'w-full text-sm px-2 py-1.5 rounded-lg border border-surface-200 dark:border-surface-600/40 bg-white dark:bg-brand-800 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-400/30 transition-all duration-200';

const STEPS = [
    { num: 1, label: 'Dates', desc: 'Pick times & locations' },
    { num: 2, label: 'Guest', desc: 'Renter details' },
    { num: 3, label: 'License', desc: 'Driver license' },
    { num: 4, label: 'Confirm', desc: 'Review & book' },
];

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

interface AppliedCoupon {
    code: string;
    type: 'percent' | 'fixed' | 'per_day' | 'day_free';
    value: number;
    label: string;
    min_rate?: number;
}

export default function QuickBookingPanel({ open, onClose, selectedCarIds, selectedCars, defaultDate, locations, bookingTerms }: QuickBookingPanelProps) {
    const route = useRoute();
    const panelRef = useRef<HTMLDivElement>(null);
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [form, setForm] = useState({
        start_date: defaultDate,
        end_date: defaultDate,
        title: 'Mr.',
        first_name: '',
        last_name: '',
        driver_age: '',
        phone: '',
        email: '',
        email_confirmation: '',
        address: '',
        address2: '',
        country: 'Palau',
        state: '',
        city: '',
        postal_code: '',
        company_name: '',
        flight_no: '',
        driver_first_name: '',
        driver_last_name: '',
        driver_birth_date: '',
        license_number: '',
        license_category: '',
        license_expiry: '',
        driver_is_renter: false,
        pickup_time: '10:00',
        return_time: '10:00',
        pickup_location: '',
        return_location: '',
        agree_terms: false,
    });

    const update = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }));

    const handleSameAsRenter = (checked: boolean) => {
        setForm((f) => ({
            ...f,
            driver_is_renter: checked,
            driver_first_name: checked ? f.first_name : f.driver_first_name,
            driver_last_name: checked ? f.last_name : f.driver_last_name,
        }));
    };

    // Reset step + auto-fill when panel opens
    useEffect(() => {
        if (open) {
            setStep(1);
            setDirection(1);
            setShowSuccess(false);
            setSubmitting(false);
            const carLoc = selectedCars.length === 1 && selectedCars[0].location?.location;
            setForm((f) => ({
                ...f,
                start_date: defaultDate,
                end_date: defaultDate,
                pickup_location: carLoc || '',
                return_location: carLoc || '',
            }));
        }
    }, [open, defaultDate, selectedCars]);

    // Escape to close or go back
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (step > 1) { setDirection(-1); setStep((s) => s - 1); }
                else onClose();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, step, onClose]);

    const billingDays = useMemo(() => {
        if (!form.start_date || !form.end_date) return 0;
        const toHHMM = (t?: string) => (t && t.length >= 5 ? t.substring(0, 5) : t || '');
        const start = new Date(`${form.start_date}T${toHHMM(form.pickup_time) || '00:00'}:00`);
        const end = new Date(`${form.end_date}T${toHHMM(form.return_time) || '23:59'}:00`);
        const diffMs = end.getTime() - start.getTime();
        return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }, [form.start_date, form.end_date, form.pickup_time, form.return_time]);

    const todayIsoPanel = toLocalIso(new Date());

    const driverAge = useMemo(() => {
        if (!form.driver_birth_date) return null;
        const dob = new Date(form.driver_birth_date + 'T00:00:00');
        if (isNaN(dob.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age;
    }, [form.driver_birth_date]);

    const overlappingCars = useMemo(() => {
        return selectedCars
            .filter((car) => hasOverlap(form.start_date, form.end_date, form.pickup_time, form.return_time, car.bookings, car.grace_minutes ?? 30))
            .map((car) => ({
                car,
                blockingUntil: getEarliestAvailable(car, form.start_date, form.end_date, form.pickup_time, form.return_time),
            }));
    }, [selectedCars, form.start_date, form.end_date, form.pickup_time, form.return_time]);

    // Price calculation from first car
    const firstCar = selectedCars[0];
    const dailyRate = firstCar?.daily_rate || 0;
    const subtotal = dailyRate * billingDays;

    // Coupon / discount state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponApplying, setCouponApplying] = useState(false);

    const discount = useMemo(() => {
        if (!appliedCoupon) return 0;
        switch (appliedCoupon.type) {
            case 'percent':
                return subtotal * (appliedCoupon.value / 100);
            case 'fixed':
                return Math.min(appliedCoupon.value, subtotal);
            case 'per_day':
                return Math.min(appliedCoupon.value * billingDays, subtotal);
            case 'day_free': {
                const freeDays = Math.min(appliedCoupon.value, billingDays);
                return freeDays * dailyRate;
            }
            default:
                return 0;
        }
    }, [appliedCoupon, subtotal, billingDays, dailyRate]);

    const applyCoupon = async () => {
        const code = couponCode.trim().toUpperCase();
        if (!code) { setCouponError('Enter a coupon code.'); return; }
        setCouponApplying(true);
        setCouponError('');
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        try {
            const res = await fetch(route('coupons.validate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
                body: JSON.stringify({ code, subtotal, daily_rate: dailyRate, billing_days: billingDays }),
            });
            const data = await res.json();
            if (data.valid) {
                setAppliedCoupon(data.coupon);
            } else {
                setAppliedCoupon(null);
                setCouponError(data.message || 'Invalid coupon code.');
            }
        } catch {
            setAppliedCoupon(null);
            setCouponError('Could not validate coupon. Please try again.');
        }
        setCouponApplying(false);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    // Tax state
    const [taxes, setTaxes] = useState<{ id: number; tax_desc: string; category: string; amount: number; add_or_minus: boolean }[]>([]);
    const [totalTax, setTotalTax] = useState(0);
    const [totalSurcharge, setTotalSurcharge] = useState(0);
    const [totalTaxDiscount, setTotalTaxDiscount] = useState(0);

    const totalFees = totalTax + totalSurcharge;
    const estimatedTotal = subtotal + totalFees - totalTaxDiscount - discount;

    // Fetch taxes when relevant data changes
    useEffect(() => {
        if (!firstCar || !billingDays) return;
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(route('taxes.calculate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
            body: JSON.stringify({
                car_id: firstCar.id,
                pickup_location: form.pickup_location || null,
                billing_days: billingDays,
                daily_rate: dailyRate,
                subtotal,
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                setTaxes(data.taxes || []);
                setTotalTax(data.total_tax || 0);
                setTotalSurcharge(data.total_surcharge || 0);
                setTotalTaxDiscount(data.total_discount || 0);
            })
            .catch(() => {
                setTaxes([]);
                setTotalTax(0);
                setTotalSurcharge(0);
                setTotalTaxDiscount(0);
            });
    }, [firstCar?.id, billingDays, dailyRate, form.pickup_location]);

    const isValidStep1 = form.start_date && form.end_date && form.pickup_location && form.return_location;
    const isValidStep2 = form.first_name && form.last_name && form.email && form.email_confirmation && form.email === form.email_confirmation;
    const isValidStep3 = !!(form.driver_first_name && form.driver_last_name && form.driver_birth_date && form.license_number && form.license_category && form.license_expiry && driverAge !== null && driverAge >= 18 && form.license_expiry > todayIsoPanel);
    const isValid = isValidStep1 && isValidStep2 && isValidStep3 && form.agree_terms;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCarIds.length || !isValid || submitting) return;

        setSubmitting(true);

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

        const payload = {
            title: form.title,
            first_name: form.first_name,
            last_name: form.last_name,
            driver_age: driverAge !== null ? String(driverAge) : form.driver_age,
            phone: form.phone,
            email: form.email,
            email_confirmation: form.email_confirmation || form.email,
            address: form.address,
            address2: form.address2,
            country: form.country,
            state: form.state,
            city: form.city,
            postal_code: form.postal_code,
            company_name: form.company_name,
            flight_no: form.flight_no,
            driver_info_required: true,
            driver_is_renter: form.driver_is_renter,
            driver_first_name: form.driver_first_name,
            driver_last_name: form.driver_last_name,
            driver_birth_date: form.driver_birth_date,
            license_number: form.license_number,
            license_category: form.license_category,
            license_expiry: form.license_expiry,
            pickup_date: form.start_date,
            pickup_time: form.pickup_time,
            pickup_location: form.pickup_location,
            return_date: form.end_date,
            return_time: form.return_time,
            return_location: form.return_location,
            coupon_code: appliedCoupon?.code || null,
            discount: discount,
            tax_breakdown: taxes,
            total_tax: totalTax,
            total_surcharge: totalSurcharge,
            agree_terms: true,
        };

        const headers: Record<string, string> = {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

        try {
            const results = await Promise.all(
                selectedCarIds.map((carId) =>
                    fetch(route('reservations.store'), {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ ...payload, car_id: carId }),
                    })
                )
            );
            const allOk = results.every((r) => r.ok);
            if (!allOk) {
                const firstError = results.find((r) => !r.ok);
                if (firstError?.status === 429) {
                    alert('Too many booking attempts — please wait a minute and try again.');
                    setSubmitting(false);
                    return;
                }
                const errorText = firstError ? await firstError.text() : 'Unknown error';
                let message = 'Booking failed. ';
                try {
                    const parsed = JSON.parse(errorText);
                    if (parsed.errors) {
                        message += Object.values(parsed.errors).flat().join('. ');
                    } else if (parsed.message) {
                        message += parsed.message;
                    }
                } catch {
                    message += errorText.slice(0, 200);
                }
                alert(message);
                setSubmitting(false);
                return;
            }
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 4000);
            setTimeout(() => window.location.reload(), 4200);
        } catch (e) {
            console.error('Booking submission error:', e);
            alert('An unexpected error occurred. Please try again.');
            setSubmitting(false);
        }
    };

    if (!open) return null;

    const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={step > 1 ? () => { setDirection(-1); setStep((s) => s - 1); } : onClose} />

            {/* Panel */}
            <div ref={panelRef} className="group fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white dark:bg-brand-900 shadow-2xl border-l border-surface-200 dark:border-surface-700/60 flex flex-col animate-slide-in">
                {/* Drag handle */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-10 rounded-full bg-white dark:bg-brand-800 border border-surface-200 dark:border-surface-700/60 shadow-md flex items-center justify-center cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-2 h-2 text-surface-400" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="2" cy="2" r="1" /><circle cx="6" cy="2" r="1" /><circle cx="2" cy="6" r="1" /><circle cx="6" cy="6" r="1" />
                    </svg>
                </div>

                {/* Header */}
                <div className="shrink-0 px-5 py-4 border-b border-surface-100 dark:border-surface-700/60">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-sm font-bold text-surface-900 dark:text-white">Quick Book</h2>
                            <p className="text-xs text-surface-400 dark:text-surface-500">Walk-in reservation</p>
                        </div>
                        <button type="button" onClick={step > 1 ? () => { setDirection(-1); setStep((s) => s - 1); } : onClose}
                            className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700/40 hover:bg-surface-200 dark:hover:bg-surface-700/60 flex items-center justify-center text-surface-500 dark:text-surface-400 transition-colors">
                            {step > 1 ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Step progress bar */}
                    <div className="flex items-center justify-between">
                        {STEPS.map((s, i) => (
                            <div key={s.num} className="flex items-center gap-1.5 flex-1 last:flex-none">
                                <div className={`flex items-center gap-1.5 ${s.num === step ? 'text-accent-600 dark:text-accent-400' : s.num < step ? 'text-emerald-500' : 'text-surface-300 dark:text-surface-600'}`}>
                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300 ${
                                        s.num === step ? 'bg-accent-400 text-white shadow-sm shadow-accent-400/30' :
                                        s.num < step ? 'bg-emerald-400 text-white' :
                                        'bg-surface-100 dark:bg-surface-700/40 text-surface-400'
                                    }`}>
                                        {s.num < step ? (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : s.num}
                                    </span>
                                    <span className="text-[10px] font-semibold hidden sm:inline">{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700/40 relative overflow-hidden mx-1">
                                        <div className="absolute inset-0 bg-gradient-to-r from-accent-400 to-accent-500 transition-all duration-500"
                                            style={{ width: s.num < step ? '100%' : '0%' }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Car image thumbnail — horizontal card, no crop */}
                {firstCar && (
                    <div className="shrink-0 flex items-stretch bg-surface-50 dark:bg-brand-800/60 border-b border-surface-100 dark:border-surface-700/60">
                        <div className="w-32 sm:w-36 bg-surface-100 dark:bg-brand-900 flex items-center justify-center p-2">
                            <img src={getCarImage(firstCar)} alt={`${firstCar.brand} ${firstCar.model}`}
                                className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center">
                            <p className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">{firstCar.brand} · {firstCar.year}</p>
                            <p className="text-sm font-bold text-surface-900 dark:text-white truncate">{firstCar.model}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-surface-400 dark:text-surface-500 font-mono">
                                <span>{firstCar.license_plate}</span>
                                <span className="w-1 h-1 rounded-full bg-surface-300" />
                                <span className="font-bold text-accent-600 dark:text-accent-400">{formatPrice(dailyRate)}<span className="font-normal text-surface-400 dark:text-surface-500">/day</span></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Live rental summary strip */}
                <div className="shrink-0 bg-white dark:bg-brand-900 border-b border-surface-100 dark:border-surface-700/60 px-4 py-3">
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-accent-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-surface-500">Pickup</span>
                            <span className="font-semibold text-surface-900 dark:text-white">{form.start_date}</span>
                            <span className="text-surface-400">@</span>
                            <span className="font-semibold text-surface-900 dark:text-white">{form.pickup_time}</span>
                        </div>
                        <svg className="w-3 h-3 text-surface-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-surface-500">Return</span>
                            <span className="font-semibold text-surface-900 dark:text-white">{form.end_date}</span>
                            <span className="text-surface-400">@</span>
                            <span className="font-semibold text-surface-900 dark:text-white">{form.return_time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-surface-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-surface-500">From</span>
                            <span className="font-semibold text-surface-900 dark:text-white">{form.pickup_location || '—'}</span>
                            <svg className="w-3 h-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span className="text-surface-500">To</span>
                            <span className="font-semibold text-surface-900 dark:text-white">{form.return_location || '—'}</span>
                        </div>
                        <span className="w-px h-4 bg-surface-200 dark:bg-surface-700/60" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-surface-500">{billingDays} day{billingDays !== 1 ? 's' : ''}</span>
                            <span className="font-bold text-accent-600 dark:text-accent-400">{formatPrice(subtotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={submit} className="flex-1 overflow-y-auto p-5">
                    {/* Overlap warning */}
                    {overlappingCars.length > 0 && (
                        <div className="mb-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/30 px-3 py-2.5 rounded-xl">
                            <div className="space-y-2">
                                {overlappingCars.map(({ car, blockingUntil }) => (
                                    <div key={car.id} className="flex items-start gap-2">
                                        <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                        </svg>
                                        <div className="flex-1 min-w-0 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                            <span className="font-semibold">{car.brand} {car.model}</span>
                                            {' — '}Booked until{' '}
                                            <span className="font-semibold">{blockingUntil ? formatDateTime(blockingUntil) : '?'}</span>
                                            {' ('}{car.grace_minutes ?? 30} min grace).
                                            {' '}Earliest pickup:{' '}
                                            <span className="font-semibold">{blockingUntil ? formatDateTime(blockingUntil) : '?'}</span>.
                                        </div>
                                        {blockingUntil && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const y = blockingUntil.getFullYear();
                                                    const mo = String(blockingUntil.getMonth() + 1).padStart(2, '0');
                                                    const d = String(blockingUntil.getDate()).padStart(2, '0');
                                                    const hh = String(blockingUntil.getHours()).padStart(2, '0');
                                                    const mm = String(blockingUntil.getMinutes()).padStart(2, '0');
                                                    setForm((f) => ({
                                                        ...f,
                                                        start_date: `${y}-${mo}-${d}`,
                                                        end_date: `${y}-${mo}-${d}`,
                                                        pickup_time: `${hh}:${mm}`,
                                                        return_time: `${hh}:${mm}`,
                                                    }));
                                                }}
                                                className="shrink-0 px-2 py-1 text-[10px] font-bold rounded-md bg-amber-200/60 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300 hover:bg-amber-300/60 dark:hover:bg-amber-700/50 transition-colors whitespace-nowrap"
                                            >
                                                Snap to time
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 1: Dates, Times, Locations */}
                    {step === 1 && (
                        <div className={`space-y-4 ${direction === 1 ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                            <div>
                                <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-2">Rental Dates</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-medium text-surface-500 mb-1 block">Start Date</label>
                                        <input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-surface-500 mb-1 block">End Date</label>
                                        <input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-surface-400 mt-1">
                                    {billingDays} day{billingDays !== 1 ? 's' : ''}
                                    {dailyRate > 0 && <span> · {formatPrice(subtotal)}</span>}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-2">Times</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-medium text-surface-500 mb-1 block">Pickup</label>
                                        <input type="time" value={form.pickup_time} onChange={(e) => update('pickup_time', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-surface-500 mb-1 block">Return</label>
                                        <input type="time" value={form.return_time} onChange={(e) => update('return_time', e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-2">Locations</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-medium text-surface-500 mb-1 block">Pickup</label>
                                        <select value={form.pickup_location} onChange={(e) => update('pickup_location', e.target.value)} className={inputClass}>
                                            <option value="">Select location</option>
                                            {locations?.map((loc) => (
                                                <option key={loc.location_id} value={loc.location}>{loc.location}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-surface-500 mb-1 block">Return</label>
                                        <select value={form.return_location} onChange={(e) => update('return_location', e.target.value)} className={inputClass}>
                                            <option value="">Select location</option>
                                            {locations?.map((loc) => (
                                                <option key={loc.location_id} value={loc.location}>{loc.location}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button type="button" onClick={() => { setDirection(1); setStep(2); }} disabled={!isValidStep1}
                                    className="w-full py-2.5 text-sm font-bold rounded-lg bg-accent-400 text-white hover:bg-accent-500 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                                    Continue → Guest Info
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Guest Info (mirrors BookNow.tsx driver details) */}
                    {step === 2 && (
                        <div className={`space-y-4 ${direction === 1 ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                            <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Guest Information</p>

                            <div className="grid grid-cols-6 gap-3">
                                <div className="col-span-2">
                                    <InputLabel value="Title" className="!text-xs !font-medium" />
                                    <select value={form.title} onChange={(e) => update('title', e.target.value)}
                                        className={selectClass}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")` }}>
                                        {TITLE_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <InputLabel value="First Name" className="!text-xs !font-medium" />
                                    <input type="text" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} placeholder="Juan" className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <InputLabel value="Last Name" className="!text-xs !font-medium" />
                                    <input type="text" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} placeholder="Remengesau" className={inputClass} />
                                </div>

                                <div className="col-span-3">
                                    <InputLabel value="Phone No." className="!text-xs !font-medium" />
                                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+680 ..." className={inputClass} />
                                </div>
                                <div className="col-span-3">
                                    <InputLabel value="Flight No. (optional)" className="!text-xs !font-medium" />
                                    <input type="text" value={form.flight_no} onChange={(e) => update('flight_no', e.target.value)} placeholder="e.g. UA 201" className={inputClass} />
                                </div>

                                <div className="col-span-3">
                                    <InputLabel value="Email" className="!text-xs !font-medium" />
                                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className={inputClass} />
                                </div>
                                <div className="col-span-3">
                                    <InputLabel value="Re-confirm Email" className="!text-xs !font-medium" />
                                    <input type="email" value={form.email_confirmation} onChange={(e) => update('email_confirmation', e.target.value)} placeholder="you@example.com" className={inputClass} />
                                    {form.email && form.email_confirmation && form.email !== form.email_confirmation && (
                                        <p className="mt-0.5 text-[10px] text-red-500">Emails do not match.</p>
                                    )}
                                </div>

                                <div className="col-span-6">
                                    <InputLabel value="Company (optional)" className="!text-xs !font-medium" />
                                    <input type="text" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} placeholder="e.g. Palau Pacific Resort" className={inputClass} />
                                </div>

                                <div className="col-span-6">
                                    <InputLabel value="Address" className="!text-xs !font-medium" />
                                    <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Street address" className={inputClass} />
                                </div>

                                <div className="col-span-6">
                                    <InputLabel value="Address 2 (optional)" className="!text-xs !font-medium" />
                                    <input type="text" value={form.address2} onChange={(e) => update('address2', e.target.value)} placeholder="Apartment, suite, etc." className={inputClass} />
                                </div>

                                <div className="col-span-2">
                                    <InputLabel value="Country" className="!text-xs !font-medium" />
                                    <select value={form.country} onChange={(e) => update('country', e.target.value)}
                                        className={selectClass}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")` }}>
                                        {countries.map((c) => (<option key={c.code} value={c.name}>{c.flag} {c.name}</option>))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <InputLabel value="State / Province" className="!text-xs !font-medium" />
                                    <input type="text" value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="State" className={inputClass} />
                                </div>
                                <div className="col-span-2">
                                    <InputLabel value="City" className="!text-xs !font-medium" />
                                    <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Koror" className={inputClass} />
                                </div>

                                <div className="col-span-2">
                                    <InputLabel value="Postal / Zip Code" className="!text-xs !font-medium" />
                                    <input type="text" value={form.postal_code} onChange={(e) => update('postal_code', e.target.value)} placeholder="96940" className={inputClass} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button type="button" onClick={() => { setDirection(-1); setStep(1); }}
                                    className="px-4 py-2.5 text-sm font-medium rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                                    ← Back
                                </button>
                                <button type="button" onClick={() => { setDirection(1); setStep(3); }} disabled={!isValidStep2}
                                    className="flex-1 py-2.5 text-sm font-bold rounded-lg bg-accent-400 text-white hover:bg-accent-500 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                                    Driver License →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Driver License (mandatory) */}
                    {step === 3 && (
                        <div className={`space-y-4 ${direction === 1 ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Driver License</p>
                                <label className="flex cursor-pointer items-center gap-2 shrink-0">
                                    <input type="checkbox" checked={form.driver_is_renter}
                                        onChange={(e) => handleSameAsRenter(e.target.checked)}
                                        className="h-4 w-4 rounded border-surface-300 text-accent-500 focus:ring-accent-400/30" />
                                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">Same as renter</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <InputLabel value="First Name" className="!text-xs !font-medium" />
                                    <input type="text" value={form.driver_first_name} onChange={(e) => update('driver_first_name', e.target.value)} placeholder="Juan" className={inputClass} />
                                </div>
                                <div>
                                    <InputLabel value="Last Name" className="!text-xs !font-medium" />
                                    <input type="text" value={form.driver_last_name} onChange={(e) => update('driver_last_name', e.target.value)} placeholder="Remengesau" className={inputClass} />
                                </div>

                                <div>
                                    <InputLabel value="Birthdate" className="!text-xs !font-medium" />
                                    <input type="date" value={form.driver_birth_date} max={todayIsoPanel} onChange={(e) => update('driver_birth_date', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <InputLabel value="Age" className="!text-xs !font-medium" />
                                    <div className={`flex items-center px-2 py-1.5 rounded-lg border border-surface-200 dark:border-surface-600/40 bg-surface-50 dark:bg-brand-800 text-sm ${
                                        driverAge !== null && driverAge >= 18
                                            ? 'text-surface-900 dark:text-surface-100'
                                            : 'text-surface-400 dark:text-surface-500'
                                    }`}>
                                        {driverAge !== null ? driverAge : '—'}
                                        {driverAge !== null && driverAge < 18 && (
                                            <span className="ml-1.5 text-[10px] font-semibold text-red-500">Min 18</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <InputLabel value="License Number" className="!text-xs !font-medium" />
                                    <input type="text" value={form.license_number} onChange={(e) => update('license_number', e.target.value)} placeholder="e.g. DL-1234" className={inputClass} />
                                </div>
                                <div>
                                    <InputLabel value="License Category" className="!text-xs !font-medium" />
                                    <select value={form.license_category} onChange={(e) => update('license_category', e.target.value)}
                                        className={selectClass}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E")` }}>
                                        <option value="">Select category</option>
                                        {LICENSE_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <InputLabel value="License Expiry" className="!text-xs !font-medium" />
                                    <input type="date" value={form.license_expiry} min={todayIsoPanel} onChange={(e) => update('license_expiry', e.target.value)} className={inputClass} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button type="button" onClick={() => { setDirection(-1); setStep(2); }}
                                    className="px-4 py-2.5 text-sm font-medium rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                                    ← Back
                                </button>
                                <button type="button" onClick={() => { setDirection(1); setStep(4); }} disabled={!isValidStep3}
                                    className="flex-1 py-2.5 text-sm font-bold rounded-lg bg-accent-400 text-white hover:bg-accent-500 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                                    Review & Confirm →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirm */}
                    {step === 4 && (
                        <div className={`space-y-4 ${direction === 1 ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                            <div className="rounded-xl bg-surface-25 dark:bg-surface-800/20 border border-surface-100 dark:border-surface-700/30 p-4 space-y-2">
                                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Summary</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-surface-500">Vehicle</span><span className="font-semibold text-surface-900 dark:text-white">{firstCar?.brand} {firstCar?.model}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">Dates</span><span className="font-semibold text-surface-900 dark:text-white">{form.start_date} → {form.end_date}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">Duration</span><span className="font-semibold text-surface-900 dark:text-white">{billingDays} day{billingDays !== 1 ? 's' : ''}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">Renter</span><span className="font-semibold text-surface-900 dark:text-white">{form.first_name} {form.last_name}</span></div>
                                    {form.company_name && (
                                        <div className="flex justify-between"><span className="text-surface-500">Company</span><span className="font-semibold text-surface-900 dark:text-white">{form.company_name}</span></div>
                                    )}
                                    <div className="flex justify-between"><span className="text-surface-500">Email</span><span className="font-semibold text-surface-900 dark:text-white">{form.email}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">Phone</span><span className="font-semibold text-surface-900 dark:text-white">{form.phone || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">Driver</span><span className="font-semibold text-surface-900 dark:text-white">{form.driver_first_name} {form.driver_last_name}{driverAge !== null ? ` (${driverAge})` : ''}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">License No.</span><span className="font-mono font-semibold text-surface-900 dark:text-white">{form.license_number ? form.license_number.replace(/.(?=.{4})/g, '•') : '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">License</span><span className="font-semibold text-surface-900 dark:text-white">Cat. {form.license_category} · Exp {form.license_expiry}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">Pickup</span><span className="font-semibold text-surface-900 dark:text-white">{form.pickup_time} @ {form.pickup_location || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-surface-500">Return</span><span className="font-semibold text-surface-900 dark:text-white">{form.return_time} @ {form.return_location || '—'}</span></div>
                                </div>
                            </div>

                            {/* Coupon discount section */}
                            <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-200 dark:border-surface-700/40 p-3 shadow-sm space-y-2">
                                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Promo Code</p>
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200/60 dark:border-emerald-700/30">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-400 text-white flex items-center justify-center shrink-0">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate tracking-wider">{appliedCoupon.code}</div>
                                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{appliedCoupon.label}</div>
                                            </div>
                                        </div>
                                        <button type="button" onClick={removeCoupon}
                                            className="w-6 h-6 rounded-lg bg-white/80 dark:bg-brand-700/60 hover:bg-white dark:hover:bg-brand-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/30 flex items-center justify-center transition-all active:scale-90">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-stretch gap-1.5">
                                        <input type="text" value={couponCode}
                                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); if (couponError) setCouponError(''); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon(); }}
                                            placeholder="Enter code"
                                            className={`flex-1 h-9 px-2.5 bg-white dark:bg-brand-900 border-2 rounded-lg text-xs font-bold uppercase tracking-wider placeholder:text-surface-300 dark:placeholder:text-surface-600 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-4 transition-all ${
                                                couponError ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' : 'border-surface-200 dark:border-surface-600/40 focus:border-accent-400 focus:ring-accent-400/20'
                                            }`} />
                                        <button type="button" onClick={applyCoupon} disabled={!couponCode.trim() || couponApplying}
                                            className="h-9 px-3 rounded-lg bg-surface-900 dark:bg-brand-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-surface-800 dark:hover:bg-brand-600 disabled:bg-surface-200 dark:disabled:bg-surface-700/40 disabled:text-surface-400 disabled:cursor-not-allowed transition-all active:scale-95 inline-flex items-center justify-center min-w-[56px]">
                                            {couponApplying ? (
                                                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : 'Apply'}
                                        </button>
                                    </div>
                                )}
                                {couponError && (
                                    <div className="text-[10px] text-red-500 font-medium flex items-center gap-1 animate-fade-in">
                                        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        {couponError}
                                    </div>
                                )}
                            </div>

                            {/* Price card */}
                            {dailyRate > 0 && (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-200 dark:border-surface-700/40 p-3 shadow-sm">
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between text-surface-500">
                                            <span>{formatPrice(dailyRate)} × {billingDays} day{billingDays !== 1 ? 's' : ''}</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>
                                        {taxes.filter(t => t.add_or_minus).map((t) => (
                                            <div key={t.id} className="flex justify-between text-surface-600 dark:text-surface-400">
                                                <span>{t.tax_desc}</span>
                                                <span>+{formatPrice(t.amount)}</span>
                                            </div>
                                        ))}
                                        {totalTaxDiscount > 0 && (
                                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                                <span>Tax Discounts</span>
                                                <span>-{formatPrice(totalTaxDiscount)}</span>
                                            </div>
                                        )}
                                        {discount > 0 && (
                                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                                <span>Coupon {appliedCoupon && `(${appliedCoupon.code})`}</span>
                                                <span>-{formatPrice(discount)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-dashed border-surface-200 dark:border-surface-700/40 pt-1.5 flex justify-between font-bold text-surface-900 dark:text-white text-sm">
                                            <span>Estimated Total</span>
                                            <span>{formatPrice(estimatedTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedCarIds.length > 1 && (
                                <div className="flex items-center gap-1.5 text-xs text-accent-600 dark:text-accent-400 bg-accent-400/5 px-3 py-2 rounded-xl">
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>This will create {selectedCarIds.length} separate bookings — one for each selected car.</span>
                                </div>
                            )}

                            {/* Terms */}
                            <div className="space-y-2">
                                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-surface-200 dark:border-surface-700/40 bg-surface-50 dark:bg-surface-800/20 px-3 py-2.5 transition hover:border-accent-300 dark:hover:border-accent-700/40">
                                    <input type="checkbox" checked={form.agree_terms}
                                        onChange={(e) => update('agree_terms', e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-surface-300 text-accent-500 focus:ring-accent-400/30" />
                                    <span className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
                                        I have read and agree to the{' '}
                                        <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(!showTerms); }}
                                            className="font-semibold text-accent-600 dark:text-accent-400 underline underline-offset-2 hover:text-accent-700">
                                            Booking Terms & Conditions
                                        </button>.
                                    </span>
                                </label>
                                {showTerms && bookingTerms && (
                                    <div className="max-h-32 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-700/40 bg-surface-50 dark:bg-surface-800/20 p-3 text-xs text-surface-600 dark:text-surface-400 leading-relaxed prose prose-sm max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: bookingTerms }} />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <button type="button" onClick={() => { setDirection(-1); setStep(3); }}
                                    className="px-4 py-2.5 text-sm font-medium rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                                    ← Edit
                                </button>
                                <button type="submit" disabled={!isValid || submitting}
                                    className="flex-1 relative py-2.5 text-sm font-bold rounded-lg bg-accent-400 text-white hover:bg-accent-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : selectedCarIds.length > 1 ? `Create ${selectedCarIds.length} Bookings` : 'Confirm Booking'}
                                    {!submitting && (
                                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Success overlay */}
            {showSuccess && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-brand-900 rounded-xl shadow-xl border border-surface-100 dark:border-surface-700/60 px-6 py-5 text-center max-w-[260px]">
                        <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-surface-900 dark:text-white">Booking Confirmed!</h3>
                        <p className="text-xs text-surface-500 mt-1">
                            {form.first_name} {form.last_name}
                            {selectedCars.length === 1 ? ` \u00B7 ${firstCar?.brand} ${firstCar?.model}` : ''}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
