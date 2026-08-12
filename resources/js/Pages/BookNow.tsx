import React, { useEffect, useRef, useState, useMemo } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { countries } from '@/data/countries';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useCarBooked } from '@/Hooks/useCarBooked';

import { useRoute } from 'ziggy-js';


interface CarLike {
    id: number;
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    daily_rate: number;
    fuel_type: string;
    seats: number;
    transmission: string;
    vehicle_type: string;
    image_path: string | null;
}

interface RentalLike {
    pickup_date: string;
    pickup_time: string;
    pickup_location: string;
    return_date: string;
    return_time: string;
    return_location: string;
}

interface AppliedCoupon {
    code: string;
    type: 'percent' | 'fixed' | 'per_day' | 'day_free';
    value: number;
    label: string;
    min_rate?: number;
}

interface BookedDateInfo {
    date: string;
    status: 'full' | 'partial';
    available_before?: string;
    available_after?: string;
}

interface BookNowProps {
    carId: string;
    car?: CarLike;
    rental?: RentalLike;
    booked_dates?: BookedDateInfo[];
    legalDocument?: {
        content: string | null;
    } | null;
}

const TITLE_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Mx.', 'Dr.', 'Prof.'];

const inputClass =
    'w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm text-surface-800 placeholder-surface-400 shadow-sm transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none';

const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10`;

const formatDate = (value: string) =>
    value
        ? new Date(value + (value.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—';

const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatTime = (value: string) => {
    if (!value) return '—';
    const [h, m] = value.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return value;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const sampleCar: CarLike = {
    id: 1,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    license_plate: 'KOR-2481',
    daily_rate: 55,
    fuel_type: 'Gasoline',
    seats: 5,
    transmission: 'Automatic',
    vehicle_type: 'Sedan',
    image_path: null,
};

const CAR_IMAGES = [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=900&fit=crop',
];

const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getCarImage = (car: CarLike) =>
    car.image_path
        ? `/storage/${car.image_path}`
        : CAR_IMAGES[car.id % CAR_IMAGES.length];

const LOCATIONS = [
    'West Plaza Hotel @ Lebuu St.',
    'Airport',
];

const todayLocal = new Date();
todayLocal.setHours(0, 0, 0, 0);

const defaultPickup = toLocalDateString(new Date(todayLocal.getTime() + 86400000 * 3));
const defaultReturn = toLocalDateString(new Date(todayLocal.getTime() + 86400000 * 7));

const sampleRental: RentalLike = {
    pickup_date: defaultPickup,
    pickup_time: '10:00',
    pickup_location: LOCATIONS[1],
    return_date: defaultReturn,
    return_time: '10:00',
    return_location: LOCATIONS[0],
};

export default function BookNow({ carId, car = sampleCar, rental, booked_dates = [], legalDocument }: BookNowProps) {
    const route = useRoute();

    const effectiveRental: RentalLike = rental ?? sampleRental;

    const [coupon, setCoupon] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponApplying, setCouponApplying] = useState(false);

    const [taxes, setTaxes] = useState<{ id: number; tax_desc: string; category: string; amount: number; add_or_minus: boolean; calculation: string; value_in: string; rate: number }[]>([]);
    const [totalTax, setTotalTax] = useState(0);
    const [totalSurcharge, setTotalSurcharge] = useState(0);
    const [totalTaxDiscount, setTotalTaxDiscount] = useState(0);
    const [showCalendar, setShowCalendar] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'idle' | 'creating' | 'error'>('idle');
    const [paymentError, setPaymentError] = useState('');
    const carJustBooked = useCarBooked(carId);
    const [showSavedPrompt, setShowSavedPrompt] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('savedDriverDetails');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.first_name || parsed.last_name) {
                    setShowSavedPrompt(true);
                }
            } catch { /* ignore */ }
        }
    }, []);

    const { data, setData, post, errors, processing } = useForm({
        car_id: car.id,
        pickup_date: effectiveRental.pickup_date,
        pickup_time: effectiveRental.pickup_time,
        pickup_location: effectiveRental.pickup_location,
        return_date: effectiveRental.return_date,
        return_time: effectiveRental.return_time,
        return_location: effectiveRental.return_location,
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
        flight_no: '',
        agree_terms: false,
    });

    const billingDays = useMemo(() => {
        if (!data.pickup_date || !data.return_date) return 0;
        const start = new Date(`${data.pickup_date}T${data.pickup_time || '00:00'}:00`);
        const end = new Date(`${data.return_date}T${data.return_time || '23:59'}:00`);
        return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    }, [data.pickup_date, data.pickup_time, data.return_date, data.return_time]);

    const toMins = (t: string | null | undefined) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const dateConflict = useMemo(() => {
        if (!data.pickup_date || !data.return_date || !booked_dates.length) return false;
        const pickup = new Date(data.pickup_date + 'T00:00:00');
        const ret = new Date(data.return_date + 'T00:00:00');
        const pickupMins = toMins(data.pickup_time) ?? 0;
        const returnMins = toMins(data.return_time) ?? 1440;
        for (const bd of booked_dates) {
            const booked = new Date(bd.date + 'T00:00:00');
            if (booked < pickup || booked > ret) continue;
            if (bd.status === 'full') return true;
            if (bd.status === 'partial') {
                const freeStart = toMins(bd.available_after) ?? 0;
                const freeEnd = toMins(bd.available_before) ?? 1440;
                const sameDay = pickup.getTime() === ret.getTime();
                const isPickup = booked.getTime() === pickup.getTime();
                const isReturn = booked.getTime() === ret.getTime();
                let userStart: number, userEnd: number;
                if (sameDay) {
                    userStart = pickupMins;
                    userEnd = returnMins;
                } else if (isPickup && !isReturn) {
                    userStart = pickupMins;
                    userEnd = 1440;
                } else if (isReturn && !isPickup) {
                    userStart = 0;
                    userEnd = returnMins;
                } else if (isPickup && isReturn) {
                    userStart = pickupMins;
                    userEnd = returnMins;
                } else {
                    userStart = 0;
                    userEnd = 1440;
                }
                if (userStart < freeStart || userEnd > freeEnd) return true;
            }
        }
        return false;
    }, [data.pickup_date, data.return_date, data.pickup_time, data.return_time, booked_dates]);

    const subtotal = car.daily_rate * billingDays;
    const totalFees = totalTax + totalSurcharge;

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
                return freeDays * car.daily_rate;
            }
            default:
                return 0;
        }
    }, [appliedCoupon, subtotal, billingDays, car.daily_rate]);

    const estimatedTotal = subtotal + totalFees - totalTaxDiscount - discount;

    useEffect(() => {
        if (!car?.id || !billingDays) return;
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(route('taxes.calculate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
            body: JSON.stringify({
                car_id: car.id,
                pickup_location: data.pickup_location || null,
                billing_days: billingDays,
                daily_rate: car.daily_rate,
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
    }, [car?.id, billingDays, car.daily_rate, data.pickup_location]);

    const applyCoupon = async () => {
        const code = coupon.trim().toUpperCase();
        if (!code) { setCouponError('Enter a coupon code.'); return; }
        setCouponApplying(true);
        setCouponError('');
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        try {
            const res = await fetch(route('coupons.validate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
                body: JSON.stringify({ code, subtotal, daily_rate: car.daily_rate, billing_days: billingDays }),
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
        setCoupon('');
        setCouponError('');
    };

    const emailMismatch =
        data.email && data.email_confirmation && data.email !== data.email_confirmation
            ? 'Emails do not match.'
            : undefined;

    async function handleSubmit() {
        setPaymentStep('creating');
        setPaymentError('');

        const driverDetails = {
            title: data.title,
            first_name: data.first_name,
            last_name: data.last_name,
            driver_age: data.driver_age,
            phone: data.phone,
            flight_no: data.flight_no,
            email: data.email,
            address: data.address,
            address2: data.address2,
            country: data.country,
            state: data.state,
            city: data.city,
            postal_code: data.postal_code,
        };
        localStorage.setItem('savedDriverDetails', JSON.stringify(driverDetails));

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
            const res = await fetch(route('reservations.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    ...data,
                    coupon_code: appliedCoupon?.code || '',
                    discount,
                    total_tax: totalTax,
                    total_surcharge: totalSurcharge,
                    tax_breakdown: taxes,
                }),
            });

            if (!res.ok) {
                if (res.status === 429) {
                    setPaymentError('Too many booking attempts — please wait a minute and try again.');
                    setPaymentStep('error');
                    return;
                }
                const err = await res.json();
                setPaymentError(err.message || 'Failed to create booking.');
                setPaymentStep('error');
                return;
            }

            const bookingData = await res.json();
            router.visit(route('bookings.guest.show', bookingData.reference_code));
        } catch {
            setPaymentError('A network error occurred. Please try again.');
            setPaymentStep('error');
        }
    }

    return (
        <GuestLayout>
            <Head title="Book Now" />

            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <nav className="mb-4 flex items-center gap-2 text-sm text-brand-200">
                        <span>Home</span>
                        <span className="text-brand-300">/</span>
                        <span>Fleet</span>
                        <span className="text-brand-300">/</span>
                        <span className="font-semibold text-white">Book Now</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Complete Your <span className="text-accent-400">Reservation</span>
                    </h1>
                    <p className="mt-2 max-w-xl text-brand-100">
                        Just a few details and your ride is locked in. Review the summary on the
                        right as you go.
                    </p>
                </div>
            </div>

            {/* Step-by-step booking progress */}
            <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
                <BookingStepBar currentStep={4} />
            </div>

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left: main form */}
                    <div className="space-y-8 lg:col-span-8">
                        {/* Your Booking */}
                        <section className="overflow-hidden rounded-3xl border border-surface-100 bg-white shadow-card">
                            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-surface-100">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <h2 className="text-lg font-bold text-surface-900">Your Booking</h2>
                                        <p className="text-sm text-surface-500">Dates, location &amp; vehicle selection</p>
                                    </div>
                                </div>
                                <Link
                                    href={route('fleet')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors active:scale-95"
                                >
                                    Change Vehicle
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5">
                                <div className="lg:col-span-3 p-6 sm:p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel value="Pick-up Date" />
                                            <input type="date" className={inputClass} value={data.pickup_date} onChange={(e) => setData('pickup_date', e.target.value)} />
                                            <InputError message={errors.pickup_date} />
                                        </div>
                                        <div>
                                            <InputLabel value="Pick-up Time" />
                                            <input type="time" className={inputClass} value={data.pickup_time} onChange={(e) => setData('pickup_time', e.target.value)} />
                                            <InputError message={errors.pickup_time} />
                                        </div>
                                        <div>
                                            <InputLabel value="Return Date" />
                                            <input type="date" className={inputClass} value={data.return_date} onChange={(e) => setData('return_date', e.target.value)} />
                                            <InputError message={errors.return_date} />
                                        </div>
                                        <div>
                                            <InputLabel value="Return Time" />
                                            <input type="time" className={inputClass} value={data.return_time} onChange={(e) => setData('return_time', e.target.value)} />
                                            <InputError message={errors.return_time} />
                                        </div>
                                        <div>
                                            <InputLabel value="Pick-up Location" />
                                            <select className={selectClass} value={data.pickup_location} onChange={(e) => setData('pickup_location', e.target.value)}>
                                                {LOCATIONS.map((loc) => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.pickup_location} />
                                        </div>
                                        <div>
                                            <InputLabel value="Return Location" />
                                            <select className={selectClass} value={data.return_location} onChange={(e) => setData('return_location', e.target.value)}>
                                                {LOCATIONS.map((loc) => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.return_location} />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-surface-100 p-6 sm:p-8 bg-surface-50/50">
                                    <div className="flex flex-col h-full">
                                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface-100 mb-4">
                                            <img
                                                src={getCarImage(car)}
                                                alt={`${car.brand} ${car.model}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-brand-700 uppercase tracking-wider">{car.brand} · {car.year}</p>
                                            <h3 className="text-xl font-bold text-surface-900 mt-0.5">{car.model}</h3>
                                            <p className="text-lg font-bold text-accent-600 mt-1">
                                                {formatPrice(car.daily_rate)}
                                                <span className="text-sm font-normal text-surface-400"> / day</span>
                                            </p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-sm">
                                                <Spec label="Type" value={car.vehicle_type} />
                                                <Spec label="Seats" value={`${car.seats}`} />
                                                <Spec label="Transmission" value={car.transmission} />
                                                <Spec label="Fuel" value={car.fuel_type} />
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-surface-200">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 mb-2">14-Day Availability</p>
                                        <MiniAvailabilityStrip bookedDates={booked_dates} days={21} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-surface-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCalendar((v) => !v)}
                                    className="flex w-full items-center gap-4 px-6 sm:px-8 py-4 text-left transition hover:bg-surface-50 active:bg-surface-100 group"
                                >
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${showCalendar ? 'bg-brand-100 text-brand-700' : 'bg-brand-50 text-brand-600 group-hover:bg-brand-100'}`}>
                                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-sm font-semibold text-surface-700">Availability</span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[9px] font-black uppercase tracking-wider">21 days</span>
                                        </div>
                                        <MiniAvailabilityStrip bookedDates={booked_dates} />
                                    </div>
                                    <svg className={`w-4 h-4 shrink-0 transition-all duration-300 ${showCalendar ? 'rotate-90 text-brand-600' : 'text-surface-400 group-hover:text-surface-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                {showCalendar && (
                                    <div className="border-t border-surface-100 animate-fade-in" style={{ animationDuration: '250ms' }}>
                                        <div className="px-6 sm:px-8 py-6">
                                            <CarAvailabilityCalendar
                                                bookedDates={booked_dates}
                                                pickupDate={data.pickup_date}
                                                returnDate={data.return_date}
                                                onPickupDateChange={(d) => setData('pickup_date', d)}
                                                onReturnDateChange={(d) => setData('return_date', d)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {data.pickup_date && data.return_date && (
                                <div className="border-t border-surface-100 px-6 sm:px-8 py-4">
                                    {dateConflict ? (
                                        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            This car is not available for the selected dates. Please choose different dates.
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                            The car is ok to book for the selected dates.
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {carJustBooked && (
                            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-card sm:p-8">
                                <div className="flex items-start gap-3">
                                    <svg className="mt-0.5 h-6 w-6 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-base font-semibold text-red-800">Car No Longer Available</p>
                                        <p className="mt-1 text-sm text-red-600">
                                            This car was just booked by another customer. Please browse our fleet for other available vehicles.
                                        </p>
                                        <a href="/fleet" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-800 transition-colors">
                                            Browse Fleet
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showSavedPrompt && (
                            <div className="rounded-3xl border border-accent-200 bg-accent-50 p-4 sm:p-5 shadow-card mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-accent-900">Welcome back!</p>
                                            <p className="text-xs text-accent-700 mt-0.5">Would you like to use your previously entered driver details?</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const saved = localStorage.getItem('savedDriverDetails');
                                                if (saved) {
                                                    try {
                                                        const parsed = JSON.parse(saved);
                                                        (Object.keys(parsed) as Array<keyof typeof parsed>).forEach(key => {
                                                            setData(key as any, parsed[key]);
                                                        });
                                                    } catch { /* ignore */ }
                                                }
                                                setShowSavedPrompt(false);
                                            }}
                                            className="rounded-xl bg-accent-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-accent-400 active:scale-[0.98]"
                                        >
                                            Use Previous
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                localStorage.removeItem('savedDriverDetails');
                                                setShowSavedPrompt(false);
                                            }}
                                            className="rounded-xl border border-accent-200 bg-white px-5 py-2 text-xs font-bold text-accent-700 shadow-sm transition hover:bg-accent-50 active:scale-[0.98]"
                                        >
                                            Start Fresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Driver Details */}
                        <section className="rounded-3xl border border-surface-100 bg-white p-6 shadow-card sm:p-8">
                            <div className="mb-6 flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                        <path
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold text-surface-900">
                                        Driver Details
                                    </h2>
                                    <p className="text-sm text-surface-500">
                                        Primary driver & contact information
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-6">
                                <div className="sm:col-span-2">
                                    <InputLabel value="Title" />
                                    <select
                                        className={selectClass}
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        style={{
                                            backgroundImage:
                                                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                                        }}
                                    >
                                        {TITLE_OPTIONS.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="First Name" />
                                    <input
                                        className={inputClass}
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        placeholder="Juan"
                                    />
                                    <InputError message={errors.first_name} />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="Last Name" />
                                    <input
                                        className={inputClass}
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="Remengesau"
                                    />
                                    <InputError message={errors.last_name} />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="Driver's Age" />
                                    <input
                                        type="number"
                                        min={18}
                                        className={inputClass}
                                        value={data.driver_age}
                                        onChange={(e) => setData('driver_age', e.target.value)}
                                        placeholder="30"
                                    />
                                    <InputError message={errors.driver_age} />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="Phone No." />
                                    <input
                                        type="tel"
                                        className={inputClass}
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+680 ..."
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="Flight No. (optional)" />
                                    <input
                                        className={inputClass}
                                        value={data.flight_no}
                                        onChange={(e) => setData('flight_no', e.target.value)}
                                        placeholder="e.g. UA 201"
                                    />
                                </div>

                                <div className="sm:col-span-3">
                                    <InputLabel value="Email" />
                                    <input
                                        type="email"
                                        className={inputClass}
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="you@example.com"
                                    />
                                    <InputError message={errors.email ?? emailMismatch} />
                                </div>

                                <div className="sm:col-span-3">
                                    <InputLabel value="Re-confirm Email" />
                                    <input
                                        type="email"
                                        className={inputClass}
                                        value={data.email_confirmation}
                                        onChange={(e) =>
                                            setData('email_confirmation', e.target.value)
                                        }
                                        placeholder="you@example.com"
                                    />
                                    <InputError message={emailMismatch} />
                                </div>

                                <div className="sm:col-span-6">
                                    <InputLabel value="Address" />
                                    <input
                                        className={inputClass}
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Street address"
                                    />
                                    <InputError message={errors.address} />
                                </div>

                                <div className="sm:col-span-6">
                                    <InputLabel value="Address 2 (optional)" />
                                    <input
                                        className={inputClass}
                                        value={data.address2}
                                        onChange={(e) => setData('address2', e.target.value)}
                                        placeholder="Apartment, suite, etc."
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="Country" />
                                    <select
                                        className={selectClass}
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        style={{
                                            backgroundImage:
                                                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                                        }}
                                    >
                                        {countries.map((c) => (
                                            <option key={c.code} value={c.name}>
                                                {c.flag} {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.country} />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="State / Province" />
                                    <input
                                        className={inputClass}
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value)}
                                        placeholder="State"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="City" />
                                    <input
                                        className={inputClass}
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="Koror"
                                    />
                                    <InputError message={errors.city} />
                                </div>

                                <div className="sm:col-span-2">
                                    <InputLabel value="Postal / Zip Code" />
                                    <input
                                        className={inputClass}
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        placeholder="96940"
                                    />
                                    <InputError message={errors.postal_code} />
                                </div>
                            </div>
                        </section>

                        {/* Terms & Conditions */}
                        <section className="rounded-3xl border border-surface-100 bg-white p-6 shadow-card sm:p-8">
                            <div className="mb-4 flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                        <path
                                            d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                                <h2 className="text-lg font-bold text-surface-900">
                                    Booking Terms & Conditions
                                </h2>
                            </div>

                            <div className="max-h-48 overflow-y-auto rounded-2xl border border-surface-100 bg-surface-50 p-4 text-sm leading-relaxed text-surface-600 prose prose-sm max-w-none">
                                {legalDocument?.content ? (
                                    <div dangerouslySetInnerHTML={{ __html: legalDocument.content }} />
                                ) : (
                                    <p className="text-surface-400 italic">No terms and conditions have been set.</p>
                                )}
                            </div>

                            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 transition hover:border-brand-300">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 h-5 w-5 rounded border-surface-300 text-brand-700 focus:ring-brand-500"
                                    checked={data.agree_terms}
                                    onChange={(e) => setData('agree_terms', e.target.checked)}
                                />
                                <span className="text-sm text-surface-700">
                                    I have read and agree to the{' '}
                                    <span className="font-semibold text-brand-700">
                                        Booking Terms & Conditions
                                    </span>
                                    .
                                </span>
                            </label>
                            <InputError message={errors.agree_terms} />
                        </section>

                        {/* Coupon */}
                        <section className="rounded-3xl border border-surface-100 bg-white p-6 shadow-card sm:p-8">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                        <path
                                            d="M20 12V8a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 010 4v0a2 2 0 002 2h12a2 2 0 002-2v0a2 2 0 010-4z"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M15 8v8"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeDasharray="2 2"
                                        />
                                    </svg>
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold text-surface-900">
                                        Discount Coupon
                                    </h2>
                                    <p className="text-sm text-surface-500">
                                        Have a promo code? Apply it here.
                                    </p>
                                </div>
                            </div>

                            {appliedCoupon ? (
                                <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400 text-white">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-700">{appliedCoupon.code}</p>
                                            <p className="text-xs font-medium text-emerald-600">{appliedCoupon.label}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeCoupon}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-all hover:bg-emerald-50 active:scale-90"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                    <input
                                        className={inputClass}
                                        value={coupon}
                                        onChange={(e) => { setCoupon(e.target.value.toUpperCase()); if (couponError) setCouponError(''); }}
                                        placeholder="Enter coupon code"
                                    />
                                    <button
                                        type="button"
                                        onClick={applyCoupon}
                                        disabled={!coupon.trim() || couponApplying}
                                        className="shrink-0 rounded-xl bg-surface-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-surface-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {couponApplying ? (
                                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        ) : 'Apply'}
                                    </button>
                                </div>
                            )}
                            {appliedCoupon && (
                                <p className="mt-2 text-sm font-medium text-green-600">
                                    Saving {formatPrice(discount)}
                                </p>
                            )}
                            {couponError && (
                                <p className="mt-2 text-sm font-medium text-red-600">
                                    {couponError}
                                </p>
                            )}
                        </section>
                    </div>

                    {/* Right: sticky summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            <div className="overflow-hidden rounded-3xl border border-surface-100 bg-white shadow-elevated">
                                <div className="bg-gradient-to-br from-brand-900 to-brand-800 px-6 py-5">
                                    <p className="text-sm text-brand-200">Estimated Total</p>
                                    <p className="text-3xl font-bold text-white">
                                        {formatPrice(estimatedTotal)}
                                    </p>
                                    <p className="mt-1 text-xs text-brand-200">
                                        {billingDays > 0 ? `for ${billingDays} ${billingDays === 1 ? 'day' : 'days'}` : 'Select dates to see total'}
                                    </p>
                                </div>

                                <div className="space-y-3 px-6 py-5 text-sm">
                                    <SummaryRow
                                        label={billingDays > 0 ? `${formatPrice(car.daily_rate)} × ${billingDays} ${billingDays === 1 ? 'day' : 'days'}` : 'Daily rate'}
                                        value={billingDays > 0 ? formatPrice(subtotal) : '—'}
                                    />
                                    {taxes.filter(t => t.add_or_minus).map((t) => {
                                        const rateLabel = t.value_in === 'Percentage'
                                            ? ` (${t.rate}%)`
                                            : t.calculation === 'Per Day'
                                                ? ` (${formatPrice(t.rate)}/day)`
                                                : ` (${formatPrice(t.rate)})`;
                                        return (
                                            <SummaryRow key={t.id} label={`${t.tax_desc}${rateLabel}`} value={`+${formatPrice(t.amount)}`} />
                                        );
                                    })}
                                    {totalTaxDiscount > 0 && (
                                        <SummaryRow label="Tax Discounts" value={`-${formatPrice(totalTaxDiscount)}`} accent />
                                    )}
                                    {discount > 0 && (
                                        <SummaryRow
                                            label={`Coupon (${appliedCoupon?.code})`}
                                            value={`– ${formatPrice(discount)}`}
                                            accent
                                        />
                                    )}
                                    <div className="border-t border-dashed border-surface-200 pt-3">
                                        <SummaryRow
                                            label="Total"
                                            value={formatPrice(estimatedTotal)}
                                            bold
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-surface-100 bg-surface-50 px-6 py-4">
                                    <div className="flex items-start gap-2 rounded-xl bg-accent-50 p-3 text-xs leading-relaxed text-accent-800">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className="mt-0.5 h-4 w-4 shrink-0"
                                        >
                                            <path
                                                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <span>
                                            Optional Insurances are subject to tax in certain
                                            locations. This tax is not reflected in the Estimated
                                            Total.
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 pt-0 space-y-3">
                                    {paymentStep === 'idle' && (
                                        <>
                                            <button
                                                type="button"
                                                disabled={processing || !data.agree_terms || dateConflict || carJustBooked}
                                                onClick={handleSubmit}
                                                className="mt-4 w-full rounded-xl bg-accent-500 px-6 py-3.5 text-sm font-bold text-surface-900 shadow-sm transition hover:bg-accent-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {carJustBooked ? 'Unavailable' : processing ? 'Processing…' : 'Confirm Booking'}
                                            </button>
                                            {!data.agree_terms && (
                                                <p className="mt-2 text-center text-xs text-surface-400">
                                                    Accept the terms to continue
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {paymentStep === 'creating' && (
                                        <div className="flex items-center justify-center gap-2 py-4 text-brand-700">
                                            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-700" />
                                            <span className="text-sm font-semibold">Creating your reservation…</span>
                                        </div>
                                    )}

                                    {paymentStep === 'error' && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                            <p className="font-semibold mb-1">Payment could not be initiated</p>
                                            <p>{paymentError}</p>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentStep('idle')}
                                                className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-800 hover:bg-red-200 transition-colors"
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    )}


                                </div>
                            </div>

                            <div className="rounded-3xl border border-surface-100 bg-white p-5 shadow-card">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={getCarImage(car)}
                                        alt={`${car.brand} ${car.model}`}
                                        className="h-14 w-20 rounded-xl object-cover"
                                    />
                                    <div>
                                        <p className="text-xs text-surface-400">
                                            {car.brand} · {car.year}
                                        </p>
                                        <p className="font-semibold text-surface-900">
                                            {car.model}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 border-t border-surface-100 pt-4">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                                        14-Day Availability
                                    </p>
                                    <MiniAvailabilityStrip bookedDates={booked_dates} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}

function useBookedMap(booked: BookedDateInfo[]): Map<string, BookedDateInfo> {
    return useMemo(() => {
        const map = new Map<string, BookedDateInfo>();
        for (const entry of booked) map.set(entry.date, entry);
        return map;
    }, [booked]);
}

function getDayStatus(
    dateStr: string,
    bookedMap: Map<string, BookedDateInfo>,
): { status: 'full' | 'partial' | 'available'; tooltip: string; variant: 'full' | 'available' | 'end-partial' | 'start-partial' | 'both-partial' } {
    const info = bookedMap.get(dateStr);
    if (!info) return { status: 'available', tooltip: 'Fully available', variant: 'available' };
    if (info.status === 'full') return { status: 'full', tooltip: 'Fully booked', variant: 'full' };
    const hasBefore = !!info.available_before;
    const hasAfter = !!info.available_after;
    if (hasBefore && hasAfter) {
        return { status: 'partial', tooltip: `Available ${formatTime(info.available_after!)} – ${formatTime(info.available_before!)}`, variant: 'both-partial' };
    }
    if (hasBefore) {
        return { status: 'partial', tooltip: `Available until ${formatTime(info.available_before!)}`, variant: 'start-partial' };
    }
    return { status: 'partial', tooltip: `Available from ${formatTime(info.available_after!)}`, variant: 'end-partial' };
}

function CarAvailabilityCalendar({
    bookedDates,
    pickupDate,
    returnDate,
    onPickupDateChange,
    onReturnDateChange,
}: {
    bookedDates?: BookedDateInfo[];
    pickupDate: string;
    returnDate: string;
    onPickupDateChange?: (date: string) => void;
    onReturnDateChange?: (date: string) => void;
}) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const bookedMap = useBookedMap(bookedDates || []);

    const nextMonth = useMemo(
        () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
        [currentMonth],
    );

    function buildMonthDays(monthDate: Date) {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pickup = pickupDate ? new Date(pickupDate + 'T00:00:00') : null;
        const ret = returnDate ? new Date(returnDate + 'T00:00:00') : null;

        const days: DayCell[] = [];
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: 0, iso: '', status: 'available', variant: 'available', tooltip: '', isToday: false, isPast: true, inRange: false, isStart: false, isEnd: false });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = toLocalDateString(date);
            const info = getDayStatus(dateStr, bookedMap);
            days.push({
                day: d,
                iso: dateStr,
                status: info.status,
                variant: info.variant,
                tooltip: info.tooltip,
                isToday: dateStr === toLocalDateString(today),
                isPast: date < today,
                inRange: !!(pickup && ret && date >= pickup && date <= ret),
                isStart: pickup ? dateStr === toLocalDateString(pickup) : false,
                isEnd: ret ? dateStr === toLocalDateString(ret) : false,
            });
        }
        return days;
    }

    const primaryDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth, bookedMap, pickupDate, returnDate]);
    const secondaryDays = useMemo(() => buildMonthDays(nextMonth), [nextMonth, bookedMap, pickupDate, returnDate]);

    const selectingReturn = !!pickupDate && !returnDate;

    const handleDayClick = (d: DayCell) => {
        if (d.day === 0 || d.isPast || d.status === 'full') return;
        if (!pickupDate || (pickupDate && returnDate)) {
            onPickupDateChange?.(d.iso);
            if (returnDate) onReturnDateChange?.('');
        } else {
            if (new Date(d.iso) >= new Date(pickupDate)) {
                onReturnDateChange?.(d.iso);
            } else {
                onPickupDateChange?.(d.iso);
            }
        }
    };

    const applyPreset = (days: number) => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + days - 1);
        onPickupDateChange?.(toLocalDateString(start));
        onReturnDateChange?.(toLocalDateString(end));
    };

    const diffDays = pickupDate && returnDate
        ? Math.round((new Date(returnDate + 'T00:00:00').getTime() - new Date(pickupDate + 'T00:00:00').getTime()) / 86400000)
        : 0;

    const monthLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const earliest = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const canGoPrev = currentMonth > earliest;
    const goPrev = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const goNext = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const bookedCount = [...primaryDays, ...secondaryDays].filter((d) => d.status === 'full' && d.day > 0).length;
    const partialCount = [...primaryDays, ...secondaryDays].filter((d) => d.status === 'partial' && d.day > 0).length;
    const availableCount = [...primaryDays, ...secondaryDays].filter((d) => d.status === 'available' && !d.isPast && d.day > 0).length;

    return (
        <div className="space-y-5">
            {/* Quick presets */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-2">Quick Select</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Weekend', days: 3 },
                        { label: '3 Days', days: 3 },
                        { label: '5 Days', days: 5 },
                        { label: '7 Days', days: 7 },
                        { label: '14 Days', days: 14 },
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => applyPreset(preset.days)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-50 text-surface-700 border border-surface-200 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all active:scale-95"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected dates summary */}
            {pickupDate && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 border border-brand-200">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-brand-700">{formatDate(pickupDate)}</span>
                        {returnDate && (
                            <>
                                <span className="text-brand-300">→</span>
                                <span className="font-semibold text-brand-700">{formatDate(returnDate)}</span>
                            </>
                        )}
                        {returnDate && (
                            <span className="text-xs text-brand-500">
                                ({diffDays} {diffDays === 1 ? 'day' : 'days'})
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => { onPickupDateChange?.(''); onReturnDateChange?.(''); }}
                        className="ml-auto text-[10px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-100/50 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Hint */}
            <p className="text-xs text-surface-500">
                {selectingReturn
                    ? `Select a return date (after ${new Date(pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
                    : 'Select pickup and return dates from the calendar'}
            </p>

            {/* Dual month grid */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={goPrev} disabled={!canGoPrev} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <svg className="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm font-bold text-surface-900">{monthLabel(currentMonth)}</span>
                        <div className="w-7" />
                    </div>
                    <MonthGrid days={primaryDays} handleDayClick={handleDayClick} pickupDate={pickupDate} selectingReturn={selectingReturn} />
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-7" />
                        <span className="text-sm font-bold text-surface-900">{monthLabel(nextMonth)}</span>
                        <button type="button" onClick={goNext} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
                            <svg className="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <MonthGrid days={secondaryDays} handleDayClick={handleDayClick} pickupDate={pickupDate} selectingReturn={selectingReturn} />
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-surface-100">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-surface-500">{availableCount} available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-[10px] text-surface-500">{partialCount} partial</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                    <span className="text-[10px] text-surface-500">{bookedCount} booked</span>
                </div>
                {pickupDate && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                        <span className="text-[10px] text-surface-500">selected</span>
                    </div>
                )}
            </div>
        </div>
    );
}

interface DayCell {
    day: number;
    iso: string;
    status: string;
    variant: string;
    tooltip: string;
    isToday: boolean;
    isPast: boolean;
    inRange: boolean;
    isStart: boolean;
    isEnd: boolean;
}

function MonthGrid({
    days,
    handleDayClick,
    pickupDate,
    selectingReturn,
}: {
    days: DayCell[];
    handleDayClick: (d: DayCell) => void;
    pickupDate: string;
    selectingReturn: boolean;
}) {
    return (
        <>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold text-surface-400 uppercase tracking-wider py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {days.map((d, i) => {
                    const isClickable = d.day > 0 && !d.isPast && d.status !== 'full';
                    const isSelected = d.isStart || d.isEnd;
                    let cls = 'aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-150 ';
                    if (d.day === 0) {
                        cls += '';
                    } else if (d.isPast) {
                        cls += 'text-surface-300 bg-surface-50';
                    } else if (d.variant === 'full') {
                        cls += 'bg-red-50 text-red-600 font-bold';
                    } else if (d.variant === 'end-partial') {
                        cls += 'bg-emerald-50 text-emerald-700 font-bold';
                    } else if (d.variant === 'start-partial' || d.variant === 'both-partial') {
                        cls += 'bg-amber-50 text-amber-700 font-bold';
                    } else if (d.inRange) {
                        cls += isSelected
                            ? 'bg-brand-600 text-white font-bold shadow-lg shadow-brand-600/30'
                            : 'bg-brand-100 text-brand-700 font-semibold';
                    } else {
                        cls += 'bg-emerald-50 text-emerald-700';
                    }
                    if (isClickable && !isSelected) cls += ' cursor-pointer hover:ring-2 hover:ring-brand-400 hover:ring-offset-1 hover:scale-110';
                    if (isClickable && selectingReturn && !d.inRange && !d.isStart && d.iso > pickupDate) cls += ' ring-1 ring-brand-300/50';
                    if (d.isToday && !isSelected) cls += ' ring-2 ring-brand-500 ring-offset-1';
                    if (isSelected) cls += ' ring-2 ring-brand-600 ring-offset-2 scale-110 z-10';
                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={!isClickable}
                            onClick={() => handleDayClick(d)}
                            className={cls}
                            title={d.tooltip}
                        >
                            {d.day > 0 ? d.day : ''}
                        </button>
                    );
                })}
            </div>
        </>
    );
}

function MiniAvailabilityStrip({ bookedDates, days = 14 }: { bookedDates?: BookedDateInfo[]; days?: number }) {
    const bookedMap = useBookedMap(bookedDates || []);
    const cells = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const arr: { iso: string; variant: string; tooltip: string }[] = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const iso = toLocalDateString(d);
            const info = getDayStatus(iso, bookedMap);
            arr.push({
                iso,
                variant: info.variant,
                tooltip: `${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${info.tooltip}`,
            });
        }
        return arr;
    }, [bookedMap, days]);
    const openCount = cells.filter((c) => c.variant !== 'full').length;

    function stripColor(variant: string): string {
        if (variant === 'end-partial') return 'bg-emerald-400';
        if (variant === 'start-partial' || variant === 'both-partial') return 'bg-amber-400';
        if (variant === 'full') return 'bg-red-300';
        return 'bg-emerald-400';
    }

    return (
        <div className="space-y-1">
            <div className="flex gap-[2px]">
                {cells.map((c) => (
                    <div
                        key={c.iso}
                        title={c.tooltip}
                        className={`h-2 flex-1 rounded-full ${stripColor(c.variant)}`}
                    />
                ))}
            </div>
            <p className="text-[10px] font-medium text-surface-400">{openCount} of {days} days open</p>
        </div>
    );
}

const stepKeyframes = `
@keyframes stepBounce { 0% { transform: scale(0.8); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
@keyframes checkMorph { 0% { transform: scale(0) rotate(-45deg); opacity: 0; } 50% { transform: scale(1.2) rotate(0deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
@keyframes lineShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes confettiBurst { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-30px) rotate(180deg); opacity: 0; } }
@keyframes tooltipFade { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
`;

function BookingStepBar({ currentStep }: { currentStep: number }) {
    const [hoveredStep, setHoveredStep] = useState<number | null>(null);
    const [animatingStep, setAnimatingStep] = useState<number | null>(null);
    const prevStep = useRef(currentStep);

    useEffect(() => {
        if (prevStep.current !== currentStep) {
            setAnimatingStep(currentStep);
            const t = setTimeout(() => setAnimatingStep(null), 500);
            prevStep.current = currentStep;
            return () => clearTimeout(t);
        }
    }, [currentStep]);

    const steps = [
        { num: 1, label: 'Browse Fleet', desc: 'Explore our collection', tooltip: 'View all available vehicles in our fleet' },
        { num: 2, label: 'Pick a Car', desc: 'Choose your ride', tooltip: 'Select the perfect car for your journey' },
        { num: 3, label: 'Set Details', desc: 'Configure booking', tooltip: 'Set pickup dates, times, and locations' },
        { num: 4, label: 'Book Now', desc: 'Confirm & pay', tooltip: 'Review and complete your reservation' },
    ];

    const progressPercent = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

    return (
        <>
            <style>{stepKeyframes}</style>
            <div className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-surface-100 bg-white px-4 py-5 shadow-card sm:px-8 sm:py-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-50/40 via-transparent to-accent-50/30 pointer-events-none" />

                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-surface-100/50">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500 transition-all duration-700 ease-out"
                            style={{
                                width: `${progressPercent}%`,
                                backgroundSize: '200% 100%',
                                animation: 'lineShimmer 2s linear infinite',
                            }}
                        />
                    </div>

                    <div className="relative flex items-center justify-between gap-0 mx-auto max-w-lg">
                        {steps.map((step, i) => {
                            const isCompleted = step.num < currentStep;
                            const isCurrent = step.num === currentStep;
                            const isLast = i === steps.length - 1;
                            const isAnimating = animatingStep === step.num;
                            const isHovered = hoveredStep === step.num;

                            return (
                                <React.Fragment key={step.num}>
                                    <div
                                        className="relative flex shrink-0 items-center gap-1.5 sm:flex-col sm:items-center sm:gap-0.5"
                                        onMouseEnter={() => setHoveredStep(step.num)}
                                        onMouseLeave={() => setHoveredStep(null)}
                                    >
                                        {isHovered && (
                                            <div
                                                className="absolute top-full mt-1 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-surface-900 px-2.5 py-1 text-[9px] font-medium text-white"
                                                style={{ animation: 'tooltipFade 0.2s ease-out' }}
                                            >
                                                {step.tooltip}
                                                <div className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-l-[3px] border-r-[3px] border-b-[3px] border-transparent border-b-surface-900" />
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const urls: Record<number, string> = {
                                                    1: '/fleet',
                                                    2: '/fleet',
                                                    3: '/fleet',
                                                };
                                                const url = urls[step.num];
                                                if (url) router.visit(url);
                                            }}
                                            className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 sm:h-9 sm:w-9 sm:text-xs ${
                                                isCompleted
                                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/25 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-110 active:scale-95'
                                                    : isCurrent
                                                        ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-700/30 ring-2 ring-brand-200/50 sm:ring-3'
                                                        : 'bg-surface-100/80 text-surface-400 cursor-pointer hover:bg-surface-200/80 hover:scale-105'
                                            } ${isAnimating ? 'scale-110' : ''}`}
                                            style={{
                                                animation: isAnimating ? 'stepBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : undefined,
                                            }}
                                        >
                                            {isCurrent && (
                                                <span
                                                    className="absolute inset-0 rounded-full border-2 border-brand-400"
                                                    style={{ animation: 'pulseRing 2s ease-out infinite' }}
                                                />
                                            )}

                                            {isCurrent && currentStep === 4 && (
                                                <>
                                                    <span className="absolute -top-0.5 left-1/2 h-1 w-1 rounded-full bg-accent-400" style={{ animation: 'confettiBurst 1s ease-out infinite' }} />
                                                    <span className="absolute -top-0.5 left-1/3 h-0.5 w-0.5 rounded-full bg-emerald-400" style={{ animation: 'confettiBurst 1s ease-out infinite 0.2s' }} />
                                                    <span className="absolute -top-0.5 right-1/3 h-0.5 w-0.5 rounded-full bg-brand-400" style={{ animation: 'confettiBurst 1s ease-out infinite 0.4s' }} />
                                                </>
                                            )}

                                            {isCompleted ? (
                                                <svg
                                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    style={{ animation: 'checkMorph 0.5s ease-out' }}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span>{step.num}</span>
                                            )}
                                        </button>

                                        <div className="flex flex-col sm:items-center sm:gap-0">
                                            <span
                                                className={`text-[9px] font-bold leading-tight transition-colors duration-300 sm:text-[10px] ${
                                                    isCompleted
                                                        ? 'text-emerald-600'
                                                        : isCurrent
                                                            ? 'text-surface-900'
                                                            : 'text-surface-400'
                                                }`}
                                            >
                                                {step.label}
                                            </span>
                                            <span
                                                className={`hidden text-[7px] font-medium leading-tight transition-colors duration-300 sm:block sm:text-[8px] ${
                                                    isCompleted
                                                        ? 'text-emerald-400'
                                                        : isCurrent
                                                            ? 'text-surface-500'
                                                            : 'text-surface-300'
                                                }`}
                                            >
                                                {step.desc}
                                            </span>
                                        </div>
                                    </div>

                                    {!isLast && (
                                        <div className="mx-1.5 mb-4 flex-1 sm:mx-2 sm:mb-5">
                                            <div className="relative h-0.5 overflow-hidden rounded-full bg-surface-200/50">
                                                <div
                                                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                                                        isCompleted ? 'w-full' : isCurrent ? 'w-1/2' : 'w-0'
                                                    }`}
                                                    style={{
                                                        background: isCompleted
                                                            ? 'linear-gradient(90deg, #34d399, #10b981, #059669)'
                                                            : isCurrent
                                                                ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                                                                : 'transparent',
                                                        backgroundSize: '200% 100%',
                                                        animation: isCompleted ? 'lineShimmer 2s linear infinite' : undefined,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-1.5 border-t border-surface-200/30 pt-2 sm:hidden">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-surface-400">
                            {currentStep}/{steps.length}
                        </span>
                        <div className="flex gap-0.5">
                            {steps.map((step) => (
                                <div
                                    key={step.num}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        step.num < currentStep
                                            ? 'w-1.5 bg-emerald-500'
                                            : step.num === currentStep
                                                ? 'w-2.5 bg-brand-600'
                                                : 'w-1.5 bg-surface-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function Spec({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-surface-400">{label}</p>
            <p className="font-medium text-surface-700">{value}</p>
        </div>
    );
}

function SummaryRow({
    label,
    value,
    bold,
    accent,
}: {
    label: string;
    value: string;
    bold?: boolean;
    accent?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className={bold ? 'font-semibold text-surface-900' : 'text-surface-500'}>
                {label}
            </span>
            <span
                className={`${
                    bold
                        ? 'text-lg font-bold text-surface-900'
                        : accent
                        ? 'font-semibold text-green-600'
                        : 'font-medium text-surface-800'
                }`}
            >
                {value}
            </span>
        </div>
    );
}
