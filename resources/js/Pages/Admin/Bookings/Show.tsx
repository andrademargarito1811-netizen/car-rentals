import { Fragment, useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/Components/ui/popover';
import VehicleDamageMap from '@/Components/VehicleDamageMap';
import PrintDamageSummary from '@/Components/car3d/PrintDamageSummary';
import { FUEL_MAX_BARS } from '@/Components/FuelGaugeInput';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Calendar,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  ArrowLeft,
  ArrowRight,
  Printer,
  Clock,
  ChevronRight,
  MapPin,
  User,
  Car,
  Fuel,
  Gauge,
  Wind,
  Search,
  Hash,
  Users,
  Luggage,
  FileText,
  PenLine,
  BadgeCheck,
  XCircle,
  Building2,
  CalendarPlus,
  CalendarClock,
  ArrowRightLeft,
  Banknote,
  Receipt,
  Undo2,
  Activity,
  ChevronDown,
  ZoomIn,
  EllipsisVertical,
} from 'lucide-react';
import CheckinVehicleSheet from './CheckinVehicleSheet';
import RecordPaymentSheet from './RecordPaymentSheet';
import EditPaymentSheet from './EditPaymentSheet';
import ImageLightbox from '@/Components/ImageLightbox';
import { PaymentItem, formatPrice, sortPaymentsNewest } from './PaymentItem';
import type { AdminBooking, BookingPayment, TimelineEvent } from './types';

interface AdminBookingsShowProps {
    booking: AdminBooking;
    extraCharges?: ExtraChargeCatalogItem[];
}

interface ExtraChargeCatalogItem {
    id: number;
    name: string;
    type: string;
    calculation: string;
    value_in: string;
    operator: string;
    rate: string;
    taxable: boolean;
    apply_always: boolean;
    is_active: boolean;
}

function getCustomerName(booking: AdminBookingsShowProps['booking']): string {
    return booking.user?.name ?? (booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : 'Guest');
}

function getCustomerEmail(booking: AdminBookingsShowProps['booking']): string {
    return booking.user?.email ?? booking.guest?.email ?? '—';
}

function getCustomerPhone(booking: AdminBookingsShowProps['booking']): string | null {
    return booking.user?.phone ?? booking.guest?.phone ?? null;
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
}

function formatTime(time: string | null): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function formatHandoverTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatRelativeDate(date: string): string {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return formatDate(date);
}

function getDaysDifference(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.max(1, Math.round((Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) - Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) / msPerDay));
}

function statusOptions(): { value: string; label: string }[] {
    return [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];
}

function statusDotClass(status: string): string {
    switch (status) {
        case 'confirmed': return 'bg-blue-500';
        case 'active': return 'bg-emerald-500';
        case 'pending': return 'bg-amber-500';
        case 'cancelled': return 'bg-red-500';
        default: return 'bg-surface-400';
    }
}

function SpecChip({ spec }: { spec: { icon: typeof Car; label: string; value: string | null; color: string } }) {
    const hasValue = spec.value !== null && spec.value !== undefined;
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${spec.color}`}>
                <spec.icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground">{spec.label}</p>
                <p className={`text-xs font-semibold font-mono truncate ${hasValue ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                    {hasValue ? spec.value : '—'}
                </p>
            </div>
        </div>
    );
}

const BOOKING_STATUS_FLOW = [
    { value: 'pending', label: 'Pending', icon: Clipboard },
    { value: 'confirmed', label: 'Confirmed', icon: BadgeCheck },
    { value: 'active', label: 'Active', icon: Car },
    { value: 'completed', label: 'Completed', icon: CheckCircle2 },
];

function carColorClass(color: string | null) {
    if (!color) return 'bg-gradient-to-br from-brand-400 to-brand-600';
    const map: Record<string, string> = {
        white: 'bg-gray-100 border border-gray-300',
        black: 'bg-gray-900',
        silver: 'bg-gray-300',
        gray: 'bg-gray-400',
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-400',
        orange: 'bg-orange-500',
        brown: 'bg-amber-700',
        navy: 'bg-blue-900',
        burgundy: 'bg-red-800',
        beige: 'bg-amber-100 border border-amber-300',
    };
    return map[color.toLowerCase()] || 'bg-gradient-to-br from-brand-400 to-brand-600';
}

function formatOdometer(value: number | null | undefined): string {
    return value == null ? '—' : `${Math.round(value).toLocaleString()}`;
}

function FuelBar({ level, tone }: { level: number | null | undefined; tone: 'emerald' | 'amber' }) {
    const bars = Math.max(0, Math.min(FUEL_MAX_BARS, Math.round(Number(level ?? 0))));
    const color = tone === 'emerald' ? 'bg-emerald-500' : 'bg-amber-400';
    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1">
                {Array.from({ length: FUEL_MAX_BARS }, (_, i) => (
                    <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i < bars ? color : 'bg-muted'}`}
                    />
                ))}
            </div>
            <span className="text-xs font-bold text-foreground tabular-nums w-12 text-right">{bars}/{FUEL_MAX_BARS}</span>
        </div>
    );
}

const TIMELINE_STYLES: Record<TimelineEvent['type'], { icon: typeof CalendarPlus; className: string }> = {
    created: { icon: CalendarPlus, className: 'bg-primary/10 text-primary ring-primary/10' },
    status: { icon: BadgeCheck, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-600/10 dark:ring-blue-400/10' },
    payment: { icon: Banknote, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-600/10 dark:ring-emerald-400/10' },
    refund: { icon: Undo2, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-purple-600/10 dark:ring-purple-400/10' },
    extension: { icon: CalendarPlus, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-600/10 dark:ring-amber-400/10' },
    rebook: { icon: ArrowRightLeft, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-600/10 dark:ring-amber-400/10' },
    swap: { icon: ArrowRightLeft, className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 ring-violet-600/10 dark:ring-violet-400/10' },
    modified: { icon: PenLine, className: 'bg-surface-100 text-surface-600 dark:bg-surface-700/50 dark:text-surface-400 ring-surface-400/10' },
    rescheduled: { icon: Calendar, className: 'bg-surface-100 text-surface-600 dark:bg-surface-700/50 dark:text-surface-400 ring-surface-400/10' },
    cancelled: { icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-600/10 dark:ring-red-400/10' },
    charges: { icon: Receipt, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-600/10 dark:ring-amber-400/10' },
    checkout: { icon: Car, className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-indigo-600/10 dark:ring-indigo-400/10' },
    checkin: { icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-600/10 dark:ring-emerald-400/10' },
    other: { icon: Activity, className: 'bg-surface-100 text-surface-600 dark:bg-surface-700/50 dark:text-surface-400 ring-surface-400/10' },
};

function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
    if (!events.length) return null;

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-4 pb-2 shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-primary" />
                    Activity Timeline
                </CardTitle>
                <CardDescription>
                    Status changes, extensions, payments and handovers for this reservation.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                <div>
                    {events.map((ev, i) => {
                        const style = TIMELINE_STYLES[ev.type] ?? TIMELINE_STYLES.other;
                        const Icon = style.icon;
                        const last = i === events.length - 1;
                        return (
                            <div key={ev.id} className="relative flex gap-3 pb-5 last:pb-0">
                                <div className="relative flex flex-col items-center shrink-0">
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ${style.className}`}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    {!last && <span className="mt-1 w-px flex-1 bg-border" />}
                                </div>
                                <div className="min-w-0 pb-1">
                                    <p className="text-sm font-semibold text-foreground leading-tight">{ev.title}</p>
                                    {ev.description && (
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ev.description}</p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                                        {ev.at ? formatDateTime(ev.at) : ''}
                                        {ev.user ? ` · ${ev.user}` : ''}
                                    </p>
                                    {ev.related_booking_id && (
                                        <Link href={route('admin.bookings.show', ev.related_booking_id)} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                                            View #{ev.related_reference}
                                            <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminBookingsShow({ booking, extraCharges = [] }: AdminBookingsShowProps) {
    const route = useRoute();
    const form = useForm({
        status: booking.status,
        downpayment_amount: '',
        payment_method: 'Cash',
    });

    const [showPaymentSheet, setShowPaymentSheet] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<BookingPayment | null>(null);
    const [carImageError, setCarImageError] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [showMoreSpecs, setShowMoreSpecs] = useState(false);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const popoverStatusOptions = statusOptions().filter(o => !['active', 'completed'].includes(o.value));

    useEffect(() => {
        setCarImageError(false);
    }, [booking.id]);


    function copyBookingId() {
        navigator.clipboard.writeText(booking.reference_code ?? `#${booking.id}`);
        toast.success('Copied!', { description: booking.reference_code ?? `#${booking.id}` });
    }

    function updateStatus(e: React.FormEvent) {
        e.preventDefault();
        const newStatus = form.data.status;
        if (newStatus === 'cancelled' && !confirmCancel) {
            setConfirmCancel(true);
            return;
        }
        form.patch(route('admin.bookings.status', booking.id), {
            onSuccess: () => {
                form.reset();
                setStatusOpen(false);
                setConfirmCancel(false);
                toast.success('Status updated', { description: `Booking is now ${statusOptions().find(o => o.value === newStatus)?.label ?? newStatus}` });
            },
        });
    }

    function handleStatusOpenChange(open: boolean) {
        setStatusOpen(open);
        if (!open) setConfirmCancel(false);
    }

    function openEditPayment(p: BookingPayment, closeSheet = false) {
        setEditingPayment(p);
        if (closeSheet) setShowPaymentSheet(false);
    }

    const totalAmount = Number(booking.total_amount) || 0;
    const totalPaid = (booking.payments ?? []).filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = totalAmount - totalPaid;
    const hasRefund = (booking.payments ?? []).some(p => p.payment_status === 'completed' && p.type === 'refund');
    const isFullyRefunded = hasRefund && totalPaid <= 0;

    const pickup = booking.pickup_handover;
    const days = getDaysDifference(booking.start_date, booking.end_date);

    const hasSwaps = (booking.swaps ?? []).length > 0;
    const rentalSegments = (booking.swap_segments ?? []).length > 0 ? booking.swap_segments : null;
    const rentalSubtotal = rentalSegments
        ? rentalSegments.reduce((sum, seg) => sum + (Number(seg.subtotal) || 0), 0)
        : Number(booking.car?.daily_rate ?? 0) * days;
    const taxLines = (booking.booking_taxes ?? []).map(t => ({
        desc: t.tax_desc,
        amount: Math.round((t.add_or_minus ? 1 : -1) * Number(t.amount) * 100) / 100,
    }));
    const taxesTotal = taxLines.reduce((sum, t) => sum + t.amount, 0);
    const handoverChargesTotal = Number(booking.handover_charges?.total ?? 0);
    const extraChargesTotal = (booking.extra_charges ?? []).reduce((sum, c) => {
        const amt = Number(c.amount) + Number(c.tax_amount);
        return sum + (c.operator === '-' ? -amt : amt);
    }, 0);
    const couponDiscount = Number(booking.coupon_usage?.discount_amount ?? 0);
    const adjustments = Math.round((totalAmount - rentalSubtotal - taxesTotal - handoverChargesTotal - extraChargesTotal - couponDiscount) * 100) / 100;
    const paymentPercent = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;
    const statusIndex = BOOKING_STATUS_FLOW.findIndex(s => s.value === booking.status);

    const customerName = getCustomerName(booking);
    const customerEmail = getCustomerEmail(booking);
    const customerPhone = getCustomerPhone(booking);
    const initials = getInitials(customerName);
    const extensionSource = booking.extension_source;
    const extensionChildren = booking.extension_children ?? [];
    const carImageSrc = booking.car?.image_path ? `/storage/${booking.car.image_path}` : null;
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);

    const isClosed = ['completed', 'cancelled'].includes(booking.status);
    const canModify = ['pending', 'confirmed'].includes(booking.status);
    const canExtend = ['confirmed', 'active'].includes(booking.status);
    const showPayment = remainingBalance > 0 && !isFullyRefunded;
    const showStatus = !isClosed;
    const hasMoreActions = canModify || canExtend;
    const hasExtension = Boolean(extensionSource || extensionChildren.length > 0);
    const hasHandover = Boolean(booking.pickup_handover || booking.return_handover);
    const timelineRowClass = hasExtension ? 'xl:row-start-3' : 'xl:row-start-2';
    const activityTimeline = (
        <div className={`xl:col-start-3 self-start ${timelineRowClass} ${!hasExtension && hasHandover ? 'xl:row-span-2' : ''}`}>
            <ActivityTimeline events={booking.timeline ?? []} />
        </div>
    );

    return (
        <>
            <Head title={`Booking #${booking.reference_code ?? booking.id}`} />

            <AuthenticatedLayout>
                <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-4 max-w-screen-2xl mx-auto">
                    {/* Immersive hero */}
                    <div className="relative overflow-hidden rounded-3xl border border-surface-200 dark:border-surface-700 shadow-elevated">
                        <div className="relative h-56 sm:h-64">
                            {booking.car.image_path && !carImageError ? (
                                <img
                                    src={`/storage/${booking.car.image_path}`}
                                    alt={`${booking.car.brand} ${booking.car.model}`}
                                    loading="lazy"
                                    onError={() => setCarImageError(true)}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className={`w-full h-full ${carColorClass(booking.car.color)}`} />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

                            <div className="absolute inset-x-0 top-0 p-4 sm:p-5 flex items-center justify-between gap-3">
                                <nav className="flex items-center gap-1.5 text-xs font-medium text-white/80 min-w-0">
                                    <Link href={route('admin.reservations.index')} className="hover:text-white transition-colors shrink-0">
                                        Reservations
                                    </Link>
                                    <ChevronRight className="w-3 h-3 shrink-0" />
                                    <span className="text-white truncate">{booking.reference_code ?? `#${booking.id}`}</span>
                                </nav>
                                <div className="flex items-center gap-2">
                                    <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/80 bg-black/30 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
                                        <Clock className="w-3 h-3" />
                                        {formatRelativeDate(booking.created_at)}
                                    </span>
                                    {carImageSrc && (
                                        <button
                                            type="button"
                                            onClick={() => setZoomImage(carImageSrc)}
                                            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur border border-white/10 text-white/80 hover:text-white hover:bg-black/40 transition-colors"
                                            aria-label="Zoom vehicle image"
                                            title="Click to zoom"
                                        >
                                            <ZoomIn className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Booking Reference</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                                {booking.reference_code ?? `#${booking.id}`}
                                            </h1>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg bg-white/10 text-white hover:bg-white/20"
                                                onClick={copyBookingId}
                                                title="Copy booking ID"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <Badge variant={booking.status as 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'}>
                                                {statusOptions().find(o => o.value === booking.status)?.label ?? booking.status}
                                            </Badge>
                                            {isFullyRefunded && (
                                                <Badge variant="payment_refunded">Fully Refunded</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-white/80 mt-2 flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            {customerName}
                                            <span className="text-white/40">·</span>
                                            <span>{formatDate(booking.start_date)} — {formatDate(booking.end_date)}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl px-3.5 py-2 text-center">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Paid</p>
                                            <p className="text-lg font-bold text-white tabular-nums">{formatPrice(totalPaid)}</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl px-3.5 py-2 text-center">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Total</p>
                                            <p className="text-lg font-bold text-white tabular-nums">{formatPrice(totalAmount)}</p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl px-3.5 py-2 text-center">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Duration</p>
                                            <p className="text-lg font-bold text-white tabular-nums">{days}d</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Next action strip */}
                        <div className="bg-white dark:bg-brand-900 px-4 sm:px-5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-surface-100 dark:border-surface-700">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next</span>
                            <span className="text-sm font-medium text-foreground">
                                {booking.status === 'pending'
                                    ? 'Confirm this booking and record the downpayment.'
                                    : booking.status === 'confirmed'
                                        ? 'Check out the vehicle — record the pickup handover before the guest leaves.'
                                        : booking.status === 'active'
                                            ? remainingBalance > 0
                                                ? `Collect ${formatPrice(remainingBalance)} and check the vehicle back in.`
                                                : 'Record the return handover to complete this rental.'
                                            : booking.status === 'completed'
                                                ? 'This rental is complete. Use the invoice for a record of the trip.'
                                                : 'This reservation is cancelled.'}
                            </span>
                        </div>
                    </div>

                    {/* Booking Lifecycle */}
                    <Card>
                        <CardContent className="p-4 sm:p-5">
                            {booking.status === 'cancelled' ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                                        <XCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Booking Cancelled</p>
                                        <p className="text-xs text-muted-foreground">
                                            This booking is cancelled and no longer active.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center">
                                        {BOOKING_STATUS_FLOW.map((step, i) => {
                                            const isComplete = i < statusIndex;
                                            const isCurrent = i === statusIndex;
                                            return (
                                                <Fragment key={step.value}>
                                                    <div className="w-16 sm:w-24 flex justify-center">
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                                                                isComplete
                                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                                    : isCurrent
                                                                        ? 'bg-primary/10 border-primary text-primary ring-4 ring-primary/10'
                                                                        : 'bg-muted border-border text-muted-foreground'
                                                            }`}
                                                        >
                                                            {isComplete ? (
                                                                <Check className="w-4 h-4" />
                                                            ) : (
                                                                <step.icon className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    {i < BOOKING_STATUS_FLOW.length - 1 && (
                                                        <div
                                                            className={`flex-1 h-0.5 rounded-full ${i < statusIndex ? 'bg-primary' : 'bg-border'}`}
                                                        />
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center mt-2">
                                        {BOOKING_STATUS_FLOW.map((step, i) => (
                                            <Fragment key={step.value}>
                                                <div
                                                    className={`w-16 sm:w-24 text-center text-[10px] sm:text-xs ${
                                                        i === statusIndex
                                                            ? 'font-semibold text-foreground'
                                                            : i < statusIndex
                                                                ? 'font-medium text-foreground'
                                                                : 'font-medium text-muted-foreground'
                                                    }`}
                                                >
                                                    {step.label}
                                                </div>
                                                {i < BOOKING_STATUS_FLOW.length - 1 && <div className="flex-1" />}
                                            </Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bento grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {/* Vehicle tile */}
                        <div className="md:col-span-2">
                            {booking.car ? (
                                <Card className="overflow-hidden h-full">
                                    <CardHeader className="p-4 pb-0 flex-row items-center justify-between gap-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Car className="w-4 h-4 text-primary" />
                                            Vehicle
                                        </CardTitle>
                                        <div className="flex items-center gap-1">
                                            <Link href={route('admin.cars.edit', booking.car.id)}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit car">
                                                    <PenLine className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={route('admin.cars.schedule', { car: booking.car.id })}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="View schedule">
                                                    <CalendarClock className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div className="relative h-40 sm:h-auto sm:w-44 lg:w-56 shrink-0 rounded-xl bg-muted overflow-hidden sm:self-stretch group">
                                                {booking.car.image_path && !carImageError ? (
                                                    <img
                                                        src={carImageSrc ?? ''}
                                                        alt={`${booking.car.brand} ${booking.car.model}`}
                                                        loading="lazy"
                                                        onError={() => setCarImageError(true)}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`w-full h-full ${carColorClass(booking.car.color)} flex items-center justify-center`}>
                                                        <Car className="w-10 h-10 text-white/30" />
                                                    </div>
                                                )}
                                                {carImageSrc && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setZoomImage(carImageSrc)}
                                                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors cursor-zoom-in"
                                                        aria-label="Zoom vehicle image"
                                                        title="Click to zoom"
                                                    >
                                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ZoomIn className="w-4 h-4" />
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                        <Badge variant="outline" className="text-[10px] h-5">{booking.car.year}</Badge>
                                                        {booking.car.color && (
                                                            <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                                                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${carColorClass(booking.car.color)}`} />
                                                                {booking.car.color}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-foreground leading-tight">
                                                        {booking.car.brand} <span className="font-normal text-muted-foreground">{booking.car.model}</span>
                                                    </h3>
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted mt-1.5">
                                                        <Hash className="w-3 h-3 text-muted-foreground" />
                                                        <span className="text-xs font-mono text-muted-foreground">{booking.car.license_plate}</span>
                                                    </div>
                                                </div>

                                        <div className="flex items-end justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Daily Rate</p>
                                                <p className="text-lg font-bold text-foreground">
                                                    {formatPrice(booking.car.daily_rate)}
                                                    <span className="text-xs font-medium text-muted-foreground">/day</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">This Rental</p>
                                                <p className="text-lg font-bold text-foreground">{formatPrice(booking.car.daily_rate * days)}</p>
                                                <p className="text-[10px] text-muted-foreground">{formatPrice(booking.car.daily_rate)} × {days} day{days !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>

                                        {(() => {
                                            const primarySpecs = [
                                                { icon: Gauge, label: 'Transmission', value: booking.car.transmission, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
                                                { icon: Fuel, label: 'Fuel Type', value: booking.car.fuel_type, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
                                                { icon: Users, label: 'Seats', value: booking.car.seats ? `${booking.car.seats}` : null, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
                                                { icon: Wind, label: 'A/C', value: booking.car.air_conditioned ? 'Climate Control' : 'Not Available', color: booking.car.air_conditioned ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-muted-foreground bg-muted' },
                                            ];
                                            const moreSpecs = [
                                                { icon: Luggage, label: 'Baggage', value: booking.car.baggage_capacity !== null ? `${booking.car.baggage_capacity} bags` : null, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30' },
                                                { icon: Car, label: 'Doors', value: booking.car.vehicle_doors ? `${booking.car.vehicle_doors}` : null, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
                                                { icon: Gauge, label: 'Engine', value: booking.car.engine, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30' },
                                                { icon: Search, label: 'VIN', value: booking.car.vin, color: 'text-muted-foreground bg-muted' },
                                            ];
                                            return (
                                                <div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                        {primarySpecs.map(spec => <SpecChip key={spec.label} spec={spec} />)}
                                                    </div>
                                                    {showMoreSpecs && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                                            {moreSpecs.map(spec => <SpecChip key={spec.label} spec={spec} />)}
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowMoreSpecs(s => !s)}
                                                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                                                    >
                                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreSpecs ? 'rotate-180' : ''}`} />
                                                        {showMoreSpecs ? 'Less specs' : `More specs (${moreSpecs.length})`}
                                                    </button>
                                                </div>
                                            );
                                        })()}

                                        {booking.car.description && (
                                            <p className="text-sm text-muted-foreground leading-relaxed italic pt-2 border-t">
                                                &ldquo;{booking.car.description}&rdquo;
                                            </p>
                                        )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                ) : (
                                <Card className="p-4">
                                    <p className="text-sm text-muted-foreground">Vehicle details unavailable.</p>
                                </Card>
                                )}

                            </div>

                            {/* Payments tile */}
                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Banknote className="w-3.5 h-3.5" />
                                        Payments
                                    </p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Total Paid</span>
                                        <span className="text-sm font-bold text-foreground">{formatPrice(totalPaid)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Remaining</span>
                                        {isFullyRefunded ? (
                                            <Badge variant="payment_refunded" className="text-xs font-bold">Fully Refunded</Badge>
                                        ) : remainingBalance > 0 ? (
                                            <Badge variant="destructive" className="text-xs font-bold">{formatPrice(remainingBalance)}</Badge>
                                        ) : (
                                            <span className="text-sm font-bold text-emerald-600">{formatPrice(remainingBalance)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${paymentPercent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                style={{ width: `${paymentPercent}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">{paymentPercent}% paid</p>
                                    </div>
                                    <div className="border-t border-border pt-2 space-y-1.5">
                                        {hasSwaps && rentalSegments ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                                                    <span className="font-normal text-muted-foreground">Rental</span>
                                                    <span className="font-medium text-foreground">{formatPrice(rentalSubtotal)}</span>
                                                </div>
                                                {rentalSegments.map((seg, i) => {
                                                    const isDelta = i > 0;
                                                    return (
                                                        <div key={i} className="pl-3">
                                                            <div className="flex items-center justify-between gap-2 text-[11px]">
                                                                <span className={`truncate ${isDelta ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                                    {isDelta && <span className="mr-1 text-[9px] font-bold uppercase tracking-wider text-accent-600">Swap</span>}
                                                                    {seg.car ? `${seg.car.brand} ${seg.car.model}` : 'Vehicle'} &middot; {seg.days}d
                                                                </span>
                                                                <span className={`shrink-0 font-medium tabular-nums ${isDelta ? 'text-accent-600' : 'text-muted-foreground'}`}>
                                                                    {isDelta && seg.subtotal >= 0 ? '+' : ''}{formatPrice(seg.subtotal)}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground/70 pl-0">
                                                                {formatPrice(seg.daily_rate)}/day &times; {seg.days} day{seg.days !== 1 ? 's' : ''}
                                                                {isDelta && seg.car && rentalSegments[0]?.car
                                                                    ? ` · ${formatPrice(seg.car.daily_rate)} − ${formatPrice(rentalSegments[0].car.daily_rate)}`
                                                                    : ''}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                                <p className="text-[10px] text-muted-foreground/70 pl-3">
                                                    Original rental unchanged; only the daily-rate difference applies from the swap time onward.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Rental &middot; {days}d</span>
                                                <span className="font-medium text-foreground">{formatPrice(rentalSubtotal)}</span>
                                            </div>
                                        )}
                                        {taxLines.length > 0 && (
                                            <div className="space-y-1">
                                                {taxLines.map((t, i) => (
                                                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                                        <span className="text-muted-foreground truncate">{t.desc}</span>
                                                        <span className={`shrink-0 font-medium tabular-nums ${t.amount < 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                                                            {t.amount < 0 ? '-' : '+'}{formatPrice(Math.abs(t.amount))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {handoverChargesTotal > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Handover charges</span>
                                                <span className="font-medium text-foreground">{formatPrice(handoverChargesTotal)}</span>
                                            </div>
                                        )}
                                        {booking.coupon_usage && couponDiscount > 0 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-emerald-600 font-medium">Coupon ({booking.coupon_usage.code})</span>
                                                <span className="text-emerald-600 font-medium">-{formatPrice(couponDiscount)}</span>
                                            </div>
                                        )}
                                        {Math.abs(adjustments) >= 0.01 && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Adjustments</span>
                                                <span className={adjustments < 0 ? 'font-medium text-emerald-600' : 'font-medium text-foreground'}>
                                                    {adjustments < 0 ? '-' : '+'}{formatPrice(Math.abs(adjustments))}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm border-t border-border pt-1.5">
                                            <span className="font-semibold text-foreground">Total</span>
                                            <span className="text-base font-bold text-foreground">{formatPrice(totalAmount)}</span>
                                        </div>
                                    </div>
                                    {booking.payments && booking.payments.length > 0 && (
                                        <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                            {sortPaymentsNewest(booking.payments).slice(0, 3).map(p => (
                                                <PaymentItem
                                                    key={p.id}
                                                    payment={p}
                                                    onEdit={remainingBalance > 0 || (p.type === 'refund' && !isFullyRefunded) ? () => openEditPayment(p) : undefined}
                                                />
                                            ))}
                                            {booking.payments.length > 3 && (
                                                <p className="text-[10px] text-muted-foreground">+{booking.payments.length - 3} more</p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Activity timeline — under payments when no extensions */}
                            {!hasExtension && activityTimeline}

                            {/* Period tile */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pickup</p>
                                            <p className="text-sm font-bold text-foreground">{start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                            <p className="text-xs text-muted-foreground">{formatTime(booking.pickup_time)}</p>
                                            {booking.pickup_location?.location && (
                                                <p className="mt-1 text-[11px] font-medium text-primary flex items-center gap-1 truncate" title={booking.pickup_location.location}>
                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                    {booking.pickup_location.location}
                                                </p>
                                            )}
                                            {booking.pickup_handover?.captured_at && (
                                                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Checked out {formatHandoverTime(booking.pickup_handover.captured_at)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center shrink-0 px-2">
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-[10px] font-bold text-muted-foreground">{days}d</span>
                                        </div>
                                        <div className="flex-1 min-w-0 text-right">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Return</p>
                                            <p className="text-sm font-bold text-foreground">{end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                            <p className="text-xs text-muted-foreground">{formatTime(booking.return_time)}</p>
                                            {booking.return_location?.location && (
                                                <p className="mt-1 text-[11px] font-medium text-primary flex items-center justify-end gap-1 truncate" title={booking.return_location.location}>
                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                    {booking.return_location.location}
                                                </p>
                                            )}
                                            {booking.return_handover?.captured_at && (
                                                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Checked in {formatHandoverTime(booking.return_handover.captured_at)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Customer tile */}
                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                            {initials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-foreground truncate">{customerName}</p>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 mt-0.5">
                                                {booking.user ? 'Registered' : 'Guest'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                                            <Mail className="w-3.5 h-3.5 shrink-0" />
                                            <a href={`mailto:${customerEmail}`} className="truncate hover:text-foreground transition-colors">{customerEmail}</a>
                                        </div>
                                        {customerPhone && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                                <a href={`tel:${customerPhone}`} className="hover:text-foreground transition-colors">{customerPhone}</a>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Related tile */}
                            {(extensionSource || extensionChildren.length > 0) && (
                                <Card>
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                            Related Reservations
                                        </p>
                                        {extensionSource && (
                                            <Link href={route('admin.bookings.show', extensionSource.id)} className="flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                                                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">From</span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-xs font-bold text-foreground truncate">#{extensionSource.reference_code}</span>
                                                    <span className="block text-[10px] text-muted-foreground truncate">{extensionSource.car?.brand} {extensionSource.car?.model}</span>
                                                </span>
                                                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(extensionSource.status)}`} />
                                            </Link>
                                        )}
                                        {extensionChildren.map(child => (
                                            <Link key={child.id} href={route('admin.bookings.show', child.id)} className="flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                                                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">To</span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-xs font-bold text-foreground truncate">#{child.reference_code}</span>
                                                    <span className="block text-[10px] text-muted-foreground truncate">{child.car?.brand} {child.car?.model}{child.car?.license_plate ? ` · ${child.car.license_plate}` : ''}</span>
                                                </span>
                                                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(child.status)}`} />
                                            </Link>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Activity timeline — below extension details */}
                            {hasExtension && activityTimeline}

                            {/* Handover tile */}
                            <div className="xl:col-span-2">
                            {/* Vehicle Handover */}
                            {(booking.pickup_handover || booking.return_handover) && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <Fuel className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <CardTitle>Vehicle Handover</CardTitle>
                                                <CardDescription>Fuel and mileage readings at pickup and return</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-lg border p-4 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                        <Fuel className="w-3.5 h-3.5 text-amber-500" /> Pickup
                                                    </p>
                                                        {booking.pickup_handover?.captured_at && (
                                                            <span className="text-[10px] text-muted-foreground">{formatDateTime(booking.pickup_handover.captured_at)}</span>
                                                        )}
                                                    </div>
                                                {booking.pickup_handover ? (
                                                    <>
                                                        <div>
                                                            <p className="text-[10px] font-medium text-muted-foreground mb-1">Fuel Level</p>
                                                            <FuelBar level={booking.pickup_handover.fuel_level} tone="emerald" />
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-muted-foreground">Odometer</span>
                                                            <span className="font-semibold font-mono text-foreground">{formatOdometer(booking.pickup_handover.odometer)}</span>
                                                        </div>
                                                        {booking.pickup_handover.notes && (
                                                            <p className="text-xs text-muted-foreground italic">{booking.pickup_handover.notes}</p>
                                                        )}
                                                         {booking.pickup_handover.damages && booking.pickup_handover.damages.length > 0 && (
                                                             <div className="pt-2 border-t">
                                                                <p className="text-[10px] font-medium text-muted-foreground mb-1">
                                                                    Damage ({booking.pickup_handover.damages.length})
                                                                </p>
                                                                <div className="print:hidden">
                                                                    <VehicleDamageMap
                                                                        damages={booking.pickup_handover.damages}
                                                                        readOnly
                                                                        variant="existing"
                                                                        vehicleType={booking.car.vehicle_type}
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                                <div className="hidden print:block">
                                                                    <PrintDamageSummary
                                                                        damages={booking.pickup_handover.damages}
                                                                        variant="existing"
                                                                        vehicleType={booking.car.vehicle_type}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">Not recorded</p>
                                                )}
                                            </div>
                                            <div className="rounded-lg border p-4 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                        <Fuel className="w-3.5 h-3.5 text-emerald-500" /> Return
                                                    </p>
                                                        {booking.return_handover?.captured_at && (
                                                            <span className="text-[10px] text-muted-foreground">{formatDateTime(booking.return_handover.captured_at)}</span>
                                                        )}
                                                    </div>
                                                {booking.return_handover ? (
                                                    <>
                                                        <div>
                                                            <p className="text-[10px] font-medium text-muted-foreground mb-1">Fuel Level</p>
                                                            <FuelBar level={booking.return_handover.fuel_level} tone="amber" />
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-muted-foreground">Odometer</span>
                                                            <span className="font-semibold font-mono text-foreground">{formatOdometer(booking.return_handover.odometer)}</span>
                                                        </div>
                                                        {booking.return_handover.notes && (
                                                            <p className="text-xs text-muted-foreground italic">{booking.return_handover.notes}</p>
                                                        )}
                                                         {booking.return_handover.damages && booking.return_handover.damages.length > 0 && (
                                                             <div className="pt-2 border-t">
                                                                <p className="text-[10px] font-medium text-muted-foreground mb-1">
                                                                    Damage ({booking.return_handover.damages.length})
                                                                </p>
                                                                <div className="print:hidden">
                                                                    <VehicleDamageMap
                                                                        damages={booking.return_handover.damages}
                                                                        readOnly
                                                                        variant="new"
                                                                        vehicleType={booking.car.vehicle_type}
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                                <div className="hidden print:block">
                                                                    <PrintDamageSummary
                                                                        damages={booking.return_handover.damages}
                                                                        variant="new"
                                                                        vehicleType={booking.car.vehicle_type}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">Not recorded</p>
                                                )}
                                            </div>
                                        </div>
                                        {(booking.handover_charges && booking.handover_charges.total > 0) || (booking.extra_charges ?? []).length > 0 ? (
                                            <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Charges</p>
                                                {booking.handover_charges && booking.handover_charges.fuel_refuel > 0 && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Fuel refueling</span>
                                                        <span className="font-semibold text-foreground">{formatPrice(booking.handover_charges.fuel_refuel)}</span>
                                                    </div>
                                                )}
                                                {booking.handover_charges && booking.handover_charges.excess_mileage > 0 && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Excess mileage ({booking.handover_charges.excess_km.toFixed(0)} km)</span>
                                                        <span className="font-semibold text-foreground">{formatPrice(booking.handover_charges.excess_mileage)}</span>
                                                    </div>
                                                )}
                                                {(booking.extra_charges ?? []).map((c) => (
                                                    <div key={c.id} className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">
                                                            {c.name}
                                                            {Number(c.tax_amount) > 0 && <span className="text-[10px] text-muted-foreground/70"> incl. tax</span>}
                                                        </span>
                                                        <span className="font-semibold text-foreground">{c.operator === '-' ? '-' : ''}{formatPrice(Number(c.amount) + Number(c.tax_amount))}</span>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-between text-sm border-t pt-1.5">
                                                    <span className="font-medium text-foreground">Total charges</span>
                                                    <span className="font-bold text-foreground">{formatPrice(handoverChargesTotal + extraChargesTotal)}</span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            )}
                            </div>

                            {/* Vehicle swaps history */}
                            {(booking.swaps ?? []).length > 0 && (
                                <div className="md:col-span-2 xl:col-span-3">
                                    <Card>
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <ArrowRightLeft className="w-4 h-4 text-violet-500" />
                                                Vehicle Swaps
                                            </CardTitle>
                                            <CardDescription>Mid-rental vehicle changes for this reservation.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-2">
                                            {(booking.swaps ?? []).map((swap, i) => (
                                                <div key={swap.id} className="rounded-xl border border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30 p-3">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="min-w-0 flex-1 font-semibold text-foreground truncate">
                                                            {swap.from_car ? `${swap.from_car.brand} ${swap.from_car.model}` : 'Unknown'}
                                                        </span>
                                                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Swap #{i + 1}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span className="shrink-0 text-muted-foreground">{swap.from_days}d</span>
                                                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="shrink-0 text-muted-foreground">{swap.to_days}d</span>
                                                        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                                                            {swap.to_car ? `${swap.to_car.brand} ${swap.to_car.model}` : 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
                                                        <span className="text-muted-foreground">On {formatDate(swap.swap_date)}</span>
                                                        <span className={Number(swap.price_delta) < 0 ? 'font-semibold text-emerald-600' : Number(swap.price_delta) > 0 ? 'font-semibold text-destructive' : 'font-semibold text-muted-foreground'}>
                                                            {Number(swap.price_delta) < 0 ? '-' : Number(swap.price_delta) > 0 ? '+' : ''}{formatPrice(Math.abs(Number(swap.price_delta)))}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="rounded-xl border border-dashed border-surface-200 dark:border-surface-700 p-3 flex items-center justify-between gap-2 text-xs">
                                                <span className="text-muted-foreground">Current total</span>
                                                <span className="font-bold text-foreground">{formatPrice(totalAmount)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Notes tile */}
                            <div className="xl:col-span-3">
                            {booking.notes && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <CardTitle>Notes</CardTitle>
                                                <CardDescription>Additional booking information</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="p-4 bg-muted/30 rounded-lg border">
                                            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{booking.notes}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            </div>

                            {/* Footer */}
                            <div className="xl:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 mt-4 border-t">
                                <Link
                                    href={route('admin.reservations.index')}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Reservations
                                </Link>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-muted-foreground">
                                        Created {formatDateTime(booking.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                            {/* Sheets */}
                            <RecordPaymentSheet
                                booking={booking}
                                open={showPaymentSheet}
                                onOpenChange={setShowPaymentSheet}
                                onEditPayment={p => openEditPayment(p, true)}
                                hideTrigger
                            />
                            <EditPaymentSheet
                                booking={booking}
                                editingPayment={editingPayment}
                                onOpenChange={open => {
                                    if (!open) setEditingPayment(null);
                                }}
                            />

                            {/* Floating action dock */}
                            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50">
                                <div className="flex items-center gap-1 rounded-full border border-surface-200 dark:border-surface-700 bg-white/95 dark:bg-brand-900/95 backdrop-blur-md p-1.5 shadow-2xl shadow-black/10 ring-1 ring-black/5">
                                    {/* Primary action */}
                                    {booking.status === 'pending' && (
                                        <Button size="sm" className="h-8 rounded-full px-4 bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition" onClick={() => setStatusOpen(true)} title="Confirm booking & record downpayment">
                                            <BadgeCheck className="w-4 h-4 mr-1" />
                                            Confirm
                                        </Button>
                                    )}
                                    {booking.status === 'confirmed' && (
                                        <Link href={route('admin.bookings.checkout', booking.id)}>
                                            <Button size="sm" className="h-8 rounded-full px-4 bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition">
                                                <Car className="w-4 h-4 mr-1" />
                                                Check Out
                                            </Button>
                                        </Link>
                                    )}
                                    {booking.status === 'active' && (
                                        <CheckinVehicleSheet booking={booking} extraCharges={extraCharges} triggerClassName="h-8 rounded-full px-4 shadow-md shadow-primary/25 active:scale-95 transition" />
                                    )}
                                    {isClosed && (
                                        <Link href={route('admin.bookings.invoice', booking.id)}>
                                            <Button size="sm" variant="ghost" className="h-8 rounded-full px-4">
                                                <Printer className="w-4 h-4 mr-1" />
                                                Invoice
                                            </Button>
                                        </Link>
                                    )}

                                    {(showPayment || showStatus || hasMoreActions) && (
                                        <Separator orientation="vertical" className="mx-0.5 h-6" />
                                    )}

                                    {/* Secondary icon actions */}
                                    {showPayment && (
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full active:scale-95 transition" onClick={() => setShowPaymentSheet(true)} title="Record payment">
                                            <Banknote className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {showStatus && (
                                        <Popover open={statusOpen} onOpenChange={handleStatusOpenChange}>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full active:scale-95 transition" title="Update status">
                                                    <BadgeCheck className="w-4 h-4" />
                                                    <span className={`absolute top-0.5 right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-brand-900 ${statusDotClass(booking.status)}`} />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="end" className="w-[320px] p-4" sideOffset={12}>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">Update Status</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Current: {statusOptions().find(o => o.value === booking.status)?.label ?? booking.status}
                                                        </p>
                                                    </div>
                                                    <form onSubmit={updateStatus} className="space-y-3">
                                                        <div>
                                                            <Label className="text-xs font-medium">New Status</Label>
                                                            <Select
                                                                value={form.data.status}
                                                                onValueChange={v => {
                                                                    form.setData('status', v);
                                                                    if (v !== 'cancelled') setConfirmCancel(false);
                                                                }}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {popoverStatusOptions.map(o => (
                                                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Check-out and check-in are handled from the dock buttons.
                                                        </p>
                                                        {booking.status === 'pending' && form.data.status === 'confirmed' && (
                                                            <div>
                                                                <Label className="text-xs font-medium">
                                                                    Downpayment <span className="text-destructive">*</span>
                                                                </Label>
                                                                <div className="relative mt-1">
                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                        <span className="text-muted-foreground text-sm">$</span>
                                                                    </div>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0.01"
                                                                        max={booking.total_amount}
                                                                        value={form.data.downpayment_amount}
                                                                        onChange={e => form.setData('downpayment_amount', e.target.value)}
                                                                        placeholder="0.00"
                                                                        className="pl-7 h-8 text-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {form.data.status === 'cancelled' && confirmCancel && (
                                                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                                                                <p className="text-xs font-semibold text-destructive">Cancel this booking?</p>
                                                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                    The booking will be permanently cancelled. Any refunds or adjustments must be handled separately.
                                                                </p>
                                                                <div className="flex gap-2 pt-1">
                                                                    <Button type="button" variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => setConfirmCancel(false)}>Go back</Button>
                                                                    <Button type="submit" variant="destructive" size="sm" className="flex-1 h-8 text-xs" disabled={form.processing}>Confirm cancellation</Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!confirmCancel && (
                                                            <div className="flex gap-2 pt-1">
                                                                <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleStatusOpenChange(false)}>Cancel</Button>
                                                                <Button type="submit" size="sm" className="flex-1 h-8 text-xs" disabled={form.processing}>{form.processing ? 'Saving...' : 'Update'}</Button>
                                                            </div>
                                                        )}
                                                    </form>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}

                                    {/* Overflow menu */}
                                    {hasMoreActions && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full active:scale-95 transition" title="More actions">
                                                    <EllipsisVertical className="w-4 h-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="end" className="w-52 p-1.5" sideOffset={12}>
                                                <div className="flex flex-col gap-0.5">
                                                    {canModify && (
                                                        <Link href={route('admin.bookings.edit', booking.id)}>
                                                            <Button variant="ghost" className="w-full justify-start h-9 text-sm rounded-lg">
                                                                <PenLine className="w-4 h-4 mr-2" />
                                                                Modify booking
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {canExtend && (
                                                        <Link href={route('admin.bookings.extend.page', booking.id)}>
                                                            <Button variant="ghost" className="w-full justify-start h-9 text-sm rounded-lg">
                                                                <CalendarPlus className="w-4 h-4 mr-2" />
                                                                Extend rental
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {canExtend && (
                                                        <Link href={route('admin.bookings.swap.page', booking.id)}>
                                                            <Button variant="ghost" className="w-full justify-start h-9 text-sm rounded-lg">
                                                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                                                Swap vehicle
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {!isClosed && <Separator className="my-1" />}
                                                    {!isClosed && (
                                                        <Link href={route('admin.bookings.invoice', booking.id)}>
                                                            <Button variant="ghost" className="w-full justify-start h-9 text-sm rounded-lg">
                                                                <Printer className="w-4 h-4 mr-2" />
                                                                View invoice
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            {/* Image lightbox */}
                            <ImageLightbox
                                src={zoomImage ?? ''}
                                alt={`${booking.car?.brand ?? ''} ${booking.car?.model ?? ''}`.trim() || 'Vehicle image'}
                                open={!!zoomImage}
                                onClose={() => setZoomImage(null)}
                            />
                    </div>
            </AuthenticatedLayout>
        </>
    );
}
