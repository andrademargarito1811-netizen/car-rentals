import { useState, useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import VehicleDamageMap from '@/Components/VehicleDamageMap';
import type { VehicleDamage } from '@/lib/carZones';

interface GuestShowProps {
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
        car: {
            id: number;
            brand: string;
            model: string;
            year: number;
            license_plate: string;
            daily_rate: number;
            image_path: string | null;
            seats?: number;
            transmission?: string;
            fuel_type?: string;
            vehicle_type?: string | null;
        };
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
        payment: {
            id: string;
            amount: number;
            payment_method: string;
            payment_status: string;
            transaction_id: string | null;
        } | null;
        pickup_location: { location: string } | null;
        return_location: { location: string } | null;
        coupon_usage: { code: string; discount_amount: number } | null;
        booking_taxes: { tax_desc: string; amount: number; add_or_minus: boolean }[];
        pickup_handover: { fuel_level: number | null; odometer: number | null; notes: string | null; damages: VehicleDamage[] | null; captured_at: string | null } | null;
        return_handover: { fuel_level: number | null; odometer: number | null; notes: string | null; damages: VehicleDamage[] | null; captured_at: string | null } | null;
        extra_charges: { id: number; name: string; amount: string; tax_amount: string; operator: string }[];
        handover_charges: { fuel_refuel: number; fuel_missing: number; excess_mileage: number; excess_km: number; km_driven: number; total: number } | null;
    };
}

const STYLES = `
@keyframes fadeIn { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes slideDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.anim-fade { animation: fadeIn 0.5s ease-out both; }
.anim-slide { animation: slideDown 0.5s ease-out both; }
.anim-scale { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.d1 { animation-delay: 0.05s; }
.d2 { animation-delay: 0.1s; }
.d3 { animation-delay: 0.15s; }
.d4 { animation-delay: 0.2s; }
.d5 { animation-delay: 0.25s; }
.d6 { animation-delay: 0.3s; }
.d7 { animation-delay: 0.35s; }
.d8 { animation-delay: 0.4s; }
.d9 { animation-delay: 0.45s; }
.d10 { animation-delay: 0.5s; }
`;

const CAR_IMAGES = [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop',
];

const getCarImage = (car: { image_path?: string | null; id?: number }) =>
    car.image_path
        ? `/storage/${car.image_path}`
        : CAR_IMAGES[(car.id ?? 0) % CAR_IMAGES.length];

const formatDate = (value: string) =>
    new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

const formatTime = (value: string | null) => {
    if (!value) return '—';
    const [h, m] = value.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return value;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const formatPrice = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatOdometer = (value: number | null | undefined) =>
    value == null ? '—' : `${Math.round(value).toLocaleString()}`;

const FuelRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-surface-100/60 last:border-b-0">
        <span className="text-xs font-medium text-surface-400">{label}</span>
        <span className="text-sm font-semibold text-surface-800">{value}</span>
    </div>
);

const StatusDot = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        pending: 'bg-amber-400', confirmed: 'bg-emerald-400', active: 'bg-blue-400',
        completed: 'bg-surface-400', cancelled: 'bg-red-400',
    };
    return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-surface-400'}`} />;
};

const StatCard = ({ label, value, icon, delay }: { label: string; value: string; icon: React.ReactNode; delay: string }) => (
    <div className={`anim-fade ${delay} rounded-2xl border border-surface-100/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-200/50 transition-all duration-300`}>
        <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600">
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400">{label}</p>
                <p className="text-sm font-bold text-surface-800 mt-0.5 truncate">{value}</p>
            </div>
        </div>
    </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-surface-50/70 hover:bg-surface-100/50 transition-colors">
        <span className="text-xs font-medium text-surface-400">{label}</span>
        <span className="text-sm font-semibold text-surface-800 text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
);

export default function GuestShow({ booking }: GuestShowProps) {
    const flash = (usePage().props as any).flash as { success?: string; error?: string } | undefined;
    const [flashVisible, setFlashVisible] = useState(true);
    useEffect(() => { if (flash?.success || flash?.error) setFlashVisible(true); }, []);

    const calcRentalDays = (pickupDate: string, pickupTime: string | null, returnDate: string, returnTime: string | null) => {
        const toHHMM = (t?: string | null) => (t && t.length >= 5 ? t.substring(0, 5) : t || '');
        const start = new Date(`${pickupDate}T${toHHMM(pickupTime) || '00:00'}:00`);
        const end = new Date(`${returnDate}T${toHHMM(returnTime) || '23:59'}:00`);
        return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    };
    const days = calcRentalDays(booking.start_date, booking.pickup_time, booking.end_date, booking.return_time);
    const subtotal = (booking.car?.daily_rate ?? 0) * days;

    return (
        <>
            <Head title={`Reservation ${booking.reference_code ?? `#${booking.id}`}`} />
            <GuestLayout>
                <style>{STYLES}</style>

                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900">
                    <div className="pointer-events-none absolute inset-0 opacity-20">
                        <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-accent-400 blur-3xl" />
                        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-brand-400 blur-3xl" />
                    </div>
                    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <div className="anim-slide flex items-center gap-4 mb-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                                <svg className="h-6 w-6 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">Booking Confirmed</h1>
                                <p className="text-brand-200 text-sm mt-0.5">
                                    Reference{' '}
                                    <span className="font-semibold text-white">{booking.reference_code}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                    {/* Flash Messages */}
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

                    {/* Success banner */}
                    <div className="anim-scale d1 mb-8 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-emerald-50/60 p-4 flex items-center gap-3 shadow-lg shadow-emerald-200/20">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-white shadow-md shadow-emerald-300/40">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <p className="text-sm text-emerald-700">
                            We'll email your confirmation and contact you at the number provided. For questions, reach us at{' '}
                            <a href="mailto:info@westcarsales.com" className="font-semibold underline decoration-emerald-300 hover:decoration-emerald-600 transition-all">info@westcarsales.com</a>{' '}
                            or call{' '}
                            <a href="tel:+18005559378" className="font-semibold underline decoration-emerald-300 hover:decoration-emerald-600 transition-all">+1 (800) 555-WEST</a>.
                        </p>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        <StatCard
                            label="Reference"
                            value={`#${booking.reference_code}`}
                            delay="d2"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                        />
                        <StatCard
                            label="Status"
                            value={booking.status}
                            delay="d3"
                            icon={<StatusDot status={booking.status} />}
                        />
                        <StatCard
                            label="Total"
                            value={formatPrice(booking.total_amount)}
                            delay="d4"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
                        />
                        <StatCard
                            label="Duration"
                            value={`${days} ${days === 1 ? 'day' : 'days'}`}
                            delay="d5"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>}
                        />
                    </div>

                    {/* Main grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Left column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Booking Details */}
                            <div className="anim-fade d4 rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-surface-100/60 flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Booking Details
                                    </h2>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                        booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        booking.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-surface-100 text-surface-600 border-surface-200'
                                    }`}>
                                        <StatusDot status={booking.status} />
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InfoRow label="Pick-up Date" value={formatDate(booking.start_date)} />
                                    <InfoRow label="Pick-up Time" value={formatTime(booking.pickup_time)} />
                                    <InfoRow label="Return Date" value={formatDate(booking.end_date)} />
                                    <InfoRow label="Return Time" value={formatTime(booking.return_time)} />
                                    <div className="sm:col-span-2">
                                        <InfoRow label="Pick-up Location" value={booking.pickup_location?.location ?? '—'} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <InfoRow label="Return Location" value={booking.return_location?.location ?? '—'} />
                                    </div>
                                </div>
                            </div>

                            {/* Driver Information */}
                            <div className="anim-fade d5 rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-surface-100/60">
                                    <h2 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Driver Information
                                    </h2>
                                </div>
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InfoRow label="Name" value={booking.guest ? `${booking.guest.title ?? ''} ${booking.guest.first_name} ${booking.guest.last_name}`.trim() : '—'} />
                                    <InfoRow label="Driver's Age" value={booking.guest?.driver_age?.toString() ?? '—'} />
                                    <InfoRow label="Phone" value={booking.guest?.phone ?? '—'} />
                                    <InfoRow label="Email" value={booking.guest?.email ?? '—'} />
                                    <InfoRow label="Flight No." value={booking.guest?.flight_no ?? '—'} />
                                    <InfoRow label="Address" value={booking.guest ? [booking.guest.address, booking.guest.address2].filter(Boolean).join(', ') || '—' : '—'} />
                                    <InfoRow label="City" value={booking.guest?.city ?? '—'} />
                                    <InfoRow label="State / Province" value={booking.guest?.state ?? '—'} />
                                    <InfoRow label="Postal Code" value={booking.guest?.postal_code ?? '—'} />
                                    <InfoRow label="Country" value={booking.guest?.country ?? '—'} />
                                </div>
                            </div>

                            {/* Vehicle Condition */}
                            {(booking.pickup_handover || booking.return_handover) && (
                                <div className="anim-fade d6 rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-surface-100/60">
                                        <h2 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.5 7.5l1 1m0 0l-1 1m1-1H18m-6 11V7.5m3 0a3 3 0 00-3-3h-1.5a3 3 0 00-3 3v8.25M6 10.5H4.5a1.5 1.5 0 00-1.5 1.5v4.5a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5V12a1.5 1.5 0 00-1.5-1.5H6z" />
                                            </svg>
                                            Vehicle Condition
                                        </h2>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="rounded-2xl border border-surface-100/80 bg-surface-50/50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400 mb-3">At Pickup</p>
                                            {booking.pickup_handover ? (
                                                <>
                                                    <FuelRow label="Fuel Level" value={booking.pickup_handover.fuel_level != null ? `${booking.pickup_handover.fuel_level}/8` : '—'} />
                                                    <FuelRow label="Odometer" value={formatOdometer(booking.pickup_handover.odometer)} />
                                                    {booking.pickup_handover.notes && <FuelRow label="Notes" value={booking.pickup_handover.notes} />}
                                                    {booking.pickup_handover.damages && booking.pickup_handover.damages.length > 0 && (
                                                        <div className="pt-3 border-t border-surface-100/60 mt-3">
                                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400 mb-2">
                                                                Damage ({booking.pickup_handover.damages.length})
                                                            </p>
                                                            <VehicleDamageMap damages={booking.pickup_handover.damages} readOnly variant="existing" vehicleType={booking.car?.vehicle_type} />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-sm text-surface-400">Not recorded</p>
                                            )}
                                        </div>
                                        <div className="rounded-2xl border border-surface-100/80 bg-surface-50/50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400 mb-3">At Return</p>
                                            {booking.return_handover ? (
                                                <>
                                                    <FuelRow label="Fuel Level" value={booking.return_handover.fuel_level != null ? `${booking.return_handover.fuel_level}/8` : '—'} />
                                                    <FuelRow label="Odometer" value={formatOdometer(booking.return_handover.odometer)} />
                                                    {booking.return_handover.notes && <FuelRow label="Notes" value={booking.return_handover.notes} />}
                                                    {booking.return_handover.damages && booking.return_handover.damages.length > 0 && (
                                                        <div className="pt-3 border-t border-surface-100/60 mt-3">
                                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400 mb-2">
                                                                Damage ({booking.return_handover.damages.length})
                                                            </p>
                                                            <VehicleDamageMap damages={booking.return_handover.damages} readOnly variant="new" vehicleType={booking.car?.vehicle_type} />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-sm text-surface-400">Not recorded</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right column (1/3) */}
                        <div className="space-y-6">
                            {/* Vehicle Card */}
                            <div className="anim-fade d6 rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden">
                                <div className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900">
                                    <div className="pointer-events-none absolute inset-0 opacity-15">
                                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent-400 blur-3xl" />
                                        <div className="absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-brand-400 blur-3xl" />
                                    </div>
                                    <div className="relative h-44 overflow-hidden">
                                        <img
                                            src={getCarImage(booking.car)}
                                            alt={`${booking.car?.brand} ${booking.car?.model}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/10 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-xl font-bold text-white drop-shadow-sm">{booking.car?.brand} {booking.car?.model}</p>
                                                    <p className="text-sm text-brand-200 mt-0.5 drop-shadow-sm">{booking.car?.year} · {booking.car?.license_plate}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400">Daily Rate</p>
                                        <p className="text-2xl font-extrabold text-accent-600">{formatPrice(booking.car?.daily_rate ?? 0)}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Seats', value: booking.car?.seats?.toString(), icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
                                            { label: 'Transmission', value: booking.car?.transmission, icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z' },
                                            { label: 'Fuel', value: booking.car?.fuel_type, icon: 'M20.5 7.5l1 1m0 0l-1 1m1-1H18m-6 11V7.5m3 0a3 3 0 00-3-3h-1.5a3 3 0 00-3 3v8.25M6 10.5H4.5a1.5 1.5 0 00-1.5 1.5v4.5a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5V12a1.5 1.5 0 00-1.5-1.5H6z' },
                                            { label: 'Type', value: booking.car?.vehicle_type, icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z' },
                                        ].filter(spec => spec.value != null).map((spec) => (
                                            <div key={spec.label} className="flex items-center gap-2.5 rounded-xl bg-surface-50/80 px-3.5 py-2.5 border border-surface-100/50">
                                                <svg className="h-4 w-4 shrink-0 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={spec.icon} />
                                                </svg>
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">{spec.label}</p>
                                                    <p className="text-sm font-bold text-surface-800">{spec.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="anim-fade d7 rounded-2xl border border-surface-100/80 bg-white shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-surface-100/60">
                                    <h2 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                                        </svg>
                                        Price Summary
                                    </h2>
                                </div>
                                <div className="p-5 space-y-2.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-surface-400">{formatPrice(booking.car?.daily_rate ?? 0)} × {days} {days === 1 ? 'day' : 'days'}</span>
                                        <span className="font-semibold text-surface-800">{formatPrice(subtotal)}</span>
                                    </div>

                                    {booking.booking_taxes?.filter(t => t.add_or_minus).length > 0 && (
                                        <div className="border-t border-dashed border-surface-200/60 pt-2.5 space-y-1.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400 mb-1.5">Fees & Taxes</p>
                                            {booking.booking_taxes.filter(t => t.add_or_minus).map((t: { tax_desc: string; amount: number }) => {
                                                const pct = subtotal > 0 ? ((t.amount / subtotal) * 100).toFixed(1) : null;
                                                return (
                                                <div key={t.tax_desc} className="flex items-center justify-between text-sm">
                                                    <span className="text-surface-400">{t.tax_desc}{pct ? <span className="text-surface-400 font-normal ml-1">({pct}%)</span> : null}</span>
                                                    <span className="font-medium text-surface-600">+{formatPrice(t.amount)}</span>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {booking.handover_charges && booking.handover_charges.total > 0 && (
                                        <div className="border-t border-dashed border-surface-200/60 pt-2.5 space-y-1.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400 mb-1.5">Additional Charges</p>
                                            {booking.handover_charges.fuel_refuel > 0 && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-surface-400">Fuel refueling</span>
                                                    <span className="font-medium text-surface-600">+{formatPrice(booking.handover_charges.fuel_refuel)}</span>
                                                </div>
                                            )}
                                            {booking.handover_charges.excess_mileage > 0 && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-surface-400">Excess mileage</span>
                                                    <span className="font-medium text-surface-600">+{formatPrice(booking.handover_charges.excess_mileage)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(booking.extra_charges ?? []).length > 0 && (
                                        <div className="border-t border-dashed border-surface-200/60 pt-2.5 space-y-1.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400 mb-1.5">Charged at Return</p>
                                            {(booking.extra_charges ?? []).map((c) => (
                                                <div key={c.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-surface-400">
                                                        {c.name}
                                                        {Number(c.tax_amount) > 0 && <span className="text-[10px] text-surface-400/70"> incl. tax</span>}
                                                    </span>
                                                    <span className="font-medium text-surface-600">{c.operator === '-' ? '–' : '+'}{formatPrice(Number(c.amount) + Number(c.tax_amount))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {booking.coupon_usage && (
                                        <div className="flex items-center justify-between text-sm bg-green-50/80 rounded-xl px-3 py-2 -mx-1 border border-green-100/50">
                                            <span className="font-medium text-green-700 text-xs">Coupon ({booking.coupon_usage.code}){(() => { const dp = subtotal > 0 ? ((booking.coupon_usage!.discount_amount / subtotal) * 100).toFixed(1) : null; return dp ? <span className="text-green-500 font-normal ml-1">({dp}% off)</span> : null; })()}</span>
                                            <span className="font-bold text-green-600">–{formatPrice(booking.coupon_usage.discount_amount)}</span>
                                        </div>
                                    )}

                                    {booking.payment && (
                                        <div className="flex items-center justify-between text-sm pt-1">
                                            <span className="text-surface-400">Payment</span>
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${booking.payment.payment_status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${booking.payment.payment_status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {booking.payment.payment_status}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-surface-200/80 flex items-center justify-between">
                                        <span className="text-sm font-bold text-surface-900">Total</span>
                                        <span className="text-xl font-extrabold text-brand-800">{formatPrice(booking.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {booking.notes && (
                                <div className="anim-fade d8 rounded-2xl border border-surface-100/80 bg-white shadow-sm p-5">
                                    <h3 className="text-xs font-bold text-surface-700 flex items-center gap-2 mb-2">
                                        <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                        </svg>
                                        Notes
                                    </h3>
                                    <p className="text-sm text-surface-500 leading-relaxed">{booking.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="anim-fade d9 flex flex-col sm:flex-row gap-3 pb-12">
                        <Link
                            href={route('bookings.lookup')}
                            className="flex-1 group rounded-2xl border-2 border-surface-200 bg-white px-6 py-3.5 text-sm font-bold text-surface-600 text-center hover:border-brand-200 hover:text-brand-700 hover:shadow-lg hover:shadow-brand-100/20 transition-all duration-300 active:scale-[0.98]"
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Look Up Another Reservation
                            </span>
                        </Link>
                        {['pending'].includes(booking.status) && (
                            <Link
                                href={route('bookings.guest.edit', booking.reference_code ?? '')}
                                className="flex-1 group rounded-2xl bg-brand-800 px-6 py-3.5 text-sm font-bold text-white text-center hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200/30 transition-all duration-300 active:scale-[0.98]"
                            >
                                <span className="inline-flex items-center justify-center gap-2">
                                    Modify Booking
                                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                </span>
                            </Link>
                        )}
                        <Link
                            href={route('reservations')}
                            className="flex-1 group rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 px-6 py-3.5 text-sm font-bold text-white text-center shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40 hover:from-accent-400 hover:to-accent-500 transition-all duration-300 active:scale-[0.98]"
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                Make a New Reservation
                                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </span>
                        </Link>
                    </div>
                </div>
            </GuestLayout>
        </>
    );
}
