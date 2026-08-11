import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import CheckoutForm, { type CheckoutDriverData } from '@/Components/Admin/Bookings/CheckoutForm';
import { type VehicleDamage } from '@/lib/carZones';
import { Car, ChevronRight, Mail, MapPin, Phone, User } from 'lucide-react';

interface AdminBookingCheckoutProps {
    booking: {
        id: number;
        reference_code: string | null;
        start_date: string;
        end_date: string;
        pickup_time: string | null;
        return_time: string | null;
        total_amount: number;
        status: string;
        user: { id: number; name: string; email: string; phone: string | null; address: string | null; created_at: string } | null;
        guest: { guest_id: number; title: string | null; first_name: string; last_name: string; email: string; phone: string | null; address: string | null; address2: string | null; country: string | null; state: string | null; city: string | null; postal_code: string | null; driver_age: number | null; company_name: string | null; flight_no: string | null } | null;
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
            fuel_charges: number | null;
            free_km_per_day: number | null;
            additional_km_rate: number | null;
            vehicle_type: string | null;
        };
        payments: { id: string; type: string; amount: number; payment_method: string; payment_status: string; transaction_id: string | null; created_at: string }[];
        pickup_handover: { fuel_level: number | null; odometer: number | null; notes: string | null; damages: unknown[] | null; captured_at: string | null } | null;
        return_handover: { fuel_level: number | null; odometer: number | null; notes: string | null; damages: unknown[] | null; captured_at: string | null } | null;
        handover_charges: { fuel_refuel: number; fuel_missing: number; excess_mileage: number; excess_km: number; km_driven: number; total: number } | null;
        created_at: string;
    };
    previousDamages: VehicleDamage[];
    driver: CheckoutDriverData | null;
}

function getCustomerName(booking: AdminBookingCheckoutProps['booking']): string {
    return booking.user?.name ?? (booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : 'Guest');
}

function getCustomerEmail(booking: AdminBookingCheckoutProps['booking']): string {
    return booking.user?.email ?? booking.guest?.email ?? '—';
}

function getCustomerPhone(booking: AdminBookingCheckoutProps['booking']): string | null {
    return booking.user?.phone ?? booking.guest?.phone ?? null;
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(time: string | null): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function getDaysDifference(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function paymentTypeLabel(type: string): string {
    const labels: Record<string, string> = { downpayment: 'Down Payment', remaining: 'Remaining', full_payment: 'Full Payment' };
    return labels[type] ?? type;
}

export default function AdminBookingCheckout({ booking, previousDamages, driver }: AdminBookingCheckoutProps) {
    const route = useRoute();

    const totalAmount = Number(booking.total_amount) || 0;
    const totalPaid = (booking.payments ?? []).filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = totalAmount - totalPaid;

    const customerName = getCustomerName(booking);
    const customerEmail = getCustomerEmail(booking);
    const customerPhone = getCustomerPhone(booking);
    const initials = getInitials(customerName);
    const days = getDaysDifference(booking.start_date, booking.end_date);
    const driverIsRenter = !!driver && !!booking.guest && driver.guest_id === booking.guest.guest_id;

    return (
        <>
            <Head title={`Check-out ${booking.reference_code ?? booking.id}`} />

            <AuthenticatedLayout
                header={
                    <div className="border-b border-border bg-gradient-to-b from-muted/30 to-background">
                        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                <Link href={route('admin.reservations.index')} className="hover:text-foreground transition-colors">
                                    Reservations
                                </Link>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <Link href={route('admin.bookings.show', booking.id)} className="hover:text-foreground transition-colors">
                                    {booking.reference_code ?? `#${String(booking.id).padStart(4, '0')}`}
                                </Link>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span className="text-foreground font-medium truncate">Check-out</span>
                            </nav>
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                                        <Car className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Check-out Vehicle</p>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                            {booking.reference_code ?? `#${String(booking.id).padStart(4, '0')}`}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {customerName}
                                            </span>
                                            <span className="text-muted-foreground/40">|</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Link href={route('admin.bookings.show', booking.id)}>
                                        <Button variant="outline">
                                            Back to Booking
                                        </Button>
                                    </Link>
                                    <Badge variant="confirmed">
                                        Confirmed
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto space-y-8">
                    <CheckoutForm
                        booking={booking}
                        remainingBalance={remainingBalance}
                        previousDamages={previousDamages}
                        driver={driver}
                        companyName={booking.guest?.company_name ?? null}
                        renterFirstName={booking.guest?.first_name ?? ''}
                        renterLastName={booking.guest?.last_name ?? ''}
                        driverIsRenter={driverIsRenter}
                        requireDriverLicense={!driver}
                        cancelAction={
                            <Link href={route('admin.bookings.show', booking.id)} className="flex-1">
                                <Button type="button" variant="outline" className="w-full">
                                    Cancel
                                </Button>
                            </Link>
                        }
                        onSuccess={() => router.visit(route('admin.bookings.show', booking.id))}
                    />

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Booking Overview
                            </h3>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Customer</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
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
                                        {(booking.user?.address || booking.guest?.address) && (
                                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                                <span className="truncate">
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
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Booking Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
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
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Vehicle</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="font-semibold text-foreground text-sm">
                                        {booking.car.brand} {booking.car.model} {booking.car.year}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {booking.car.license_plate} &middot; {booking.car.transmission} &middot; {booking.car.fuel_type}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Payments</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
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
                                                <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 border">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.payment_status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                        <span className="text-muted-foreground truncate">{paymentTypeLabel(p.type)}</span>
                                                    </div>
                                                    <span className="font-medium text-foreground shrink-0 ml-2">{formatPrice(p.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
