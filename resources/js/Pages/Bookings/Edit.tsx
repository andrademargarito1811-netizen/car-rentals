import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { countries } from '@/data/countries';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Car {
    id: number;
    brand: string;
    model: string;
    year: number;
    daily_rate: number;
    license_plate: string;
    image_path: string | null;
    location: { location: string } | null;
    seats?: number;
    transmission?: string;
    fuel_type?: string;
    vehicle_type?: string | null;
}

interface Location {
    location_id: number;
    location: string;
}

interface BookingEditProps {
    booking: {
        id: number;
        reference_code: string | null;
        start_date: string;
        end_date: string;
        pickup_time: string | null;
        return_time: string | null;
        total_amount: number;
        status: string;
        notes: string | null;
        guest: {
            title: string | null;
            first_name: string;
            last_name: string;
            driver_age: number | null;
            phone: string | null;
            email: string;
            address: string | null;
            address2: string | null;
            country: string | null;
            state: string | null;
            city: string | null;
            postal_code: string | null;
            flight_no: string | null;
        } | null;
        car: Car;
        pickup_location: { location: string } | null;
        return_location: { location: string } | null;
        coupon_usage: { code: string; discount_amount: number } | null;
    };
    cars: Car[];
    locations: Location[];
    isGuest?: boolean;
}

function formatPrice(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

const CAR_IMAGES = [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&h=300&fit=crop',
];

const VEHICLE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Economy': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Compact': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    'Midsize SUV': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Full Size SUV': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'Regular SUV': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'SUV': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    "Regular SUV'S": { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Vans': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    'Fullsize Van': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    'Full Size Van': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    'FlatBeds': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Flatbeds': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Luxury': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

function getVehicleTypeStyle(type: string) {
    return VEHICLE_TYPE_COLORS[type] || { bg: 'bg-surface-100', text: 'text-surface-700', border: 'border-surface-200' };
}

const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

function calcRentalDays(pickupDate: string, pickupTime: string | undefined, returnDate: string, returnTime: string | undefined): number {
    if (!pickupDate || !returnDate) return 0;
    const toHHMM = (t?: string) => (t && t.length >= 5 ? t.substring(0, 5) : t || '');
    const start = new Date(`${pickupDate}T${toHHMM(pickupTime) || '00:00'}:00`);
    const end = new Date(`${returnDate}T${toHHMM(returnTime) || '23:59'}:00`);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function CalendarPicker({ pickupDate, returnDate, pickupTime, returnTime, onPickupChange, onReturnChange }: {
    pickupDate: string;
    returnDate: string;
    pickupTime?: string;
    returnTime?: string;
    onPickupChange: (d: string) => void;
    onReturnChange: (d: string) => void;
}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const initialMonth = (pickupDate ? new Date(pickupDate + 'T00:00:00') : new Date());
    const [viewMonth, setViewMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));

    const pickup = pickupDate ? new Date(pickupDate + 'T00:00:00') : null;
    const ret = returnDate ? new Date(returnDate + 'T00:00:00') : null;

    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const handleDayClick = (day: number) => {
        const clicked = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        const dateStr = toLocalDateString(clicked);
        if (!pickup || (pickup && ret)) {
            onPickupChange(dateStr);
            if (ret) onReturnChange('');
        } else {
            if (clicked > pickup) {
                onReturnChange(dateStr);
            } else {
                onPickupChange(dateStr);
            }
        }
    };

    const isStart = (day: number) => {
        if (!pickup) return false;
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        return d.getTime() === pickup.getTime();
    };

    const isEnd = (day: number) => {
        if (!ret) return false;
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        return d.getTime() === ret.getTime();
    };

    const inRange = (day: number) => {
        if (!pickup) return false;
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        if (ret) return d >= pickup && d <= ret;
        return false;
    };

    const isPast = (day: number) => {
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        d.setHours(0, 0, 0, 0);
        return d < today;
    };

    const isToday = (day: number) => {
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        return d.getTime() === today.getTime();
    };

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const padding = Array.from({ length: firstDayOfWeek }, (_, i) => i);

    return (
        <div className="bg-surface-50 rounded-2xl border border-surface-100 p-4 select-none">
            <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-surface-200/60 transition-colors text-surface-400 hover:text-surface-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span className="text-sm font-bold text-surface-900">{monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
                <button type="button" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-surface-200/60 transition-colors text-surface-400 hover:text-surface-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-surface-400 py-1.5">{d}</div>
                ))}
                {padding.map(i => <div key={`pad-${i}`} />)}
                {days.map(day => {
                    const start = isStart(day);
                    const end = isEnd(day);
                    const past = isPast(day);
                    const mid = inRange(day) && !start && !end;
                    return (
                        <button
                            key={day}
                            type="button"
                            disabled={past}
                            onClick={() => !past && handleDayClick(day)}
                            className={`relative py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                                past ? 'text-surface-300 cursor-not-allowed' :
                                start || end
                                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-200 font-bold z-10'
                                    : mid
                                    ? 'bg-brand-50 text-brand-700'
                                    : isToday(day)
                                    ? 'text-brand-600 font-bold ring-1 ring-brand-200'
                                    : 'text-surface-600 hover:bg-surface-100'
                            }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
            {(pickup || ret) && (
                <div className="mt-3 pt-3 border-t border-surface-200/60 flex items-center justify-between text-xs">
                    <span className="text-surface-500">
                        {pickup?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {ret ? ` — ${ret.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ' (select return date)'}
                    </span>
                    {pickup && ret && (
                        <span className="font-semibold text-surface-700">
                            {calcRentalDays(pickupDate, pickupTime, returnDate, returnTime)} day{calcRentalDays(pickupDate, pickupTime, returnDate, returnTime) !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function DurationBreakdownBar({ pickupDate, returnDate, pickupTime, returnTime }: {
    pickupDate: string;
    returnDate: string;
    pickupTime?: string;
    returnTime?: string;
}) {
    if (!pickupDate || !returnDate) return null;
    const start = new Date(pickupDate + 'T00:00:00');
    const end = new Date(returnDate + 'T00:00:00');
    const diffMs = end.getTime() - start.getTime();
    const calendarDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
    const billingDays = calcRentalDays(pickupDate, pickupTime, returnDate, returnTime);
    if (calendarDays < 2) return null;

    const segments = Array.from({ length: calendarDays }, (_, i) => i);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-2">
            <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Day-by-Day Itinerary</p>
            <div className="flex h-10 rounded-xl overflow-hidden shadow-sm">
                {segments.map(i => {
                    const dayDate = new Date(start);
                    dayDate.setDate(start.getDate() + i);
                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                    return (
                        <div
                            key={i}
                            className={`flex-1 flex flex-col items-center justify-center text-[10px] font-bold leading-tight ${
                                i === 0
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-l-xl'
                                    : i === calendarDays - 1
                                    ? 'bg-gradient-to-r from-brand-400 to-brand-500 text-white rounded-r-xl'
                                    : isWeekend
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-surface-100 text-surface-600'
                            } ${i > 0 ? 'border-l border-white/20' : ''}`}
                        >
                            <span>{i === 0 ? 'Pickup' : i === calendarDays - 1 ? 'Return' : dayLabels[dayDate.getDay()]}</span>
                            <span className="opacity-80">{dayDate.getDate()}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between text-[11px] text-surface-400">
                <span className="font-medium text-surface-600">{start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="font-bold text-surface-700 bg-surface-100 px-2.5 py-0.5 rounded-full">{billingDays} day{billingDays !== 1 ? 's' : ''}</span>
                <span className="font-medium text-surface-600">{end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
        </div>
    );
}

function LocationMap({ pickupLocation, returnLocation, locations, coordCache }: {
    pickupLocation: string;
    returnLocation: string;
    locations: Location[];
    coordCache: Record<string, [number, number]>;
}) {
    const pickupCoord = pickupLocation ? coordCache[pickupLocation] : null;
    const returnCoord = returnLocation && returnLocation !== pickupLocation ? coordCache[returnLocation] : null;
    const center = pickupCoord || returnCoord || [25.2048, 55.2708];
    const hasAny = !!pickupCoord || !!returnCoord;

    return (
        <div className="rounded-2xl overflow-hidden border border-surface-100 h-[200px] bg-surface-50 relative">
            {!hasAny && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <p className="text-xs text-surface-400 font-medium">Select pickup location to view map</p>
                </div>
            )}
            <MapContainer center={center} zoom={11} className="h-full w-full" scrollWheelZoom={false} zoomControl={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {pickupCoord && (
                    <Marker position={pickupCoord}>
                        <Popup>Pickup: {pickupLocation}</Popup>
                    </Marker>
                )}
                {returnCoord && (
                    <Marker position={returnCoord}>
                        <Popup>Return: {returnLocation}</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}

function getCarImage(imagePath: string | null, carId: number): string {
    if (imagePath) return `/storage/${imagePath}`;
    return CAR_IMAGES[carId % CAR_IMAGES.length];
}

const STEPS = [
    { label: 'Vehicle', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { label: 'Dates & Locations', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Driver Info', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Review & Confirm', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function BookingEdit({ booking, cars, locations, isGuest = false }: BookingEditProps) {
    const route = useRoute();
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'brand'>('default');
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [showCompare, setShowCompare] = useState(false);
    const [compareIds, setCompareIds] = useState<number[]>([]);
    const carListRef = useRef<HTMLDivElement>(null);
    const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'no-route'>('idle');
    const [coordCache, setCoordCache] = useState<Record<string, [number, number]>>({});
    const geoTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
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

    const groupedCars = useMemo(() => {
        const filtered = searchQuery
            ? cars.filter(c => `${c.brand} ${c.model}`.toLowerCase().includes(searchQuery.toLowerCase()))
            : cars;
        const sorted = [...filtered];
        if (sortBy === 'price-asc') sorted.sort((a, b) => a.daily_rate - b.daily_rate);
        else if (sortBy === 'price-desc') sorted.sort((a, b) => b.daily_rate - a.daily_rate);
        else if (sortBy === 'brand') sorted.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
        const groups: Record<string, Car[]> = {};
        for (const car of sorted) {
            const type = car.vehicle_type || 'Other';
            if (!groups[type]) groups[type] = [];
            groups[type].push(car);
        }
        return groups;
    }, [cars, searchQuery, sortBy]);

    const originalCarDailyRate = booking.car.daily_rate;

    const form = useForm({
        car_id: booking.car.id,
        pickup_date: booking.start_date,
        pickup_time: booking.pickup_time ? booking.pickup_time.substring(0, 5) : '10:00',
        pickup_location: booking.pickup_location?.location ?? '',
        return_date: booking.end_date,
        return_time: booking.return_time ? booking.return_time.substring(0, 5) : '10:00',
        return_location: booking.return_location?.location ?? '',
        title: booking.guest?.title ?? 'Mr.',
        first_name: booking.guest?.first_name ?? '',
        last_name: booking.guest?.last_name ?? '',
        driver_age: booking.guest?.driver_age?.toString() ?? '',
        phone: booking.guest?.phone ?? '',
        email: booking.guest?.email ?? '',
        email_confirmation: booking.guest?.email ?? '',
        address: booking.guest?.address ?? '',
        address2: booking.guest?.address2 ?? '',
        country: booking.guest?.country ?? '',
        state: booking.guest?.state ?? '',
        city: booking.guest?.city ?? '',
        postal_code: booking.guest?.postal_code ?? '',
        flight_no: booking.guest?.flight_no ?? '',
        coupon_code: booking.coupon_usage?.code ?? '',
        discount: booking.coupon_usage?.discount_amount ?? 0,
        tax_breakdown: [] as Array<{ id: number | null; tax_desc: string; amount: number; add_or_minus: boolean; value_in?: string; rate?: number; calculation?: string }>,
        total_tax: 0,
        total_surcharge: 0,
        notes: booking.notes ?? '',
    });

    const [oneWay, setOneWay] = useState(
        form.data.pickup_location !== form.data.return_location && form.data.return_location !== ''
    );

    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string; type: string; value: number; label: string;
    } | null>(null);

    const selectedCar = cars.find(c => c.id === Number(form.data.car_id)) ?? booking.car;
    const dailyRate = selectedCar?.daily_rate ?? 0;

    const billingDays = useMemo(() => calcRentalDays(
        form.data.pickup_date, form.data.pickup_time,
        form.data.return_date, form.data.return_time
    ), [form.data.pickup_date, form.data.pickup_time, form.data.return_date, form.data.return_time]);

    const subtotal = dailyRate * billingDays;

    function calcDiscount(coupon: { type: string; value: number } | null): number {
        if (!coupon) return 0;
        switch (coupon.type) {
            case 'percent': return subtotal * (coupon.value / 100);
            case 'fixed': return Math.min(coupon.value, subtotal);
            case 'per_day': return Math.min(coupon.value * billingDays, subtotal);
            case 'day_free': {
                const freeDays = Math.min(coupon.value, billingDays);
                return freeDays * dailyRate;
            }
            default: return 0;
        }
    }

    const discount = useMemo(() => calcDiscount(appliedCoupon), [appliedCoupon, subtotal, billingDays, dailyRate]);

    const originalDays = calcRentalDays(
        booking.start_date, booking.pickup_time ?? undefined,
        booking.end_date, booking.return_time ?? undefined
    );
    const originalSubtotal = booking.car.daily_rate * originalDays;

    const [totalTax, setTotalTax] = useState(0);
    const [totalSurcharge, setTotalSurcharge] = useState(0);
    const [taxes, setTaxes] = useState<Array<{ id: number; tax_desc: string; amount: number; add_or_minus: boolean; value_in?: string; rate?: number; calculation?: string }>>([]);
    const totalFees = totalTax + totalSurcharge;
    const estimatedTotal = subtotal + totalFees - discount;

    useEffect(() => {
        if (!selectedCar || !billingDays) return;
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(route('taxes.calculate'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({
                car_id: selectedCar.id,
                pickup_location: form.data.pickup_location || null,
                billing_days: billingDays,
                daily_rate: dailyRate,
                subtotal,
            }),
        })
            .then(r => r.json())
            .then(data => {
                setTaxes(data.taxes || []);
                setTotalTax(data.total_tax || 0);
                setTotalSurcharge(data.total_surcharge || 0);
                form.setData('tax_breakdown', data.taxes || []);
                form.setData('total_tax', data.total_tax || 0);
                form.setData('total_surcharge', data.total_surcharge || 0);
            })
            .catch(() => {
                setTaxes([]);
                setTotalTax(0);
                setTotalSurcharge(0);
            });
    }, [selectedCar?.id, billingDays, dailyRate, form.data.pickup_location]);

    useEffect(() => {
        if (!form.data.pickup_location && !form.data.return_location) return;
        if (geoTimeoutRef.current) clearTimeout(geoTimeoutRef.current);
        geoTimeoutRef.current = setTimeout(async () => {
            const cacheKey = (loc: string) => `location_${loc}`;
            for (const loc of [form.data.pickup_location, form.data.return_location]) {
                if (!loc || coordCache[loc]) continue;
                try {
                    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`, {
                        headers: { 'User-Agent': 'CarRentalApp/1.0' },
                    });
                    const data = await resp.json();
                    if (data.length > 0) {
                        setCoordCache(prev => ({ ...prev, [loc]: [parseFloat(data[0].lat), parseFloat(data[0].lon)] }));
                    }
                } catch { /* ignore geocode errors */ }
            }
        }, 600);
        return () => { if (geoTimeoutRef.current) clearTimeout(geoTimeoutRef.current); };
    }, [form.data.pickup_location, form.data.return_location]);

    useEffect(() => {
        if (!selectedCar || !form.data.pickup_date || !form.data.return_date || currentStep !== 1) {
            setAvailability('idle');
            return;
        }
        setAvailability('checking');
        let url: string;
        try { url = route('cars.check-availability'); } catch { setAvailability('no-route'); return; }
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({
                car_id: selectedCar.id,
                pickup_date: form.data.pickup_date,
                return_date: form.data.return_date,
                exclude_booking_id: booking.id,
            }),
        })
            .then(r => r.json())
            .then(data => setAvailability(data.available ? 'available' : 'unavailable'))
            .catch(() => setAvailability('no-route'));
    }, [selectedCar?.id, form.data.pickup_date, form.data.return_date, currentStep]);

    useEffect(() => {
        form.setData('discount', discount);
    }, [discount]);

    useEffect(() => {
        const code = booking.coupon_usage?.code;
        if (!code) return;
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(route('coupons.validate'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({ code, subtotal, daily_rate: dailyRate, billing_days: billingDays }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.valid) {
                    setAppliedCoupon(data.coupon);
                    form.setData('discount', calcDiscount(data.coupon));
                } else {
                    form.setData('coupon_code', '');
                    form.setData('discount', 0);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (currentStep === 0) {
            const id = setTimeout(() => {
                document.getElementById(`car-${form.data.car_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
            return () => clearTimeout(id);
        }
    }, [currentStep]);

    const handleCarKeyDown = useCallback((e: React.KeyboardEvent) => {
        const cards = carListRef.current?.querySelectorAll<HTMLButtonElement>('[data-car-nav]');
        if (!cards?.length) return;
        const current = Array.from(cards).findIndex(el => el.dataset.carNav === form.data.car_id.toString());
        let next = current;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            next = Math.min(current + 1, cards.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            next = Math.max(current - 1, 0);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            return;
        }
        if (next !== current) {
            const target = cards[next];
            target?.focus();
            form.setData('car_id', Number(target?.dataset.carNav));
            target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [form, cars]);

    const compareList = useMemo(() => {
        return compareIds.map(id => cars.find(c => c.id === id)).filter(Boolean) as Car[];
    }, [compareIds, cars]);

    function toggleCompare(carId: number) {
        setCompareIds(prev =>
            prev.includes(carId) ? prev.filter(id => id !== carId) : [...prev, carId]
        );
    }

    function applyCoupon() {
        const code = form.data.coupon_code.trim().toUpperCase();
        if (!code) return;
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(route('coupons.validate'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({ code, subtotal, daily_rate: dailyRate, billing_days: billingDays }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.valid) {
                    setAppliedCoupon(data.coupon);
                    form.setData('coupon_code', code);
                    form.setData('discount', calcDiscount(data.coupon));
                } else {
                    setAppliedCoupon(null);
                    form.setData('coupon_code', '');
                    form.setData('discount', 0);
                }
            })
            .catch(() => {
                setAppliedCoupon(null);
            });
    }

    function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();

        const driverDetails = {
            title: form.data.title,
            first_name: form.data.first_name,
            last_name: form.data.last_name,
            driver_age: form.data.driver_age,
            phone: form.data.phone,
            flight_no: form.data.flight_no,
            email: form.data.email,
            address: form.data.address,
            address2: form.data.address2,
            country: form.data.country,
            state: form.data.state,
            city: form.data.city,
            postal_code: form.data.postal_code,
        };
        localStorage.setItem('savedDriverDetails', JSON.stringify(driverDetails));

        if (isGuest && booking.reference_code) {
            form.patch(route('bookings.guest.modify', booking.reference_code));
        } else {
            form.patch(route('bookings.modify', booking.id));
        }
    }

    function goNext() {
        if (currentStep < STEPS.length - 1) {
            setDirection(1);
            setCurrentStep(s => s + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function goBack() {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(s => s - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    const hasPriceChanged = estimatedTotal !== booking.total_amount;
    const priceDiff = estimatedTotal - booking.total_amount;

    const Layout = isGuest ? GuestLayout : AuthenticatedLayout;

    return (
        <>
            <Head title={`Modify Booking ${booking.reference_code ?? `#${booking.id}`}`} />
            <Layout
                {...(isGuest ? {} : {
                    header: (
                        <h2 className="text-2xl font-bold text-surface-900">
                            Modify Booking {booking.reference_code ?? `#${booking.id}`}
                        </h2>
                    ),
                })}
            >
                <div className="py-8 sm:py-12">
                    <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${currentStep === 0 ? 'max-w-7xl' : 'max-w-4xl'}`}>
                        <div className="mb-6">
                            <Link
                                href={route(isGuest ? 'bookings.guest.show' : 'bookings.show', isGuest ? booking.reference_code! : booking.id)}
                                className="inline-flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-brand-600 transition-all duration-200 group"
                            >
                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Booking
                            </Link>
                        </div>

                        {/* Step Indicator */}
                        <div className="mb-10">
                            <div className="flex items-start justify-center max-w-lg mx-auto">
                                {STEPS.map((step, i) => {
                                    const isCompleted = i < currentStep;
                                    const isActive = i === currentStep;
                                    const isLast = i === STEPS.length - 1;

                                    return (
                                        <div key={i} className="flex items-center min-w-0">
                                            <div className="flex flex-col items-center">
                                                <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                                                    isCompleted
                                                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-200'
                                                        : isActive
                                                        ? 'bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-200'
                                                        : 'bg-surface-100 border-2 border-surface-200'
                                                }`}>
                                                    {isCompleted ? (
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-surface-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step.icon} />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className={`mt-2 text-[11px] font-bold text-center leading-tight transition-colors duration-300 max-w-[80px] ${
                                                    isActive
                                                        ? 'text-brand-700'
                                                        : isCompleted
                                                        ? 'text-emerald-600'
                                                        : 'text-surface-400'
                                                }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                            {!isLast && (
                                                <div className={`w-8 sm:w-12 h-[2px] mt-[-24px] rounded-full transition-all duration-500 ${
                                                    isCompleted && i + 1 <= currentStep
                                                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                        : 'bg-surface-200'
                                                }`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="relative">
                            {/* Step 1: Vehicle */}
                            <div key={`step-${currentStep}-${direction}`} className="animate-fade-in-up">
                                {currentStep === 0 && (
                                    <div className="card p-4 sm:p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold shadow-md shadow-brand-200">1</span>
                                            <div>
                                                <h3 className="text-lg font-bold text-surface-900">Choose a Vehicle</h3>
                                                <p className="text-sm text-surface-400">Select the car for this booking</p>
                                            </div>
                                        </div>

                                        {/* Search + Sort */}
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="relative flex-1">
                                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <input type="text" value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    placeholder="Search by brand or model..."
                                                    className="input-field pl-11" />
                                                {searchQuery && (
                                                    <button type="button" onClick={() => setSearchQuery('')}
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-surface-400 hover:text-surface-600 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {([
                                                    { key: 'default', label: 'Default' },
                                                    { key: 'price-asc', label: 'Price ↑' },
                                                    { key: 'price-desc', label: 'Price ↓' },
                                                    { key: 'brand', label: 'A–Z' },
                                                ] as const).map(opt => (
                                                    <button key={opt.key} type="button" onClick={() => setSortBy(opt.key)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                                                            sortBy === opt.key
                                                                ? 'bg-brand-500 text-white shadow-sm shadow-brand-200'
                                                                : 'bg-surface-50 text-surface-400 hover:bg-surface-100 hover:text-surface-600'
                                                        }`}>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Grouped Cars */}
                                        {Object.entries(groupedCars).map(([type, typeCars]) => {
                                            const style = getVehicleTypeStyle(type);
                                            return (
                                                <div key={type} className="mb-5 last:mb-0">
                                                    <div className="flex items-center gap-2.5 mb-3">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${style.bg} ${style.text} border ${style.border}`}>
                                                            {type}
                                                        </span>
                                                        <span className="text-[11px] text-surface-400 font-medium">{typeCars.length} vehicle{typeCars.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" ref={carListRef} onKeyDown={handleCarKeyDown} role="listbox" tabIndex={-1}>
                                                        {typeCars.map(car => {
                                                            const isSelected = Number(form.data.car_id) === car.id;
                                                            const rateDiff = car.daily_rate - originalCarDailyRate;
                                                            const isOriginal = car.id === booking.car.id;
                                                            const totalCost = billingDays > 0 ? car.daily_rate * billingDays : 0;
                                                            const inCompare = compareIds.includes(car.id);
                                                            return (
                                                                <button
                                                                    key={car.id}
                                                                    id={`car-${car.id}`}
                                                                    type="button"
                                                                    data-car-nav={car.id}
                                                                    role="option"
                                                                    aria-selected={isSelected}
                                                                    onClick={() => form.setData('car_id', car.id)}
                                                                    className={`w-full flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-200 text-left group ${
                                                                        isSelected
                                                                            ? 'border-brand-500 bg-brand-50/80 shadow-sm shadow-brand-200/20 ring-1 ring-brand-500/20'
                                                                            : 'border-surface-100 bg-white hover:border-surface-200 hover:shadow-md hover:-translate-y-0.5'
                                                                    }`}
                                                                >
                                                                    {/* Image (16:9, clickable for preview) */}
                                                                    <div className="relative w-full aspect-video overflow-hidden bg-surface-100 cursor-pointer"
                                                                        onClick={e => { e.stopPropagation(); setPreviewImg(getCarImage(car.image_path, car.id)); }}>
                                                                        <img
                                                                            src={getCarImage(car.image_path, car.id)}
                                                                            alt={`${car.brand} ${car.model}`}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-surface-700 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md backdrop-blur">
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                                </svg>
                                                                                Quick View
                                                                            </span>
                                                                        </div>
                                                                        {isOriginal && (
                                                                            <span className="absolute top-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                                                                                Current
                                                                            </span>
                                                                        )}
                                                                        {/* Compare toggle */}
                                                                        <div role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggleCompare(car.id); }}
                                                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); toggleCompare(car.id); } }}
                                                                            className={`absolute top-2.5 right-2.5 flex items-center justify-center w-7 h-7 rounded-lg border-2 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 cursor-pointer ${
                                                                                inCompare
                                                                                    ? 'border-brand-500 bg-brand-500 text-white'
                                                                                    : 'border-white/60 text-surface-500 hover:border-brand-300 hover:text-brand-600'
                                                                            }`}
                                                                            title={inCompare ? 'Remove from compare' : 'Add to compare'}
                                                                            aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}>
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                            </svg>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <div className="absolute bottom-2.5 right-2.5 flex items-center justify-center w-7 h-7 rounded-full bg-brand-500 shadow-md">
                                                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Body */}
                                                                    <div className="flex-1 min-w-0 p-3.5">
                                                                        <p className="text-[15px] font-bold text-surface-900 truncate">
                                                                            {car.brand} {car.model}
                                                                            <span className="font-normal text-surface-400 ml-1">({car.year})</span>
                                                                        </p>
                                                                        <div className="flex items-center gap-2.5 mt-1.5">
                                                                            {car.seats && (
                                                                                <span className="flex items-center gap-1 text-[11px] text-surface-400">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    </svg>
                                                                                    {car.seats}
                                                                                </span>
                                                                            )}
                                                                            {car.transmission && (
                                                                                <span className="flex items-center gap-1 text-[11px] text-surface-400">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    </svg>
                                                                                    {car.transmission}
                                                                                </span>
                                                                            )}
                                                                            {car.fuel_type && (
                                                                                <span className="flex items-center gap-1 text-[11px] text-surface-400">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                                    </svg>
                                                                                    {car.fuel_type}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Price footer */}
                                                                    <div className="px-3.5 pb-3.5">
                                                                        <div className="pt-3 border-t border-surface-100/80">
                                                                            <div className="flex items-baseline justify-between gap-2">
                                                                                <div className="flex items-baseline gap-1 min-w-0">
                                                                                    <span className={`text-lg font-extrabold ${isSelected ? 'text-brand-700' : 'text-surface-900'}`}>{formatPrice(car.daily_rate)}</span>
                                                                                    <span className="text-[10px] text-surface-400 font-medium whitespace-nowrap">per day</span>
                                                                                </div>
                                                                                {billingDays > 0 && (
                                                                                    <div className="flex items-baseline gap-1 shrink-0">
                                                                                        <span className={`text-sm font-bold ${isSelected ? 'text-brand-600' : 'text-surface-600'}`}>{formatPrice(totalCost)}</span>
                                                                                        <span className="text-[9px] text-surface-400 whitespace-nowrap">total</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {(rateDiff !== 0 || billingDays >= 7) && (
                                                                                <div className="flex items-center justify-between gap-2 mt-1.5">
                                                                                    {rateDiff !== 0 ? (
                                                                                        <span className={`text-[10px] font-semibold ${rateDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                                            {rateDiff > 0 ? '+' : ''}{formatPrice(rateDiff)} vs current
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span />
                                                                                    )}
                                                                                    {billingDays >= 7 && (
                                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-accent-50 text-accent-700 border border-accent-200 whitespace-nowrap">
                                                                                            {billingDays >= 30 ? 'Monthly' : 'Weekly'} discount
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {Object.keys(groupedCars).length === 0 && (
                                            <div className="text-center py-12">
                                                <svg className="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <p className="text-sm text-surface-400 font-medium">No vehicles match "{searchQuery}"</p>
                                            </div>
                                        )}

                                        {/* Compare floating bar */}
                                        {compareIds.length >= 2 && (
                                            <div className="sticky bottom-0 mt-5 -mx-2 px-2 pb-2">
                                                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-surface-200 shadow-lg backdrop-blur-xl">
                                                    <span className="text-xs font-medium text-surface-600">
                                                        <span className="font-bold text-surface-900">{compareIds.length}</span> vehicles selected
                                                    </span>
                                                    <button type="button" onClick={() => setCompareIds([])}
                                                        className="px-2 py-1 text-[11px] font-medium text-surface-400 hover:text-surface-600 transition-colors mr-2">
                                                        Clear
                                                    </button>
                                                    <button type="button" onClick={() => setShowCompare(true)}
                                                        className="btn-primary !px-4 !py-2 !rounded-xl text-xs">
                                                        Compare
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Dates & Locations */}
                                {currentStep === 1 && (
                                    <div className="space-y-5">
                                        <div className="card px-7 sm:px-8 py-5 sm:py-7">
                                            {/* Header with live price */}
                                            <div className="flex items-start gap-3 mb-6">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold shadow-md shadow-brand-200 shrink-0 mt-0.5">2</span>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-surface-900">Rental Period</h3>
                                                    <p className="text-sm text-surface-400">Set the pickup and return dates, times, and locations</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    {billingDays > 0 && dailyRate > 0 && (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200/50">
                                                            <span className="text-xs font-bold text-brand-700">{formatPrice(subtotal)}</span>
                                                            <span className="text-[10px] text-brand-500 font-medium">{billingDays}d × {formatPrice(dailyRate)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-medium text-surface-400">Round Trip</span>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={oneWay}
                                                            onClick={() => {
                                                                setOneWay(!oneWay);
                                                                if (!oneWay) {
                                                                    form.setData('return_location', form.data.pickup_location);
                                                                }
                                                            }}
                                                            className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                                                oneWay ? 'bg-brand-500' : 'bg-surface-200'
                                                            }`}
                                                        >
                                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                                                                oneWay ? 'translate-x-4' : 'translate-x-0'
                                                            }`} />
                                                        </button>
                                                        <span className="text-[11px] font-medium text-surface-600">One Way</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Select */}
                                            <div className="mb-5">
                                                <p className="text-[11px] font-bold text-surface-500 mb-2.5 uppercase tracking-wider">Quick Select</p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {[
                                                        { label: '3 Days', days: 3 },
                                                        { label: '5 Days', days: 5 },
                                                        { label: '1 Week', days: 7 },
                                                        { label: '2 Weeks', days: 14 },
                                                        { label: '1 Month', days: 30 },
                                                    ].map(preset => {
                                                        const isActive = billingDays === preset.days;
                                                        return (
                                                            <button
                                                                key={preset.label}
                                                                type="button"
                                                                onClick={() => {
                                                                    const base = form.data.pickup_date ? new Date(form.data.pickup_date + 'T00:00:00') : new Date();
                                                                    const end = new Date(base);
                                                                    end.setDate(end.getDate() + preset.days);
                                                                    if (!form.data.pickup_date) {
                                                                        form.setData('pickup_date', toLocalDateString(base));
                                                                    }
                                                                    form.setData('return_date', toLocalDateString(end));
                                                                }}
                                                                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                                                                    isActive
                                                                        ? 'bg-brand-500 text-white shadow-sm shadow-brand-200'
                                                                        : 'bg-surface-50 text-surface-500 border border-surface-200 hover:border-brand-200 hover:text-brand-600 hover:bg-brand-50/50'
                                                                }`}
                                                            >
                                                                {preset.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* LEFT COLUMN — Calendar */}
                                                <div className="lg:col-span-1 space-y-4">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-surface-500 mb-2 uppercase tracking-wider">Select Dates</p>
                                                        <CalendarPicker
                                                            pickupDate={form.data.pickup_date}
                                                            returnDate={form.data.return_date}
                                                            pickupTime={form.data.pickup_time}
                                                            returnTime={form.data.return_time}
                                                            onPickupChange={d => form.setData('pickup_date', d)}
                                                            onReturnChange={d => form.setData('return_date', d)}
                                                        />
                                                    </div>

                                                    {/* Selected Vehicle Card */}
                                                    {(() => {
                                                        const typeStyle = getVehicleTypeStyle(selectedCar.vehicle_type || '');
                                                        const isOriginal = selectedCar.id === booking.car.id;
                                                        return (
                                                            <div className="rounded-2xl border border-surface-100/80 bg-white overflow-hidden shadow-sm">
                                                                <div className="aspect-[16/7] bg-surface-100 overflow-hidden relative">
                                                                    <img
                                                                        src={getCarImage(selectedCar.image_path, selectedCar.id)}
                                                                        alt={`${selectedCar.brand} ${selectedCar.model}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                                                    <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                                                                        {selectedCar.vehicle_type && (
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border}`}>
                                                                                {selectedCar.vehicle_type}
                                                                            </span>
                                                                        )}
                                                                        {isOriginal && (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/90 text-amber-900 backdrop-blur-sm border border-amber-300/50">
                                                                                Current Vehicle
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="p-4">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <p className="text-base font-bold text-surface-900 truncate">
                                                                                {selectedCar.brand} {selectedCar.model}
                                                                            </p>
                                                                            <p className="text-xs text-surface-400">{selectedCar.year} · {selectedCar.license_plate}</p>
                                                                        </div>
                                                                        <div className="text-right shrink-0">
                                                                            <p className="text-lg font-bold text-brand-700">{formatPrice(selectedCar.daily_rate)}</p>
                                                                            <p className="text-[10px] text-surface-400 font-medium">per day</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-100">
                                                                        {selectedCar.seats && (
                                                                            <span className="flex items-center gap-1.5 text-xs text-surface-500">
                                                                                <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                </svg>
                                                                                {selectedCar.seats} seats
                                                                            </span>
                                                                        )}
                                                                        {selectedCar.transmission && (
                                                                            <span className="flex items-center gap-1.5 text-xs text-surface-500">
                                                                                <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                                </svg>
                                                                                {selectedCar.transmission}
                                                                            </span>
                                                                        )}
                                                                        {selectedCar.fuel_type && (
                                                                            <span className="flex items-center gap-1.5 text-xs text-surface-500">
                                                                                <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                                </svg>
                                                                                {selectedCar.fuel_type}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* RIGHT COLUMN — Timeline: Pickup → Return */}
                                                <div className="lg:col-span-1">
                                                    <p className="text-[11px] font-bold text-surface-500 mb-2 uppercase tracking-wider">Pickup &amp; Return</p>
                                                    <div className="relative pl-7">
                                                        {/* Vertical connecting line */}
                                                        <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-300 via-surface-200 to-red-300 rounded-full" />

                                                        {/* Pickup Node */}
                                                        <div className="relative mb-2">
                                                            <div className="absolute -left-7 top-1 w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            </div>
                                                            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border border-emerald-100/80">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    <p className="text-sm font-bold text-emerald-700">Pickup</p>
                                                                </div>
                                                                <div className="space-y-2.5">
                                                                    <div>
                                                                        <label className="label-text">Location</label>
                                                                        <select value={form.data.pickup_location}
                                                                            onChange={e => {
                                                                                form.setData('pickup_location', e.target.value);
                                                                                if (!oneWay) {
                                                                                    form.setData('return_location', e.target.value);
                                                                                }
                                                                            }}
                                                                            className="input-field">
                                                                            <option value="">Select pickup location</option>
                                                                            {locations.map(loc => (
                                                                                <option key={loc.location_id} value={loc.location}>{loc.location}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1">
                                                                            <label className="label-text">Time</label>
                                                                            <input type="time" value={form.data.pickup_time}
                                                                                onChange={e => form.setData('pickup_time', e.target.value)}
                                                                                className="input-field" />
                                                                        </div>
                                                                        <div className="flex items-center gap-1 flex-wrap pt-5">
                                                                            {[
                                                                                { label: 'AM', time: '08:00' },
                                                                                { label: 'Mid', time: '12:00' },
                                                                                { label: 'PM', time: '15:00' },
                                                                                { label: 'Eve', time: '18:00' },
                                                                            ].map(p => {
                                                                                const isActive = form.data.pickup_time === p.time;
                                                                                return (
                                                                                    <button
                                                                                        key={p.label}
                                                                                        type="button"
                                                                                        onClick={() => form.setData('pickup_time', p.time)}
                                                                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                                                                                            isActive
                                                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                                                : 'bg-surface-100/50 text-surface-400 border border-surface-200 hover:border-emerald-200 hover:text-emerald-600'
                                                                                        }`}
                                                                                    >
                                                                                        {p.label}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Return Node */}
                                                        <div className="relative">
                                                            <div className="absolute -left-7 top-1 w-5 h-5 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center">
                                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                            </div>
                                                            <div className={`rounded-2xl p-4 border transition-colors ${
                                                                !oneWay
                                                                    ? 'bg-gradient-to-br from-surface-50 to-white border-surface-200/80'
                                                                    : 'bg-gradient-to-br from-red-50 to-white border-red-100/80'
                                                            }`}>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                        <p className={`text-sm font-bold ${!oneWay ? 'text-surface-500' : 'text-red-700'}`}>Return</p>
                                                                    </div>
                                                                    {!oneWay && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-100/80 text-surface-500 text-[10px] font-bold">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                            </svg>
                                                                            Same as pickup
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-2.5">
                                                                    <div>
                                                                        <label className="label-text">Location</label>
                                                                        <select value={form.data.return_location}
                                                                            onChange={e => form.setData('return_location', e.target.value)}
                                                                            className={`input-field ${!oneWay ? 'opacity-60 pointer-events-none' : ''}`}
                                                                            disabled={!oneWay}>
                                                                            {!oneWay ? (
                                                                                <option value={form.data.pickup_location}>{form.data.pickup_location || 'Same as pickup'}</option>
                                                                            ) : (
                                                                                <>
                                                                                    <option value="">Select return location</option>
                                                                                    {locations.map(loc => (
                                                                                        <option key={loc.location_id} value={loc.location}>{loc.location}</option>
                                                                                    ))}
                                                                                </>
                                                                            )}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1">
                                                                            <label className="label-text">Time</label>
                                                                            <input type="time" value={form.data.return_time}
                                                                                onChange={e => form.setData('return_time', e.target.value)}
                                                                                className="input-field" />
                                                                        </div>
                                                                        <div className="flex items-center gap-1 flex-wrap pt-5">
                                                                            {[
                                                                                { label: 'AM', time: '08:00' },
                                                                                { label: 'Mid', time: '12:00' },
                                                                                { label: 'PM', time: '15:00' },
                                                                                { label: 'Eve', time: '18:00' },
                                                                            ].map(p => {
                                                                                const isActive = form.data.return_time === p.time;
                                                                                return (
                                                                                    <button
                                                                                        key={p.label}
                                                                                        type="button"
                                                                                        onClick={() => form.setData('return_time', p.time)}
                                                                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                                                                                            isActive
                                                                                                ? 'bg-red-100 text-red-700 border border-red-200'
                                                                                                : 'bg-surface-100/50 text-surface-400 border border-surface-200 hover:border-red-200 hover:text-red-600'
                                                                                        }`}
                                                                                    >
                                                                                        {p.label}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {oneWay && form.data.return_location !== form.data.pickup_location && (
                                                            <button
                                                                type="button"
                                                                onClick={() => form.setData('return_location', form.data.pickup_location)}
                                                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                                Return to pickup location instead
                                                            </button>
                                                        )}

                                                        {/* Availability */}
                                                        {form.data.pickup_date && form.data.return_date && (
                                                            <div className={`mt-4 px-4 py-3 rounded-2xl border text-sm transition-all duration-300 ${
                                                                availability === 'checking'
                                                                    ? 'bg-surface-50 border-surface-200 text-surface-500'
                                                                    : availability === 'available'
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                    : availability === 'unavailable'
                                                                    ? 'bg-red-50 border-red-200 text-red-700'
                                                                    : availability === 'no-route'
                                                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                                    : 'bg-surface-50 border-surface-100 text-surface-400'
                                                            }`}>
                                                                <div className="flex items-center gap-2.5">
                                                                    {availability === 'checking' && (
                                                                        <>
                                                                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                            </svg>
                                                                            <span className="font-medium">Checking availability...</span>
                                                                        </>
                                                                    )}
                                                                    {availability === 'available' && (
                                                                        <>
                                                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                            <span className="font-medium">Vehicle is available for these dates</span>
                                                                        </>
                                                                    )}
                                                                    {availability === 'unavailable' && (
                                                                        <>
                                                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                            </svg>
                                                                            <span className="font-medium">Vehicle is not available — try different dates</span>
                                                                        </>
                                                                    )}
                                                                    {availability === 'no-route' && (
                                                                        <>
                                                                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            <span className="font-medium">Could not verify availability — you can still proceed</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rental Snapshot */}
                                            {(form.data.pickup_date || form.data.pickup_location) && (
                                                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-brand-50/60 via-white to-surface-50/60 border border-surface-200/70">
                                                    <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wider mb-3">Rental Snapshot</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                        <div className="flex items-start gap-2.5">
                                                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 shrink-0 mt-0.5">
                                                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] text-surface-400 font-medium">Pickup</p>
                                                                <p className="text-xs font-bold text-surface-700 truncate">
                                                                    {form.data.pickup_date
                                                                        ? new Date(form.data.pickup_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                                        : '—'}
                                                                </p>
                                                                <p className="text-[10px] text-surface-500">{form.data.pickup_time ? (() => { const [h,m]=form.data.pickup_time.split(':'); const a=+h>=12?'PM':'AM'; return `${(+h%12||12)}:${m} ${a}`; })() : '—'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2.5">
                                                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-100 shrink-0 mt-0.5">
                                                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] text-surface-400 font-medium">Return</p>
                                                                <p className="text-xs font-bold text-surface-700 truncate">
                                                                    {form.data.return_date
                                                                        ? new Date(form.data.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                                        : '—'}
                                                                </p>
                                                                <p className="text-[10px] text-surface-500">{form.data.return_time ? (() => { const [h,m]=form.data.return_time.split(':'); const a=+h>=12?'PM':'AM'; return `${(+h%12||12)}:${m} ${a}`; })() : '—'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2.5">
                                                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-100 shrink-0 mt-0.5">
                                                                <svg className="w-3.5 h-3.5 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] text-surface-400 font-medium">Location{oneWay && form.data.return_location !== form.data.pickup_location ? 's' : ''}</p>
                                                                <p className="text-xs font-bold text-surface-700 truncate">{form.data.pickup_location || '—'}</p>
                                                                {oneWay && form.data.return_location !== form.data.pickup_location && (
                                                                    <p className="text-[10px] text-surface-500 truncate">→ {form.data.return_location}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2.5">
                                                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-100 shrink-0 mt-0.5">
                                                                <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                                                                </svg>
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] text-surface-400 font-medium">Total</p>
                                                                <p className="text-sm font-bold text-brand-700">{billingDays > 0 ? formatPrice(subtotal) : '—'}</p>
                                                                {dailyRate > 0 && billingDays > 0 && (
                                                                    <p className="text-[10px] text-surface-500">{billingDays} day{billingDays !== 1 ? 's' : ''} × {formatPrice(dailyRate)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Duration Breakdown — full width */}
                                            {billingDays > 1 && (
                                                <div className="mt-5 animate-fade-in">
                                                <DurationBreakdownBar
                                                            pickupDate={form.data.pickup_date}
                                                            returnDate={form.data.return_date}
                                                            pickupTime={form.data.pickup_time}
                                                            returnTime={form.data.return_time}
                                                        />
                                                </div>
                                            )}
                                        </div>

                                        {/* Location Map */}
                                        {form.data.pickup_location && (
                                            <div className="card p-4 sm:p-5">
                                                <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wider mb-3">Location Map</p>
                                                <LocationMap
                                                    pickupLocation={form.data.pickup_location}
                                                    returnLocation={form.data.return_location}
                                                    locations={locations}
                                                    coordCache={coordCache}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Driver Info */}
                                {currentStep === 2 && (
                                    <div className="card p-6 sm:p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold shadow-md shadow-brand-200">3</span>
                                            <div>
                                                <h3 className="text-lg font-bold text-surface-900">Driver Information</h3>
                                                <p className="text-sm text-surface-400">Primary driver & contact information</p>
                                            </div>
                                        </div>

                                        {showSavedPrompt && (
                                            <div className="mb-6 rounded-2xl border border-accent-200 bg-accent-50 p-4">
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
                                                                            form.setData(key as any, parsed[key]);
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

                                        {(() => {
                                            const emailMismatch = form.data.email && form.data.email_confirmation && form.data.email !== form.data.email_confirmation;
                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-6 gap-5">
                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">Title</label>
                                                        <select value={form.data.title}
                                                            onChange={e => form.setData('title', e.target.value)}
                                                            className="input-field">
                                                            {['Mr.', 'Mrs.', 'Ms.', 'Mx.', 'Dr.', 'Prof.'].map(t => (
                                                                <option key={t} value={t}>{t}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">First Name</label>
                                                        <input type="text" value={form.data.first_name}
                                                            onChange={e => form.setData('first_name', e.target.value)}
                                                            className="input-field" placeholder="Juan" />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">Last Name</label>
                                                        <input type="text" value={form.data.last_name}
                                                            onChange={e => form.setData('last_name', e.target.value)}
                                                            className="input-field" placeholder="Remengesau" />
                                                    </div>

                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">Driver's Age</label>
                                                        <input type="number" min={18} value={form.data.driver_age}
                                                            onChange={e => form.setData('driver_age', e.target.value)}
                                                            className="input-field" placeholder="30" />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">Phone No.</label>
                                                        <input type="tel" value={form.data.phone}
                                                            onChange={e => form.setData('phone', e.target.value)}
                                                            className="input-field" placeholder="+680 ..." />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">Flight No. (optional)</label>
                                                        <input type="text" value={form.data.flight_no}
                                                            onChange={e => form.setData('flight_no', e.target.value)}
                                                            className="input-field" placeholder="e.g. UA 201" />
                                                    </div>

                                                    <div className="sm:col-span-3">
                                                        <label className="label-text">Email</label>
                                                        <input type="email" value={form.data.email}
                                                            onChange={e => form.setData('email', e.target.value)}
                                                            className="input-field" placeholder="you@example.com" />
                                                    </div>
                                                    <div className="sm:col-span-3">
                                                        <label className="label-text">Re-confirm Email</label>
                                                        <input type="email" value={form.data.email_confirmation}
                                                            onChange={e => form.setData('email_confirmation', e.target.value)}
                                                            className="input-field" placeholder="you@example.com" />
                                                        {emailMismatch && (
                                                            <p className="mt-1 text-xs text-red-500 font-medium">Emails do not match.</p>
                                                        )}
                                                    </div>

                                                    <div className="sm:col-span-6">
                                                        <label className="label-text">Address</label>
                                                        <input type="text" value={form.data.address}
                                                            onChange={e => form.setData('address', e.target.value)}
                                                            className="input-field" placeholder="Street address" />
                                                    </div>

                                                    <div className="sm:col-span-6">
                                                        <label className="label-text">Address 2 (optional)</label>
                                                        <input type="text" value={form.data.address2}
                                                            onChange={e => form.setData('address2', e.target.value)}
                                                            className="input-field" placeholder="Apartment, suite, etc." />
                                                    </div>

                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">Country</label>
                                                        <select value={form.data.country}
                                                            onChange={e => form.setData('country', e.target.value)}
                                                            className="input-field">
                                                            <option value="">Select country</option>
                                                            {countries.map(c => (
                                                                <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">State / Province</label>
                                                        <input type="text" value={form.data.state}
                                                            onChange={e => form.setData('state', e.target.value)}
                                                            className="input-field" placeholder="State" />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">City</label>
                                                        <input type="text" value={form.data.city}
                                                            onChange={e => form.setData('city', e.target.value)}
                                                            className="input-field" placeholder="Koror" />
                                                    </div>

                                                    <div className="sm:col-span-2">
                                                        <label className="label-text">Postal / Zip Code</label>
                                                        <input type="text" value={form.data.postal_code}
                                                            onChange={e => form.setData('postal_code', e.target.value)}
                                                            className="input-field" placeholder="96940" />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Step 4: Review & Confirm */}
                                {currentStep === 3 && (
                                    <div className="space-y-5">

                                        {/* Section Header */}
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-bold shadow-md shadow-brand-200">4</span>
                                            <div>
                                                <h3 className="text-lg font-bold text-surface-900">Review & Confirm</h3>
                                                <p className="text-sm text-surface-400">Verify all details before saving changes</p>
                                            </div>
                                        </div>

                                        {/* Vehicle Change Comparison */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            {/* Current */}
                                            <div className="relative overflow-hidden rounded-2xl bg-white border border-surface-100 shadow-sm p-4 sm:p-5 group hover:shadow-md transition-shadow duration-300">
                                                <div className="absolute inset-0 bg-gradient-to-br from-surface-50/80 to-transparent pointer-events-none" />
                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-200/50 text-surface-500 text-[10px] font-bold uppercase tracking-widest">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            Current
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-14 h-14 rounded-xl bg-surface-100 overflow-hidden shrink-0 shadow-inner">
                                                            <img src={getCarImage(booking.car.image_path, booking.car.id)} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-surface-900 truncate">{booking.car.brand} {booking.car.model}</p>
                                                            <p className="text-[11px] text-surface-400">{booking.car.license_plate}</p>
                                                            <p className="text-xs text-surface-500 mt-1">
                                                                {new Date(booking.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(booking.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between">
                                                        <span className="text-[11px] text-surface-400 font-medium">Total paid</span>
                                                        <span className="text-base font-bold text-surface-700">{formatPrice(booking.total_amount)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* New */}
                                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 shadow-lg shadow-brand-200/40 p-4 sm:p-5 group hover:shadow-xl hover:shadow-brand-200/50 transition-shadow duration-300">
                                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                                                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white/90 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                                            New
                                                        </span>
                                                        {hasPriceChanged && (
                                                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                                                                priceDiff > 0
                                                                    ? 'bg-red-400/20 text-red-200 border border-red-400/20'
                                                                    : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/20'
                                                            }`}>
                                                                {priceDiff > 0 ? '+' : ''}{formatPrice(priceDiff)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 ring-2 ring-white/20 shadow-lg">
                                                            <img src={getCarImage(selectedCar.image_path, selectedCar.id)} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-white truncate">{selectedCar.brand} {selectedCar.model}</p>
                                                            <p className="text-[11px] text-brand-200">{selectedCar.license_plate}</p>
                                                            <p className="text-xs text-brand-200 mt-1">
                                                                {form.data.pickup_date ? new Date(form.data.pickup_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} — {form.data.return_date ? new Date(form.data.return_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between">
                                                        <span className="text-[11px] text-brand-200 font-medium">New total</span>
                                                        <span className="text-lg font-bold text-white">{formatPrice(estimatedTotal)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Booking Details + Driver Info row */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                            {/* Booking Details Card */}
                                            <div className="card p-5">
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 text-brand-600">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </span>
                                                    <h4 className="text-sm font-bold text-surface-900">Rental Period</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-emerald-700">Pickup</p>
                                                            <p className="text-sm font-semibold text-surface-900">
                                                                {form.data.pickup_date ? new Date(form.data.pickup_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </p>
                                                            <p className="text-xs text-surface-500">{form.data.pickup_time ? (() => { const [h,m]=form.data.pickup_time.split(':'); const a=+h>=12?'PM':'AM'; return `${(+h%12||12)}:${m} ${a}`; })() : '—'} {form.data.pickup_location ? `· ${form.data.pickup_location}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center shrink-0 mt-0.5">
                                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-red-600">Return</p>
                                                            <p className="text-sm font-semibold text-surface-900">
                                                                {form.data.return_date ? new Date(form.data.return_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </p>
                                                            <p className="text-xs text-surface-500">{form.data.return_time ? (() => { const [h,m]=form.data.return_time.split(':'); const a=+h>=12?'PM':'AM'; return `${(+h%12||12)}:${m} ${a}`; })() : '—'} {form.data.return_location !== form.data.pickup_location && form.data.return_location ? `· ${form.data.return_location}` : form.data.pickup_location && !oneWay ? '· Same as pickup' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-surface-100 flex items-center justify-between text-xs">
                                                        <span className="text-surface-400 font-medium">Duration</span>
                                                        <span className="font-bold text-surface-700 bg-surface-100 px-2.5 py-0.5 rounded-full">{billingDays} day{billingDays !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Driver Info Summary */}
                                            <div className="card p-5">
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 text-brand-600">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    </span>
                                                    <h4 className="text-sm font-bold text-surface-900">Driver</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold shrink-0">
                                                            {form.data.first_name?.[0]}{form.data.last_name?.[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-surface-900 truncate">{form.data.title} {form.data.first_name} {form.data.last_name}</p>
                                                            <p className="text-[11px] text-surface-400">{form.data.email} {form.data.phone ? `· ${form.data.phone}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 border-t border-surface-100 text-xs">
                                                        {form.data.driver_age && (
                                                            <div><span className="text-surface-400">Age:</span> <span className="font-medium text-surface-700">{form.data.driver_age}</span></div>
                                                        )}
                                                        {form.data.flight_no && (
                                                            <div><span className="text-surface-400">Flight:</span> <span className="font-medium text-surface-700">{form.data.flight_no}</span></div>
                                                        )}
                                                        {form.data.address && (
                                                            <div className="col-span-2"><span className="text-surface-400">Address:</span> <span className="font-medium text-surface-700">{form.data.address}{form.data.address2 ? `, ${form.data.address2}` : ''}</span></div>
                                                        )}
                                                        {form.data.city && (
                                                            <div className="col-span-2"><span className="text-surface-400">City:</span> <span className="font-medium text-surface-700">{form.data.city}{form.data.state ? `, ${form.data.state}` : ''}{form.data.postal_code ? ` ${form.data.postal_code}` : ''}</span></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pricing */}
                                        <div className="card p-5 sm:p-6">
                                            <div className="flex items-center gap-2.5 mb-5">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 text-brand-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                                                </span>
                                                <h4 className="text-sm font-bold text-surface-900">Price Breakdown</h4>
                                            </div>

                                            {/* Coupon */}
                                            <div className="mb-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
                                                        <input type="text" value={form.data.coupon_code}
                                                            onChange={e => form.setData('coupon_code', e.target.value.toUpperCase())}
                                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                                                            placeholder="Coupon code"
                                                            className="input-field pl-10 uppercase tracking-wider" />
                                                    </div>
                                                    <button type="button" onClick={applyCoupon}
                                                        className="btn-primary !px-5 !py-3.5 !rounded-2xl whitespace-nowrap text-sm">
                                                        {appliedCoupon ? 'Change' : 'Apply'}
                                                    </button>
                                                </div>
                                                {appliedCoupon && (
                                                    <div className="mt-2.5 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/60 border border-emerald-200/70">
                                                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-bold text-emerald-700">{appliedCoupon.code}</span>
                                                            <span className="text-xs text-emerald-600 ml-1.5">— {appliedCoupon.label}</span>
                                                        </div>
                                                        <button type="button" onClick={() => { setAppliedCoupon(null); form.setData('coupon_code', ''); form.setData('discount', 0); }}
                                                            className="shrink-0 p-1 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-200/50 transition-all">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Line Items */}
                                            <div className="rounded-2xl bg-gradient-to-br from-surface-50/80 to-white border border-surface-100/80 p-5 space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-surface-500 flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                        {selectedCar.brand} {selectedCar.model}
                                                    </span>
                                                    <span className="font-semibold text-surface-900">{formatPrice(dailyRate)}<span className="text-[10px] text-surface-400 font-normal">/day</span></span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-surface-500 flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        Duration
                                                    </span>
                                                    <span className="font-semibold text-surface-900">{billingDays} day{billingDays !== 1 ? 's' : ''}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm pt-2 border-t border-surface-200/60">
                                                    <span className="text-surface-700 font-medium">Subtotal</span>
                                                    <span className="font-semibold text-surface-900">{formatPrice(subtotal)}</span>
                                                </div>

                                                {taxes.filter(t => t.add_or_minus).length > 0 && (
                                                    <>
                                                        <div className="pt-2 border-t border-surface-200/60">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-2.5 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01" /></svg>
                                                                Fees & Taxes
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                    {taxes.filter(t => t.add_or_minus).map(t => (
                                                                        <div key={t.tax_desc} className="flex justify-between items-center text-sm pl-3">
                                                                            <span className="text-surface-500">
                                                                                {t.tax_desc}
                                                                                {t.value_in && (
                                                                                    <span className="text-[10px] text-surface-400 ml-1.5 font-medium">
                                                                                        {t.value_in === 'Percentage' ? `${t.rate}%` : formatPrice(t.rate ?? 0)}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                            <span className="text-surface-700">+{formatPrice(t.amount)}</span>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-surface-500">Total Fees & Taxes</span>
                                                            <span className="font-semibold text-surface-700">{formatPrice(totalFees)}</span>
                                                        </div>
                                                    </>
                                                )}

                                                {discount > 0 && (
                                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-surface-200/60">
                                                        <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                            Coupon Discount
                                                        </span>
                                                        <span className="text-emerald-600 font-semibold">-{formatPrice(discount)}</span>
                                                    </div>
                                                )}

                                                <div className="pt-3 mt-1 border-t-2 border-surface-300/60 bg-surface-50/50 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-base font-bold text-surface-900">Estimated Total</span>
                                                        <div className="flex items-center gap-2.5">
                                                            {hasPriceChanged && (
                                                                <span className={`text-xs font-medium ${priceDiff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                                    {priceDiff > 0 ? '+' : ''}{formatPrice(priceDiff)}
                                                                </span>
                                                            )}
                                                            <span className="text-xl font-bold text-brand-700">{formatPrice(estimatedTotal)}</span>
                                                        </div>
                                                    </div>
                                                    {hasPriceChanged && (
                                                        <p className="text-[10px] text-surface-400 mt-1">
                                                            {priceDiff > 0
                                                                ? 'This is higher than the original booking total.'
                                                                : 'This is lower than the original booking total.'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="card p-5">
                                            <div className="flex items-center gap-2.5 mb-3">
                                                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 text-brand-600">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </span>
                                                <h4 className="text-sm font-bold text-surface-900">Notes</h4>
                                            </div>
                                            <textarea value={form.data.notes}
                                                onChange={e => form.setData('notes', e.target.value)}
                                                rows={2}
                                                className="input-field resize-none text-sm"
                                                placeholder="Any special requests, flight details, or additional information..." />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Image Preview Lightbox */}
                            {previewImg && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                                    onClick={() => setPreviewImg(null)}>
                                    <div className="relative max-w-2xl w-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl"
                                        onClick={e => e.stopPropagation()}>
                                        <img src={previewImg} alt="Vehicle preview"
                                            className="w-full h-full object-contain max-h-[80vh] bg-surface-900" />
                                        <button type="button" onClick={() => setPreviewImg(null)}
                                            className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Compare Overlay */}
                            {showCompare && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                                    onClick={() => setShowCompare(false)}>
                                    <div className="relative max-w-4xl w-full max-h-[85vh] rounded-3xl bg-white overflow-hidden shadow-2xl flex flex-col"
                                        onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 shrink-0">
                                            <div>
                                                <h3 className="text-base font-bold text-surface-900">Compare Vehicles</h3>
                                                <p className="text-xs text-surface-400">{compareIds.length} vehicles selected</p>
                                            </div>
                                            <button type="button" onClick={() => setShowCompare(false)}
                                                className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-100 text-surface-400 hover:bg-surface-200 hover:text-surface-600 transition-all">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                                {compareList.map(car => {
                                                    const isOriginal = car.id === booking.car.id;
                                                    const totalCost = billingDays > 0 ? car.daily_rate * billingDays : 0;
                                                    const rateDiff = car.daily_rate - originalCarDailyRate;
                                                    const typeStyle = getVehicleTypeStyle(car.vehicle_type || '');
                                                    return (
                                                        <div key={car.id} className="rounded-2xl border border-surface-100 overflow-hidden bg-white hover:shadow-md transition-shadow">
                                                            <div className="aspect-[4/3] bg-surface-100 overflow-hidden">
                                                                <img src={getCarImage(car.image_path, car.id)} alt={`${car.brand} ${car.model}`}
                                                                    className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="p-4">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <p className="text-sm font-bold text-surface-900 truncate">{car.brand} {car.model}</p>
                                                                    {isOriginal && (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shrink-0">Current</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mb-3">
                                                                    {car.vehicle_type && (
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border}`}>{car.vehicle_type}</span>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-surface-400">Daily Rate</span>
                                                                        <span className="font-semibold text-surface-900">{formatPrice(car.daily_rate)}</span>
                                                                    </div>
                                                                    {rateDiff !== 0 && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-surface-400">vs Current</span>
                                                                            <span className={`font-semibold ${rateDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                                {rateDiff > 0 ? '+' : ''}{formatPrice(rateDiff)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between">
                                                                        <span className="text-surface-400">Duration</span>
                                                                        <span className="font-semibold text-surface-900">{billingDays} day{billingDays !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                    <div className="flex justify-between pt-2 border-t border-surface-100">
                                                                        <span className="text-surface-700 font-bold">Total</span>
                                                                        <span className="font-bold text-brand-700">{formatPrice(totalCost)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3 pt-3 border-t border-surface-100">
                                                                    <div className="flex items-center gap-3 text-[11px] text-surface-400">
                                                                        {car.seats && <span>{car.seats} seats</span>}
                                                                        {car.transmission && <span>{car.transmission}</span>}
                                                                        {car.fuel_type && <span>{car.fuel_type}</span>}
                                                                    </div>
                                                                </div>
                                                                <button type="button" onClick={() => { form.setData('car_id', car.id); setShowCompare(false); }}
                                                                    className="mt-3 w-full py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-colors">
                                                                    {Number(form.data.car_id) === car.id ? 'Currently Selected' : 'Select This Vehicle'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-100">
                                <div>
                                    {currentStep > 0 ? (
                                        <button type="button" onClick={goBack}
                                            className="btn-ghost group">
                                            <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            Back
                                        </button>
                                    ) : (
                                        <Link
                                            href={route(isGuest ? 'bookings.guest.show' : 'bookings.show', isGuest ? booking.reference_code! : booking.id)}
                                            className="btn-ghost">
                                            Cancel
                                        </Link>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-surface-400 font-medium mr-2">
                                        Step {currentStep + 1} of {STEPS.length}
                                    </span>
                                    {currentStep < STEPS.length - 1 ? (
                                        <button type="button" onClick={goNext}
                                            className="btn-primary min-w-[140px] group">
                                            Continue
                                            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleSubmit()}
                                            disabled={form.processing}
                                            className="btn-primary min-w-[160px]">
                                            {form.processing ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Saving...
                                                </span>
                                            ) : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Layout>
        </>
    );
}
