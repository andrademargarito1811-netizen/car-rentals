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
} from 'lucide-react';
import CheckinVehicleSheet from './CheckinVehicleSheet';
import RecordPaymentSheet from './RecordPaymentSheet';
import EditPaymentSheet from './EditPaymentSheet';
import { PaymentItem, formatPrice, sortPaymentsNewest } from './PaymentItem';
import type { AdminBooking, BookingPayment } from './types';

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

    const rentalSubtotal = Number(booking.car?.daily_rate ?? 0) * days;
    const handoverChargesTotal = Number(booking.handover_charges?.total ?? 0);
    const extraChargesTotal = (booking.extra_charges ?? []).reduce((sum, c) => {
        const amt = Number(c.amount) + Number(c.tax_amount);
        return sum + (c.operator === '-' ? -amt : amt);
    }, 0);
    const couponDiscount = Number(booking.coupon_usage?.discount_amount ?? 0);
    const otherCharges = Math.max(0, totalAmount - rentalSubtotal - handoverChargesTotal - extraChargesTotal - couponDiscount);
    const paymentPercent = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;
    const statusIndex = BOOKING_STATUS_FLOW.findIndex(s => s.value === booking.status);

    const customerName = getCustomerName(booking);
    const customerEmail = getCustomerEmail(booking);
    const customerPhone = getCustomerPhone(booking);
    const initials = getInitials(customerName);
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);

    return (
        <>
            <Head title={`Booking #${booking.reference_code ?? booking.id}`} />

            <AuthenticatedLayout
                header={
                    <div className="border-b border-border bg-gradient-to-b from-muted/30 to-background">
                        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                <Link href={route('admin.reservations.index')} className="hover:text-foreground transition-colors">
                                    Reservations
                                </Link>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span className="text-foreground font-medium truncate">
                                    {booking.reference_code ?? `#${String(booking.id).padStart(4, '0')}`}
                                </span>
                            </nav>
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                                        <Clipboard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Booking Reference</p>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                                {booking.reference_code ?? `#${String(booking.id).padStart(4, '0')}`}
                                            </h2>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                onClick={copyBookingId}
                                                title="Copy booking ID"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {customerName}
                                            </span>
                                            <span className="text-muted-foreground/40">|</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatRelativeDate(booking.created_at)}
                                    </span>
                                    <Badge variant={booking.status as 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'}>
                                        {statusOptions().find(o => o.value === booking.status)?.label ?? booking.status}
                                    </Badge>
                                    {isFullyRefunded && (
                                        <Badge variant="payment_refunded">Fully Refunded</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-screen-2xl mx-auto">
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

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Duration</p>
                                <p className="text-xl font-bold text-foreground">{days} day{days !== 1 ? 's' : ''}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Period</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Total</p>
                                <p className="text-xl font-bold text-foreground">{formatPrice(booking.total_amount)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar + Main Content */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Sidebar */}
                        <div className="w-full lg:w-80 shrink-0 space-y-6">
                            <div className="lg:sticky lg:top-6 space-y-6">
                                {/* Unified Sidebar Card */}
                                <Card>
                                    {/* Customer Section */}
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-3 mb-3">
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
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{customerEmail}</span>
                                            </div>
                                            {customerPhone && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Phone className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{customerPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                        {(booking.user?.address || booking.guest?.address) && (
                                            <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                                <span>
                                                    {booking.user
                                                        ? booking.user.address
                                                        : [
                                                            booking.guest?.address,
                                                            booking.guest?.address2,
                                                            booking.guest?.city,
                                                            booking.guest?.state,
                                                            booking.guest?.postal_code,
                                                            booking.guest?.country,
                                                        ].filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                        )}
                                        {booking.guest?.driver_age && (
                                            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                <User className="w-3 h-3 shrink-0" />
                                                <span>Driver age: {booking.guest.driver_age}</span>
                                            </div>
                                        )}
                                        {booking.guest?.flight_no && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-mono text-[10px]">✈</span>
                                                <span>Flight: {booking.guest.flight_no}</span>
                                            </div>
                                        )}
                                        {booking.guest?.company_name && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Building2 className="w-3 h-3 shrink-0" />
                                                <span>Company: {booking.guest.company_name}</span>
                                            </div>
                                        )}
                                    </CardContent>

                                    <Separator />

                                    {/* Booking Summary */}
                                    <CardContent className="p-5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Booking Summary</p>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Rental &middot; {days} day{days !== 1 ? 's' : ''}</span>
                                                <span className="font-medium text-foreground">{formatPrice(rentalSubtotal)}</span>
                                            </div>
                                            {handoverChargesTotal > 0 && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Handover charges</span>
                                                    <span className="font-medium text-foreground">{formatPrice(handoverChargesTotal)}</span>
                                                </div>
                                            )}
                                            {(booking.extra_charges ?? []).map((c) => (
                                                <div key={c.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{c.name}</span>
                                                    <span className="font-medium text-foreground">{c.operator === '-' ? '-' : ''}{formatPrice(Number(c.amount) + Number(c.tax_amount))}</span>
                                                </div>
                                            ))}
                                            {booking.coupon_usage && couponDiscount > 0 && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-emerald-600 font-medium">Coupon ({booking.coupon_usage.code})</span>
                                                    <span className="text-emerald-600 font-medium">-{formatPrice(couponDiscount)}</span>
                                                </div>
                                            )}
                                            {otherCharges > 0 && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Taxes &amp; fees</span>
                                                    <span className="font-medium text-foreground">{formatPrice(otherCharges)}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between border-t pt-1.5">
                                                <span className="text-sm font-semibold text-foreground">Total</span>
                                                <span className="text-base font-bold text-foreground">{formatPrice(totalAmount)}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatDate(booking.start_date)} {formatTime(booking.pickup_time)} &mdash; {formatDate(booking.end_date)} {formatTime(booking.return_time)}
                                        </p>
                                    </CardContent>

                                    <Separator />

                                    {/* Payment Summary */}
                                    <CardContent className="p-5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payments</p>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm text-muted-foreground">Total Paid</span>
                                            <span className="text-sm font-bold text-foreground">{formatPrice(totalPaid)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">Remaining</span>
                                            {isFullyRefunded ? (
                                                <Badge variant="payment_refunded" className="text-xs font-bold">Fully Refunded</Badge>
                                            ) : remainingBalance > 0 ? (
                                                <Badge variant="destructive" className="text-xs font-bold">
                                                    {formatPrice(remainingBalance)}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm font-bold text-emerald-600">
                                                    {formatPrice(remainingBalance)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${paymentPercent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                    style={{ width: `${paymentPercent}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">{paymentPercent}% paid</p>
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

                                    <Separator />

                                    {/* Quick Actions */}
                                    <CardContent className="p-5 space-y-2">
                                        <RecordPaymentSheet
                                            booking={booking}
                                            open={showPaymentSheet}
                                            onOpenChange={setShowPaymentSheet}
                                            onEditPayment={p => openEditPayment(p, true)}
                                        />

                                        {booking.status === 'confirmed' && (
                                            <Link href={route('admin.bookings.checkout', booking.id)} className="block">
                                                <Button variant="default" className="w-full">
                                                    <Car className="w-4 h-4 mr-1.5" />
                                                    Check-out Vehicle
                                                </Button>
                                            </Link>
                                        )}

                                        {booking.status === 'active' && (
                                            <CheckinVehicleSheet booking={booking} extraCharges={extraCharges} />
                                        )}

                                        {['completed', 'cancelled'].includes(booking.status) ? (
                                            <Button variant="outline" className="w-full" disabled>
                                                <BadgeCheck className="w-4 h-4 mr-1.5" />
                                                Update Status
                                            </Button>
                                        ) : (
                                        <Popover open={statusOpen} onOpenChange={handleStatusOpenChange}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full">
                                                    <BadgeCheck className="w-4 h-4 mr-1.5" />
                                                    Update Status
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="end" className="w-[320px] p-4" sideOffset={8}>
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
                                                            Check-out and check-in are handled from the vehicle handover buttons.
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
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="flex-1 h-8 text-xs"
                                                                        onClick={() => setConfirmCancel(false)}
                                                                    >
                                                                        Go back
                                                                    </Button>
                                                                    <Button
                                                                        type="submit"
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        className="flex-1 h-8 text-xs"
                                                                        disabled={form.processing}
                                                                    >
                                                                        Confirm cancellation
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!confirmCancel && (
                                                            <div className="flex gap-2 pt-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex-1 h-8 text-xs"
                                                                    onClick={() => handleStatusOpenChange(false)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    className="flex-1 h-8 text-xs"
                                                                    disabled={form.processing}
                                                                >
                                                                    {form.processing ? 'Saving...' : 'Update'}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </form>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        )}

                                        {['pending', 'confirmed'].includes(booking.status) && (
                                            <Link
                                                href={route('admin.bookings.edit', booking.id)}
                                                className="block"
                                            >
                                                <Button variant="ghost" className="w-full">
                                                    <PenLine className="w-4 h-4 mr-1.5" />
                                                    Modify Booking
                                                </Button>
                                            </Link>
                                        )}

                                        <Link href={route('admin.bookings.invoice', booking.id)} className="block">
                                            <Button variant="outline" className="w-full">
                                                <Printer className="w-4 h-4 mr-1.5" />
                                                View Invoice
                                            </Button>
                                        </Link>

                                    </CardContent>

                                    {/* Edit Payment Sheet */}
                                    <EditPaymentSheet
                                        booking={booking}
                                        editingPayment={editingPayment}
                                        onOpenChange={open => {
                                            if (!open) setEditingPayment(null);
                                        }}
                                    />
                                </Card>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0 space-y-4">
                            {/* Vehicle Section */}
                            {booking.car ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left — Hero Card */}
                                <Card className="overflow-hidden h-full">
                                    <div className="relative h-44 sm:h-52 bg-muted">
                                        {booking.car.image_path && !carImageError ? (
                                            <img
                                                src={`/storage/${booking.car.image_path}`}
                                                alt={`${booking.car.brand} ${booking.car.model}`}
                                                loading="lazy"
                                                onError={() => setCarImageError(true)}
                                                className="w-full h-full object-contain p-4"
                                            />
                                        ) : (
                                            <div className={`w-full h-full ${carColorClass(booking.car.color)} flex items-center justify-center`}>
                                                <Car className="w-12 h-12 text-white/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
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
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-muted-foreground">Daily Rate</p>
                                                <p className="text-2xl font-bold text-foreground">{formatPrice(booking.car.daily_rate)}</p>
                                                <p className="text-xs text-muted-foreground">per day</p>
                                            </div>
                                        </div>
                                        {booking.car.description && (
                                            <div className="pt-2 border-t">
                                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                                    &ldquo;{booking.car.description}&rdquo;
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Right — Specs Card */}
                                <Card className="p-4 h-full">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Specifications</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { icon: Gauge, label: 'Transmission', value: booking.car.transmission, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
                                            { icon: Fuel, label: 'Fuel Type', value: booking.car.fuel_type, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
                                            { icon: Users, label: 'Seats', value: booking.car.seats ? `${booking.car.seats}` : null, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
                                            { icon: Luggage, label: 'Baggage', value: booking.car.baggage_capacity !== null ? `${booking.car.baggage_capacity} bags` : null, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30' },
                                            { icon: Car, label: 'Doors', value: booking.car.vehicle_doors ? `${booking.car.vehicle_doors}` : null, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
                                            { icon: Wind, label: 'A/C', value: booking.car.air_conditioned ? 'Climate Control' : 'Not Available', color: booking.car.air_conditioned ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-muted-foreground bg-muted' },
                                            { icon: Gauge, label: 'Engine', value: booking.car.engine, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30' },
                                            { icon: Search, label: 'VIN', value: booking.car.vin, color: 'text-muted-foreground bg-muted' },
                                        ].map((spec, i) => {
                                            const hasValue = spec.value !== null && spec.value !== undefined;
                                            return (
                                                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${spec.color}`}>
                                                        <spec.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-medium text-muted-foreground">{spec.label}</p>
                                                        <p className={`text-xs font-semibold font-mono truncate ${hasValue ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                                                            {hasValue ? spec.value : '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                            ) : (
                            <Card className="p-4">
                                <p className="text-sm text-muted-foreground">Vehicle details unavailable.</p>
                            </Card>
                            )}

                            {/* Period Section */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle>Booking Period</CardTitle>
                                            <CardDescription>{days} day{days !== 1 ? 's' : ''}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 sm:gap-8">
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                {start.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </p>
                                            <p className="text-3xl font-bold text-foreground leading-tight mt-1">
                                                {start.getDate()}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs font-mono text-muted-foreground mt-1.5">
                                                {formatTime(booking.pickup_time)}
                                            </p>
                                        </div>
                                        <div className="flex-1 flex items-center">
                                            <div className="h-px flex-1 bg-border" />
                                            <div className="flex flex-col items-center mx-2">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-medium text-muted-foreground mt-1">{days} day{days !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                {end.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </p>
                                            <p className="text-3xl font-bold text-foreground leading-tight mt-1">
                                                {end.getDate()}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs font-mono text-muted-foreground mt-1.5">
                                                {formatTime(booking.return_time)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

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

                            {/* Notes Section */}
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

                            {/* Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 mt-4 border-t">
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
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
