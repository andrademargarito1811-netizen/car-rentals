import { useState } from 'react';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/Components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/Components/ui/popover';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Calendar,
  Clipboard,
  Copy,
  Check,
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
  DollarSign,
} from 'lucide-react';

interface AdminBookingsShowProps {
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
        user: { id: number; name: string; email: string; phone: string | null; address: string | null; created_at: string } | null;
        guest: { guest_id: number; title: string | null; first_name: string; last_name: string; email: string; phone: string | null; address: string | null; address2: string | null; country: string | null; state: string | null; city: string | null; postal_code: string | null; driver_age: number | null; flight_no: string | null } | null;
        car: {
            id: number;
            brand: string;
            model: string;
            year: number;
            license_plate: string;
            daily_rate: number;
            color: string | null;
            transmission: string;
            fuel_type: string;
            seats: number | null;
            vehicle_doors: number | null;
            image_path: string | null;
            air_conditioned: boolean;
            engine: string | null;
            baggage_capacity: number | null;
            description: string | null;
            vin: string | null;
        };
        payment: { id: string; type: string; amount: number; payment_method: string; payment_status: string; transaction_id: string | null } | null;
        payments: { id: string; type: string; amount: number; payment_method: string; payment_status: string; transaction_id: string | null; created_at: string }[];
        created_at: string;
    };
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
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return formatDate(date);
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function getDaysDifference(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
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

function paymentTypeLabel(type: string): string {
    const labels: Record<string, string> = { downpayment: 'Down Payment', remaining: 'Remaining', full_payment: 'Full Payment' };
    return labels[type] ?? type;
}

export default function AdminBookingsShow({ booking }: AdminBookingsShowProps) {
    const route = useRoute();
    const form = useForm({ status: booking.status, downpayment_amount: '', payment_method: 'Manual', amount: '' });
    const paymentForm = useForm({ amount: '', payment_method: 'cash', transaction_id: '', type: 'remaining' });

    const [showPaymentSheet, setShowPaymentSheet] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<typeof booking.payments[0] | null>(null);
    const editPaymentForm = useForm({ amount: '', payment_method: 'cash', transaction_id: '' });


    function copyBookingId() {
        navigator.clipboard.writeText(booking.reference_code ?? `#${booking.id}`);
        toast.success('Copied!', { description: booking.reference_code ?? `#${booking.id}` });
    }

    function updateStatus(e: React.FormEvent) {
        e.preventDefault();
        form.patch(route('admin.bookings.status', booking.id), {
            onSuccess: () => {
                form.reset();
                setStatusOpen(false);
                toast.success('Status updated', { description: `Booking is now ${statusOptions().find(o => o.value === form.data.status)?.label ?? form.data.status}` });
            },
        });
    }

    function recordPayment(e: React.FormEvent) {
        e.preventDefault();
        paymentForm.post(route('admin.bookings.payments.store', booking.id), {
            preserveScroll: true,
            onSuccess: () => {
                paymentForm.reset();
                setShowPaymentSheet(false);
                toast.success('Payment recorded', { description: `${paymentTypeLabel(paymentForm.data.type)} of ${formatPrice(Number(paymentForm.data.amount) || 0)}` });
            },
        });
    }

    function updatePayment(e: React.FormEvent) {
        e.preventDefault();
        if (!editingPayment) return;
        editPaymentForm.patch(route('admin.bookings.payments.update', [booking.id, editingPayment.id]), {
            preserveScroll: true,
            onSuccess: () => {
                editPaymentForm.reset();
                setEditingPayment(null);
                toast.success('Payment updated');
            },
        });
    }

    const totalAmount = Number(booking.total_amount) || 0;
    const totalPaid = (booking.payments ?? []).filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = totalAmount - totalPaid;

    const customerName = getCustomerName(booking);
    const customerEmail = getCustomerEmail(booking);
    const customerPhone = getCustomerPhone(booking);
    const initials = getInitials(customerName);
    const days = getDaysDifference(booking.start_date, booking.end_date);
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
                                <Link href={route('admin.bookings.index')} className="hover:text-foreground transition-colors">
                                    Bookings
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
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-screen-2xl mx-auto">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
                                <Badge variant={booking.status as 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'}>
                                    {statusOptions().find(o => o.value === booking.status)?.label ?? booking.status}
                                </Badge>
                            </CardContent>
                        </Card>
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
                                    </CardContent>

                                    <Separator />

                                    {/* Booking Summary */}
                                    <CardContent className="p-5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Booking Summary</p>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Total Amount</span>
                                            <span className="text-lg font-bold text-foreground">{formatPrice(booking.total_amount)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {days} day{days !== 1 ? 's' : ''} &times; {formatPrice(booking.car.daily_rate)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDate(booking.start_date)} {formatTime(booking.pickup_time)} &mdash; {formatDate(booking.end_date)} {formatTime(booking.return_time)}
                                        </p>
                                    </CardContent>

                                    <Separator />

                                    {/* Payment Summary */}
                                    <CardContent className="p-5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payments</p>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">Total Paid</span>
                                            <span className="text-sm font-bold text-foreground">{formatPrice(totalPaid)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-muted-foreground">Remaining</span>
                                            {remainingBalance > 0 ? (
                                                <Badge variant="destructive" className="text-xs font-bold">
                                                    {formatPrice(remainingBalance)}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm font-bold text-emerald-600">
                                                    {formatPrice(remainingBalance)}
                                                </span>
                                            )}
                                        </div>
                                        {booking.payments && booking.payments.length > 0 && (
                                            <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                                {[...booking.payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3).map(p => (
                                                    <div key={p.id} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.payment_status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                            <span className="text-muted-foreground truncate">{paymentTypeLabel(p.type)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                                            <span className="font-medium text-foreground">{formatPrice(p.amount)}</span>
                                                            {remainingBalance > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        editPaymentForm.setData({
                                                                            amount: String(p.amount),
                                                                            payment_method: p.payment_method,
                                                                            transaction_id: p.transaction_id ?? '',
                                                                        });
                                                                        setEditingPayment(p);
                                                                    }}
                                                                    className="text-muted-foreground/40 hover:text-foreground transition-colors"
                                                                    title="Edit payment"
                                                                >
                                                                    <PenLine className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
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
                                        {remainingBalance <= 0 ? (
                                            <Button variant="outline" className="w-full" disabled>
                                                <Check className="w-4 h-4 mr-1.5 text-emerald-500" />
                                                Fully Paid
                                            </Button>
                                        ) : (
                                            <Sheet open={showPaymentSheet} onOpenChange={open => {
                                                setShowPaymentSheet(open);
                                                if (!open) paymentForm.reset();
                                            }}>
                                                <SheetTrigger asChild>
                                                    <Button variant="default" className="w-full">
                                                        <DollarSign className="w-4 h-4 mr-1.5" />
                                                        Record Payment
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent side="right" className="sm:max-w-md flex flex-col">
                                                    <SheetHeader>
                                                        <SheetTitle>Record Payment</SheetTitle>
                                                        <SheetDescription>
                                                            Total: {formatPrice(totalAmount)} &middot; Paid: {formatPrice(totalPaid)} &middot; Remaining: {formatPrice(remainingBalance)}
                                                        </SheetDescription>
                                                    </SheetHeader>

                                                    {/* Progress bar */}
                                                    <div className="mt-4">
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                                            <span>Payment progress</span>
                                                            <span>{totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0}%</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                                style={{ width: `${totalAmount > 0 ? Math.min((totalPaid / totalAmount) * 100, 100) : 0}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                            <span>Paid: {formatPrice(totalPaid)}</span>
                                                            <span>Remaining: {formatPrice(remainingBalance)}</span>
                                                        </div>
                                                    </div>

                                                    <form
                                                        onSubmit={recordPayment}
                                                        onKeyDown={e => {
                                                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                                                e.preventDefault();
                                                                recordPayment(e as any);
                                                            }
                                                        }}
                                                        className="space-y-4 mt-5 flex-1 flex flex-col"
                                                    >
                                                        {/* Type selector */}
                                                        <div>
                                                            <Label className="text-sm font-medium mb-1.5 block">Type</Label>
                                                            <div className="flex gap-1 p-1 bg-muted rounded-lg">
                                                                {[
                                                                    { value: 'downpayment', label: 'Down Payment' },
                                                                    { value: 'remaining', label: 'Remaining' },
                                                                    { value: 'full_payment', label: 'Full Payment' },
                                                                ].map(opt => (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            paymentForm.setData('type', opt.value);
                                                                            if (opt.value === 'remaining') paymentForm.setData('amount', String(remainingBalance > 0 ? remainingBalance : ''));
                                                                            else if (opt.value === 'full_payment') paymentForm.setData('amount', String(totalAmount));
                                                                            else paymentForm.setData('amount', '');
                                                                        }}
                                                                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                                                            paymentForm.data.type === opt.value
                                                                                ? 'bg-background text-foreground shadow-sm'
                                                                                : 'text-muted-foreground hover:text-foreground'
                                                                        }`}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Amount */}
                                                        <div>
                                                            <Label className="text-sm font-medium mb-1.5 block">Amount</Label>
                                                            <div className="flex gap-1.5 mb-2 flex-wrap">
                                                                {paymentForm.data.type === 'remaining' && remainingBalance > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => paymentForm.setData('amount', String(remainingBalance))}
                                                                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                                                            Number(paymentForm.data.amount) === remainingBalance
                                                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                                                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                                                                        }`}
                                                                    >
                                                                        Remaining {formatPrice(remainingBalance)}
                                                                    </button>
                                                                )}
                                                                {paymentForm.data.type === 'full_payment' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => paymentForm.setData('amount', String(totalAmount))}
                                                                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                                                            Number(paymentForm.data.amount) === totalAmount
                                                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                                                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                                                                        }`}
                                                                    >
                                                                        Total {formatPrice(totalAmount)}
                                                                    </button>
                                                                )}
                                                                {paymentForm.data.type === 'downpayment' && (
                                                                    [0.25, 0.5, 0.75].map(fraction => {
                                                                        const val = totalAmount * fraction;
                                                                        return (
                                                                            <button
                                                                                key={fraction}
                                                                                type="button"
                                                                                onClick={() => paymentForm.setData('amount', String(val))}
                                                                                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                                                                    Number(paymentForm.data.amount) === val
                                                                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                                                                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                                                                                }`}
                                                                            >
                                                                                {Math.round(fraction * 100)}% ({formatPrice(val)})
                                                                            </button>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                    <span className="text-muted-foreground text-sm">$</span>
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    value={paymentForm.data.amount}
                                                                    onChange={e => paymentForm.setData('amount', e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="pl-7"
                                                                />
                                                            </div>
                                                            {paymentForm.errors.amount && (
                                                                <p className="mt-1 text-xs text-destructive">{paymentForm.errors.amount}</p>
                                                            )}
                                                        </div>

                                                        {/* Method */}
                                                        <div>
                                                            <Label className="text-sm font-medium mb-1.5 block">Method</Label>
                                                            <Select
                                                                value={paymentForm.data.payment_method}
                                                                onValueChange={v => paymentForm.setData('payment_method', v)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="cash">Cash</SelectItem>
                                                                    <SelectItem value="card">Card</SelectItem>
                                                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                                    <SelectItem value="online">Online</SelectItem>
                                                                    <SelectItem value="other">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Transaction ID */}
                                                        <div>
                                                            <Label className="text-sm font-medium">
                                                                Transaction ID <span className="text-muted-foreground font-normal">(optional)</span>
                                                            </Label>
                                                            <Input
                                                                type="text"
                                                                value={paymentForm.data.transaction_id}
                                                                onChange={e => paymentForm.setData('transaction_id', e.target.value)}
                                                                placeholder="e.g. TXN-12345"
                                                                className="mt-1.5"
                                                            />
                                                        </div>

                                                        {/* Recent payments */}
                                                        {booking.payments && booking.payments.length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground mb-1.5">Recent payments</p>
                                                                <div className="space-y-1 max-h-20 overflow-y-auto">
                                                                    {[...booking.payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3).map(p => (
                                                                        <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 border">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.payment_status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                                                <span className="text-muted-foreground truncate">{paymentTypeLabel(p.type)}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                                <span className="font-medium text-foreground">{formatPrice(p.amount)}</span>
                                                                                <span className="text-muted-foreground/60">{new Date(p.created_at).toLocaleDateString()}</span>
                                                                                {remainingBalance > 0 && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            editPaymentForm.setData({
                                                                                                amount: String(p.amount),
                                                                                                payment_method: p.payment_method,
                                                                                                transaction_id: p.transaction_id ?? '',
                                                                                            });
                                                                                            setEditingPayment(p);
                                                                                            setShowPaymentSheet(false);
                                                                                        }}
                                                                                        className="text-muted-foreground/40 hover:text-foreground transition-colors"
                                                                                        title="Edit payment"
                                                                                    >
                                                                                        <PenLine className="w-3 h-3" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-2 pt-2 mt-auto">
                                                            <SheetClose asChild>
                                                                <Button type="button" variant="outline" className="flex-1">
                                                                    Cancel
                                                                </Button>
                                                            </SheetClose>
                                                            <Button
                                                                type="submit"
                                                                className="flex-1"
                                                                disabled={paymentForm.processing}
                                                            >
                                                                {paymentForm.processing ? 'Saving...' : 'Save Payment'}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </SheetContent>
                                            </Sheet>
                                        )}

                                        {['completed', 'cancelled'].includes(booking.status) ? (
                                            <Button variant="outline" className="w-full" disabled>
                                                <BadgeCheck className="w-4 h-4 mr-1.5" />
                                                Update Status
                                            </Button>
                                        ) : (
                                        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full">
                                                    <BadgeCheck className="w-4 h-4 mr-1.5" />
                                                    Update Status
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="end" className="w-[340px] p-4" sideOffset={8}>
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
                                                                onValueChange={v => form.setData('status', v)}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {statusOptions().map(o => (
                                                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {form.data.status !== booking.status && !(() => {
                                                            const allowed: Record<string, string[]> = {
                                                                pending: ['confirmed', 'cancelled'],
                                                                confirmed: ['active', 'cancelled'],
                                                                active: ['completed', 'cancelled'],
                                                                completed: [],
                                                                cancelled: [],
                                                            };
                                                            return allowed[booking.status]?.includes(form.data.status);
                                                        })() && (
                                                            <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                                                                <p className="text-[11px] text-amber-800 dark:text-amber-200">
                                                                    Cannot move from &ldquo;{statusOptions().find(o => o.value === booking.status)?.label ?? booking.status}&rdquo; to &ldquo;{statusOptions().find(o => o.value === form.data.status)?.label ?? form.data.status}&rdquo;.
                                                                </p>
                                                            </div>
                                                        )}

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

                                                        {(() => {
                                                            const showRemaining = (booking.status === 'confirmed' && ['active', 'completed'].includes(form.data.status))
                                                                || (booking.status === 'active' && form.data.status === 'completed');
                                                            if (!showRemaining) return null;
                                                            return (
                                                                <div className="p-2 rounded-md bg-muted border">
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        <span className="font-medium">Remaining: </span>
                                                                        <span className={`font-bold ${remainingBalance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                                                                            {formatPrice(remainingBalance)}
                                                                        </span>
                                                                    </p>
                                                                    {remainingBalance > 0 && (
                                                                        <p className="text-[10px] text-destructive mt-0.5">
                                                                            Full payment required to mark as Completed.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {(() => {
                                                            const showPaymentField = (booking.status === 'confirmed' && ['active', 'completed'].includes(form.data.status))
                                                                || (booking.status === 'active' && form.data.status === 'completed');
                                                            if (!showPaymentField) return null;
                                                            const isRequired = (booking.status === 'confirmed' && form.data.status === 'completed')
                                                                || (booking.status === 'active' && form.data.status === 'completed' && remainingBalance > 0);
                                                            return (
                                                                <div>
                                                                    <Label className="text-xs font-medium">
                                                                        Payment Amount
                                                                        {isRequired ? <span className="text-destructive"> *</span> : <span className="text-muted-foreground font-normal"> (optional)</span>}
                                                                    </Label>
                                                                    <div className="relative mt-1">
                                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                            <span className="text-muted-foreground text-sm">$</span>
                                                                        </div>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            value={form.data.amount}
                                                                            onChange={e => form.setData('amount', e.target.value)}
                                                                            placeholder="0.00"
                                                                            className="pl-7 h-8 text-sm"
                                                                        />
                                                                    </div>
                                                                    {form.errors.amount && (
                                                                        <p className="mt-0.5 text-[11px] text-destructive">{form.errors.amount}</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        <div className="flex gap-2 pt-1">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 h-8 text-xs"
                                                                onClick={() => setStatusOpen(false)}
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

                                    </CardContent>

                                    {/* Edit Payment Sheet */}
                                    <Sheet open={!!editingPayment} onOpenChange={open => {
                                        if (!open) {
                                            setEditingPayment(null);
                                            editPaymentForm.reset();
                                        }
                                    }}>
                                        <SheetContent side="right" className="sm:max-w-md flex flex-col">
                                            <SheetHeader>
                                                <SheetTitle>Edit Payment</SheetTitle>
                                                <SheetDescription>
                                                    {editingPayment && (
                                                        <>{paymentTypeLabel(editingPayment.type)} &middot; Current: {formatPrice(editingPayment.amount)}</>
                                                    )}
                                                </SheetDescription>
                                            </SheetHeader>

                                            <form
                                                onSubmit={updatePayment}
                                                onKeyDown={e => {
                                                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                                        e.preventDefault();
                                                        updatePayment(e as any);
                                                    }
                                                }}
                                                className="space-y-4 mt-5 flex-1 flex flex-col"
                                            >
                                                {/* Remaining Balance Indicator */}
                                                <div className="p-3 rounded-lg bg-muted/50 border">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Remaining Balance</span>
                                                        <span className={`font-bold ${remainingBalance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                                                            {formatPrice(remainingBalance)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                                        <span>Total: {formatPrice(totalAmount)}</span>
                                                        <span>Paid: {formatPrice(totalPaid)}</span>
                                                    </div>
                                                    {editingPayment && (
                                                        <p className="text-[11px] text-muted-foreground mt-1.5">
                                                            Editing <strong>{paymentTypeLabel(editingPayment.type)}</strong> &mdash; current: {formatPrice(editingPayment.amount)}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Amount */}
                                                <div>
                                                    <Label className="text-sm font-medium mb-1.5 block">Amount</Label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-muted-foreground text-sm">$</span>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            value={editPaymentForm.data.amount}
                                                            onChange={e => editPaymentForm.setData('amount', e.target.value)}
                                                            placeholder="0.00"
                                                            className="pl-7"
                                                        />
                                                    </div>
                                                    {editPaymentForm.errors.amount && (
                                                        <p className="mt-1 text-xs text-destructive">{editPaymentForm.errors.amount}</p>
                                                    )}
                                                </div>

                                                {/* Method */}
                                                <div>
                                                    <Label className="text-sm font-medium mb-1.5 block">Method</Label>
                                                    <Select
                                                        value={editPaymentForm.data.payment_method}
                                                        onValueChange={v => editPaymentForm.setData('payment_method', v)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="card">Card</SelectItem>
                                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                            <SelectItem value="online">Online</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Transaction ID */}
                                                <div>
                                                    <Label className="text-sm font-medium">
                                                        Transaction ID <span className="text-muted-foreground font-normal">(optional)</span>
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        value={editPaymentForm.data.transaction_id}
                                                        onChange={e => editPaymentForm.setData('transaction_id', e.target.value)}
                                                        placeholder="e.g. TXN-12345"
                                                        className="mt-1.5"
                                                    />
                                                </div>

                                                <div className="flex gap-2 pt-2 mt-auto">
                                                    <SheetClose asChild>
                                                        <Button type="button" variant="outline" className="flex-1">
                                                            Cancel
                                                        </Button>
                                                    </SheetClose>
                                                    <Button
                                                        type="submit"
                                                        className="flex-1"
                                                        disabled={editPaymentForm.processing}
                                                    >
                                                        {editPaymentForm.processing ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </SheetContent>
                                    </Sheet>
                                </Card>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0 space-y-4">
                            {/* Vehicle Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left — Hero Card */}
                                <Card className="overflow-hidden h-full">
                                    <div className="relative h-44 sm:h-52 bg-muted">
                                        {booking.car.image_path ? (
                                            <img
                                                src={`/storage/${booking.car.image_path}`}
                                                alt={`${booking.car.brand} ${booking.car.model}`}
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
                                    href={route('admin.bookings.index')}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Bookings
                                </Link>
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="w-4 h-4 mr-1.5" />
                                        Print
                                    </Button>
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

function SpecRow({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | null | undefined; color: string }) {
    const colorMap: Record<string, string> = {
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
        purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
        rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30',
        cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30',
        slate: 'text-muted-foreground bg-muted',
    };
    const hasValue = value !== null && value !== undefined;
    return (
        <div className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.slate}`}>
                <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-muted-foreground min-w-[80px] font-medium">{label}</span>
            <span className={`text-xs font-semibold font-mono truncate ${hasValue ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                {hasValue ? value : '—'}
            </span>
        </div>
    );
}
