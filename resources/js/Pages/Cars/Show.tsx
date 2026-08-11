import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { useState, useMemo, useEffect, useRef } from 'react';

interface BookedDateInfo {
    date: string;
    status: 'full' | 'partial';
    available_before?: string;
    available_after?: string;
}

interface CarShowProps {
    car: {
        id: number;
        brand: string;
        model: string;
        year: number;
        license_plate: string;
        description: string | null;
        daily_rate: number;
        fuel_type: string;
        seats: number;
        transmission: string;
        image_path: string | null;
        status: string;
        avg_rating?: number;
        ratings_count?: number;
        vehicle_type?: string;
    };
    booked_dates: BookedDateInfo[];
    similar_cars: {
        id: number;
        brand: string;
        model: string;
        year: number;
        daily_rate: number;
        image_path: string | null;
        avg_rating?: number;
        ratings_count?: number;
        vehicle_type?: string;
    }[];
    canLogin: boolean;
    canRegister: boolean;
    isAuthenticated: boolean;
    reviews: {
        id: number;
        rating: number;
        comment: string | null;
        created_at?: string;
        customer_name: string;
    }[];
}

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

const VEHICLE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Economy': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Regular SUV\'S': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'SUV': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Vans': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    'Full Size Van': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    'Flatbeds': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Luxury': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

function getVehicleTypeStyle(type: string) {
    return VEHICLE_TYPE_COLORS[type] || { bg: 'bg-surface-100', text: 'text-surface-700', border: 'border-surface-200' };
}

function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getCarImage(imagePath: string | null, carId: number): string {
    if (imagePath) return `/storage/${imagePath}`;
    return CAR_IMAGES[carId % CAR_IMAGES.length];
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function useBookedMap(booked: BookedDateInfo[]): Map<string, BookedDateInfo> {
    return useMemo(() => {
        const map = new Map<string, BookedDateInfo>();
        for (const entry of booked) map.set(entry.date, entry);
        return map;
    }, [booked]);
}

function fmtTime(t: string): string {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
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
        return { status: 'partial', tooltip: `Available ${fmtTime(info.available_after!)} – ${fmtTime(info.available_before!)}`, variant: 'both-partial' };
    }
    if (hasBefore) {
        return { status: 'partial', tooltip: `Available until ${fmtTime(info.available_before!)}`, variant: 'start-partial' };
    }
    return { status: 'partial', tooltip: `Available from ${fmtTime(info.available_after!)}`, variant: 'end-partial' };
}

function MiniAvailabilityStrip({ bookedDates }: { bookedDates: BookedDateInfo[] }) {
    const bookedMap = useBookedMap(bookedDates);
    const cells = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const arr: { iso: string; status: 'full' | 'partial' | 'available'; variant: string; tooltip: string }[] = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const iso = toLocalDateString(d);
            const info = getDayStatus(iso, bookedMap);
            arr.push({
                iso,
                status: info.status,
                variant: info.variant,
                tooltip: `${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${info.tooltip}`,
            });
        }
        return arr;
    }, [bookedMap]);
    const openCount = cells.filter((c) => c.status !== 'full').length;

    function stripColor(variant: string): string {
        if (variant === 'end-partial') return 'bg-emerald-400/90';
        if (variant === 'start-partial' || variant === 'both-partial') return 'bg-amber-400/80';
        if (variant === 'full') return 'bg-red-400/80';
        return 'bg-emerald-400/90';
    }

    return (
        <div className="flex items-center gap-2.5">
            <div className="flex gap-[2px] flex-1">
                {cells.map((c) => (
                    <div
                        key={c.iso}
                        title={c.tooltip}
                        className={`h-1.5 flex-1 rounded-full ${stripColor(c.variant)}`}
                    />
                ))}
            </div>
            <span className="text-[10px] font-bold text-surface-400 tabular-nums whitespace-nowrap">{openCount}d open</span>
        </div>
    );
}

function AvailabilityCalendar({ bookedDates }: { bookedDates: BookedDateInfo[] }) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const bookedMap = useBookedMap(bookedDates);

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days: { day: number; status: 'full' | 'partial' | 'available'; variant: string; tooltip: string; isToday: boolean; isPast: boolean }[] = [];
        for (let i = 0; i < firstDay; i++) days.push({ day: 0, status: 'available', variant: 'available', tooltip: '', isToday: false, isPast: true });
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dayInfo = getDayStatus(toLocalDateString(date), bookedMap);
            days.push({ day: d, status: dayInfo.status, variant: dayInfo.variant, tooltip: dayInfo.tooltip, isToday: toLocalDateString(date) === toLocalDateString(today), isPast: date < today });
        }
        return days;
    }, [currentMonth, bookedMap]);

    const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const bookedCount = calendarDays.filter((d) => d.status === 'full' && !d.isPast).length;
    const partialCount = calendarDays.filter((d) => d.status === 'partial' && !d.isPast).length;
    const availableCount = calendarDays.filter((d) => d.status === 'available' && !d.isPast && d.day > 0).length;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-surface-100 transition-colors group">
                    <svg className="w-4 h-4 text-surface-500 group-hover:text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h3 className="text-sm font-bold text-surface-900">{monthLabel}</h3>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-surface-100 transition-colors group">
                    <svg className="w-4 h-4 text-surface-500 group-hover:text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold text-surface-400 uppercase tracking-wider py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((d, i) => {
                    function dayColor(v: string): string {
                        if (v === 'end-partial') return 'bg-emerald-50 text-emerald-700 font-bold';
                        if (v === 'start-partial' || v === 'both-partial') return 'bg-amber-50 text-amber-700 font-bold';
                        if (v === 'full') return 'bg-red-50 text-red-600 font-bold';
                        return '';
                    }
                    return (
                        <div
                            key={i}
                            title={d.tooltip}
                            className={`
                                aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-150
                                ${d.day === 0 ? '' : 'cursor-default hover:scale-110'}
                                ${d.isPast && d.day > 0 ? 'text-surface-300 bg-surface-50' : ''}
                                ${d.status === 'full' ? 'bg-red-50 text-red-600 font-bold' : ''}
                                ${d.variant === 'end-partial' ? 'bg-emerald-50 text-emerald-700 font-bold' : ''}
                                ${d.variant === 'start-partial' || d.variant === 'both-partial' ? 'bg-amber-50 text-amber-700 font-bold' : ''}
                                ${d.status === 'available' && !d.isPast && d.day > 0 ? 'bg-emerald-50 text-emerald-700' : ''}
                                ${d.isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''}
                            `}
                        >
                            {d.day > 0 ? d.day : ''}
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-surface-100">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-surface-500">{availableCount} available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-[11px] text-surface-500">{partialCount} partial</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                    <span className="text-[11px] text-surface-500">{bookedCount} confirmed</span>
                </div>
            </div>
        </div>
    );
}

type Tab = 'overview' | 'availability' | 'reviews';

export default function CarShow({ car, booked_dates, similar_cars, canLogin, canRegister, isAuthenticated, reviews }: CarShowProps) {
    const route = useRoute();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.classList.remove('animate-fade-in');
            void contentRef.current.offsetWidth;
            contentRef.current.classList.add('animate-fade-in');
        }
    }, [activeTab]);

    const specs = [
        { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Seats', value: car.seats },
        { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Transmission', value: (car.transmission ?? '').charAt(0).toUpperCase() + (car.transmission ?? '').slice(1) || '—' },
        { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Fuel', value: (car.fuel_type ?? '').charAt(0).toUpperCase() + (car.fuel_type ?? '').slice(1) || '—' },
        { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Year', value: car.year },
    ];

    const tabs: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'availability', label: 'Availability' },
        { key: 'reviews', label: 'Reviews' },
    ];

    const now = new Date();
    const thisMonthBookings = useMemo(() => {
        let count = 0;
        for (const bd of booked_dates) {
            const [y, m] = bd.date.split('-').map(Number);
            if (m - 1 === now.getMonth() && y === now.getFullYear() && bd.status === 'full') {
                count++;
            }
        }
        return count;
    }, [booked_dates]);
    const availabilityPct = Math.max(0, 100 - Math.round(thisMonthBookings / 30 * 100));

    const priceEstimates = [
        { days: 1, label: '1 day' },
        { days: 3, label: '3 days' },
        { days: 7, label: '7 days' },
    ];

    const typeStyle = getVehicleTypeStyle(car.vehicle_type ?? '');

    const ratingBreakdown = useMemo(() => {
        const counts = [0, 0, 0, 0, 0];
        reviews.forEach((r) => {
            const s = Math.max(1, Math.min(5, r.rating));
            counts[s - 1]++;
        });
        const total = reviews.length;
        return [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: counts[star - 1],
            pct: total > 0 ? Math.round((counts[star - 1] / total) * 100) : 0,
        }));
    }, [reviews]);

    return (
        <>
            <Head title={`${car.brand} ${car.model}`} />
            <GuestLayout canLogin={canLogin} canRegister={canRegister}>
                <div className="bg-surface-50 min-h-screen">
                    {/* ═══════════ FLOATING TOOLBAR ═══════════ */}
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-2xl border border-surface-100 shadow-sm px-3 py-2">
                            {/* Back Button */}
                            <Link href={route('fleet')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-surface-500 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all duration-200 text-xs font-semibold group flex-shrink-0">
                                <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </Link>

                            {/* Divider */}
                            <div className="w-px h-5 bg-surface-200" />

                            {/* Breadcrumb */}
                            <nav className="flex items-center gap-1.5 text-[11px] min-w-0">
                                <Link href={route('cars.index')} className="text-surface-400 hover:text-brand-700 transition-colors whitespace-nowrap">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                                    </svg>
                                </Link>
                                <svg className="w-3 h-3 text-surface-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                <Link href={route('fleet')} className="text-surface-400 hover:text-brand-700 transition-colors whitespace-nowrap">
                                    Fleet
                                </Link>
                                <svg className="w-3 h-3 text-surface-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                <span className="text-surface-700 font-semibold truncate">{car.brand} {car.model}</span>
                            </nav>
                        </div>
                    </div>

                    {/* ═══════════ SIDE-BY-SIDE CARDS ═══════════ */}
                    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* ── Image Card ── */}
                            <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-in group">
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={getCarImage(car.image_path, car.id)}
                                        alt={`${car.brand} ${car.model}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                                    {/* Top-left badges */}
                                    <div className="absolute top-3 left-3 flex items-center gap-2">
                                        <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold bg-white/90 backdrop-blur-sm text-surface-700 rounded-lg shadow-sm">
                                            {car.year}
                                        </span>
                                        {car.vehicle_type && (
                                            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold ${typeStyle.bg} ${typeStyle.text} rounded-lg border ${typeStyle.border} shadow-sm`}>
                                                {car.vehicle_type}
                                            </span>
                                        )}
                                    </div>

                                    {/* Top-right badges */}
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        {car.status === 'available' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-sm text-white rounded-lg text-[10px] font-bold shadow-sm">
                                                <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                                Available
                                            </span>
                                        )}
                                        {car.ratings_count != null && car.ratings_count > 0 && car.avg_rating != null && car.avg_rating > 0 && (
                                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                                <svg className="w-3 h-3 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                <span className="text-[11px] font-bold text-surface-700">{car.avg_rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Image card footer */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-lg font-bold text-surface-900 leading-tight">
                                                {car.brand} <span className="text-surface-500 font-normal">{car.model}</span>
                                            </h1>
                                            <p className="text-[11px] text-surface-400 font-mono mt-0.5">{car.license_plate}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-bold text-surface-900">{formatPrice(car.daily_rate)}</span>
                                            <span className="text-[10px] text-surface-400 block">/day</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Info Card ── */}
                            <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                {/* Header */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {car.ratings_count != null && car.ratings_count > 0 && car.avg_rating != null && car.avg_rating > 0 ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <svg key={star} className={`w-4 h-4 ${star <= Math.round(car.avg_rating!) ? 'text-accent-400' : 'text-surface-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <span className="text-xs font-bold text-surface-700">{car.avg_rating.toFixed(1)}</span>
                                                <span className="text-[11px] text-surface-400">({car.ratings_count})</span>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-100 text-surface-500 rounded-md text-[10px] font-semibold">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-sm font-bold text-surface-900">Specifications</h2>
                                </div>

                                {/* Specs Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {specs.map((spec) => (
                                        <div key={spec.label} className="flex items-center gap-2.5 p-2.5 bg-surface-50 rounded-xl">
                                            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={spec.icon} />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider">{spec.label}</p>
                                                <p className="text-sm font-bold text-surface-900">{spec.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Availability Strip */}
                                <div className="mb-4">
                                    <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1.5">Next 14 Days</p>
                                    <MiniAvailabilityStrip bookedDates={booked_dates} />
                                </div>

                                {/* Price Estimation Table */}
                                <div className="mb-4">
                                    <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-2">Price Estimate</p>
                                    <div className="bg-surface-50 rounded-xl overflow-hidden">
                                        {priceEstimates.map((est, i) => (
                                            <div key={est.days} className={`flex items-center justify-between px-3 py-2 ${i < priceEstimates.length - 1 ? 'border-b border-surface-100' : ''}`}>
                                                <span className="text-xs text-surface-600 font-medium">{est.label}</span>
                                                <span className="text-sm font-bold text-surface-900">{formatPrice(car.daily_rate * est.days)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* CTA */}
                                <div className="pt-3 border-t border-surface-100">
                                    <Link
                                        href={isAuthenticated ? route('bookings.create', car.id) : route('book.now', { carId: car.id })}
                                        className="w-full text-center block btn-accent !py-3 text-sm group"
                                    >
                                        {isAuthenticated ? 'Book This Car' : 'Book Now'}
                                        <svg className="w-4 h-4 inline-block ml-1.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ═══════════ TRUST INDICATORS ═══════════ */}
                    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                        <div className="bg-white rounded-2xl shadow-card p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Free Cancellation', sub: 'Up to 24h before' },
                                    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Instant Confirmation', sub: 'Book in seconds' },
                                    { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', label: '24/7 Support', sub: 'Always here to help' },
                                    { icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', label: 'Best Price Guarantee', sub: 'No hidden fees' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4.5 h-4.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-surface-900">{item.label}</p>
                                            <p className="text-[10px] text-surface-400">{item.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ═══════════ TABS SECTION ═══════════ */}
                    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                        <div className="flex gap-1 p-1 bg-white rounded-xl border border-surface-100 mb-5 w-fit shadow-sm">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`
                                        px-4 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-all duration-200
                                        ${activeTab === tab.key
                                            ? 'text-white bg-brand-700 shadow-sm'
                                            : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
                                        }
                                    `}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div ref={contentRef} className="animate-fade-in">
                            {/* ═══ OVERVIEW TAB ═══ */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    <div className="lg:col-span-2 space-y-5">
                                        {/* Description */}
                                        {car.description && (
                                            <div className="bg-white rounded-2xl shadow-card p-5">
                                                <h3 className="text-sm font-bold text-surface-900 mb-2">About this vehicle</h3>
                                                <p className="text-surface-600 text-sm leading-relaxed">{car.description}</p>
                                            </div>
                                        )}

                                        {/* Feature Highlights */}
                                        <div className="bg-white rounded-2xl shadow-card p-5">
                                            <h3 className="text-sm font-bold text-surface-900 mb-3">Features</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {[
                                                    { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'Air Conditioning' },
                                                    { icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0', label: 'Bluetooth' },
                                                    { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', label: 'Backup Camera' },
                                                    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'USB Charging' },
                                                    { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', label: 'Mobile App' },
                                                    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Roadside Assist' },
                                                ].map((feat) => (
                                                    <div key={feat.label} className="flex items-center gap-2.5 p-2.5 bg-surface-50 rounded-xl">
                                                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feat.icon} />
                                                            </svg>
                                                        </div>
                                                        <span className="text-xs font-medium text-surface-700">{feat.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Perks */}
                                        <div className="bg-gradient-to-r from-brand-50 to-accent-50 rounded-2xl p-5 border border-brand-100/50">
                                            <h3 className="text-sm font-bold text-surface-900 mb-3">Included with your rental</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Free cancellation up to 24h' },
                                                    { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: '24/7 roadside assistance' },
                                                    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'No hidden fees' },
                                                    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Instant booking confirmation' },
                                                ].map((perk) => (
                                                    <div key={perk.label} className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={perk.icon} />
                                                        </svg>
                                                        <span className="text-xs text-surface-600">{perk.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar */}
                                    <div>
                                        <div className="bg-white rounded-2xl shadow-card p-5">
                                            <h3 className="text-sm font-bold text-surface-900 mb-3">Quick Info</h3>
                                            <div className="space-y-2.5">
                                                {[
                                                    { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Daily Rate', value: formatPrice(car.daily_rate), bold: true },
                                                    { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Weekly Est.', value: formatPrice(car.daily_rate * 7), bold: true },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between p-2.5 bg-surface-50 rounded-xl">
                                                        <span className="text-xs text-surface-500 flex items-center gap-2">
                                                            <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                                            </svg>
                                                            {item.label}
                                                        </span>
                                                        <span className={`text-sm ${item.bold ? 'font-bold text-surface-900' : 'font-medium text-surface-700'}`}>{item.value}</span>
                                                    </div>
                                                ))}
                                                <div className="h-px bg-surface-100 my-1" />
                                                {[
                                                    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Fuel', value: ((car.fuel_type ?? '').charAt(0).toUpperCase() + (car.fuel_type ?? '').slice(1)) || '—' },
                                                    { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Seats', value: car.seats },
                                                    { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Transmission', value: ((car.transmission ?? '').charAt(0).toUpperCase() + (car.transmission ?? '').slice(1)) || '—' },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-50 transition-colors">
                                                        <span className="text-xs text-surface-500 flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                                                </svg>
                                                            </div>
                                                            {item.label}
                                                        </span>
                                                        <span className="text-sm font-medium text-surface-700">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ AVAILABILITY TAB ═══ */}
                            {activeTab === 'availability' && (
                                <div className="max-w-2xl">
                                    <div className="bg-white rounded-2xl shadow-card p-5">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-sm font-bold text-surface-900">Availability Calendar</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                                    <span className="text-[10px] text-surface-500">Available</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                                                    <span className="text-[10px] text-surface-500">Confirmed</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-surface-400 text-xs mb-5">Next 60 days — plan your trip</p>
                                        <AvailabilityCalendar bookedDates={booked_dates} />

                                        {/* Monthly Summary */}
                                        <div className="mt-5 pt-4 border-t border-surface-100">
                                            <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-2">This Month</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between text-[11px] mb-1">
                                                        <span className="text-surface-500">Availability</span>
                                                        <span className="font-bold text-emerald-600">{thisMonthBookings === 0 ? '100%' : `${availabilityPct}%`}</span>
                                                    </div>
                                                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${availabilityPct}%` }} />
                                                    </div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-surface-400 mt-2">
                                                    💡 Book early for the best rates and availability
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                            )}

                            {/* ═══ REVIEWS TAB ═══ */}
                            {activeTab === 'reviews' && (
                                <div className="max-w-2xl">
                                    <div className="bg-white rounded-2xl shadow-card p-5">
                                        <h3 className="text-sm font-bold text-surface-900 mb-5">Customer Reviews</h3>

                                        {car.ratings_count != null && car.ratings_count > 0 && car.avg_rating != null && car.avg_rating > 0 ? (
                                            <div>
                                                {/* Rating Summary */}
                                                <div className="flex items-center gap-5 mb-5 pb-5 border-b border-surface-100">
                                                    {/* Circular Score */}
                                                    <div className="relative w-20 h-20 flex-shrink-0">
                                                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                                            <circle cx="40" cy="40" r="35" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                                                            <circle cx="40" cy="40" r="35" fill="none" stroke="url(#scoreGradient)" strokeWidth="6" strokeLinecap="round"
                                                                strokeDasharray={`${(car.avg_rating / 5) * 220} 220`} />
                                                            <defs>
                                                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                    <stop offset="0%" stopColor="#f5c518" />
                                                                    <stop offset="100%" stopColor="#f59e0b" />
                                                                </linearGradient>
                                                            </defs>
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-xl font-bold text-surface-900">{car.avg_rating.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-0.5 mb-1">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <svg key={star} className={`w-4 h-4 ${star <= Math.round(car.avg_rating!) ? 'text-accent-400' : 'text-surface-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-surface-500">Based on {car.ratings_count} {car.ratings_count === 1 ? 'review' : 'reviews'}</p>
                                                    </div>
                                                </div>

                                                {/* Rating Bars */}
                                                <div className="space-y-2">
                                                    {ratingBreakdown.map(({ star, count, pct }) => (
                                                        <div key={star} className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-surface-400 w-2">{star}</span>
                                                            <svg className="w-3 h-3 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                            <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className="text-[10px] text-surface-400 w-7 text-right tabular-nums">{pct}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Rich Empty State */
                                            <div>
                                                <div className="text-center py-6 mb-5 bg-surface-50 rounded-2xl">
                                                    {/* Circular placeholder */}
                                                    <div className="relative w-20 h-20 mx-auto mb-3">
                                                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                                            <circle cx="40" cy="40" r="35" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                                                            <circle cx="40" cy="40" r="35" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" strokeDasharray="50 170" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <svg className="w-7 h-7 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <p className="text-surface-500 text-sm font-semibold mb-1">No reviews yet</p>
                                                    <p className="text-surface-400 text-xs">Be the first to share your experience</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Customer Reviews */}
                                        {reviews.length > 0 && (
                                            <div className="mt-6 space-y-3">
                                                {reviews.map((review) => (
                                                    <div key={review.id} className="p-4 bg-surface-50 rounded-xl border border-surface-200">
                                                        <div className="flex items-center gap-2.5 mb-2">
                                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-brand-100 text-brand-700">
                                                                {review.customer_name.split(/\s+/).map((part) => part.charAt(0)).slice(0, 2).join('').toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-surface-700">{review.customer_name || 'Anonymous'}</p>
                                                                <div className="flex items-center gap-1">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <svg key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? 'text-accent-400' : 'text-surface-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {review.created_at && (
                                                                <span className="ml-auto text-[10px] text-surface-400">{review.created_at}</span>
                                                            )}
                                                        </div>
                                                        {review.comment && (
                                                            <p className="text-xs text-surface-600 leading-relaxed">{review.comment}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ═══════════ SIMILAR CARS ═══════════ */}
                    {similar_cars.length > 0 && (
                        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-surface-900">Similar Cars</h2>
                                <Link href={route('cars.index')} className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                                    View all →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {similar_cars.map((sc) => {
                                    const scTypeStyle = getVehicleTypeStyle(sc.vehicle_type ?? '');
                                    return (
                                        <Link
                                            key={sc.id}
                                            href={route('cars.show', sc.id)}
                                            className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 group"
                                        >
                                            <div className="relative aspect-[4/3] overflow-hidden">
                                                <img
                                                    src={getCarImage(sc.image_path, sc.id)}
                                                    alt={`${sc.brand} ${sc.model}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                {sc.vehicle_type && (
                                                    <span className={`absolute top-2 left-2 inline-flex items-center px-2 py-0.5 text-[9px] font-bold ${scTypeStyle.bg} ${scTypeStyle.text} rounded-md border ${scTypeStyle.border}`}>
                                                        {sc.vehicle_type}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-xs font-bold text-surface-900 leading-tight">
                                                    {sc.brand} <span className="text-surface-500 font-normal">{sc.model}</span>
                                                </h3>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className="text-sm font-bold text-surface-900">{formatPrice(sc.daily_rate)}</span>
                                                    {sc.ratings_count != null && sc.ratings_count > 0 && sc.avg_rating != null && sc.avg_rating > 0 && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-surface-500">
                                                            <svg className="w-3 h-3 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                            {sc.avg_rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </GuestLayout>
        </>
    );
}
