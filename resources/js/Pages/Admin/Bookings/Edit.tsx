import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { countries } from '@/data/countries';
import { toast } from 'sonner';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import {
  ArrowLeft,
  Car,
  Calendar,
  Clock,
  MapPin,
  User,
  Fuel,
  Gauge,
  Users,
  PenLine,
  ChevronRight,
  ChevronDown,
  Hash,
  DollarSign,
  Search,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/Components/ui/popover';

interface CarItem {
  id: number;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  license_plate: string;
  image_path: string | null;
  seats: number | null;
  transmission: string;
  fuel_type: string;
  vehicle_type: string | null;
  location: { location: string } | null;
}

interface LocationItem {
  location_id: number;
  location: string;
}

interface AdminBookingEditProps {
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
    car: CarItem;
    pickup_location: { location: string } | null;
    return_location: { location: string } | null;
    coupon_usage: { code: string; discount_amount: number } | null;
  };
  cars: CarItem[];
  locations: LocationItem[];
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function calcRentalDays(pickupDate: string, pickupTime: string | undefined, returnDate: string, returnTime: string | undefined): number {
  if (!pickupDate || !returnDate) return 0;
  const start = new Date(`${pickupDate}T${pickupTime || '10:00'}:00`);
  const end = new Date(`${returnDate}T${returnTime || '10:00'}:00`);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function AdminBookingEdit({ booking, cars, locations }: AdminBookingEditProps) {
  const route = useRoute();
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

  const [totalTax, setTotalTax] = useState(0);
  const [totalSurcharge, setTotalSurcharge] = useState(0);
  const [taxes, setTaxes] = useState<Array<{ id: number; tax_desc: string; amount: number; add_or_minus: boolean; value_in?: string; rate?: number; calculation?: string }>>([]);
  const totalFees = totalTax + totalSurcharge;

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
  const estimatedTotal = subtotal + totalFees - discount;

  useEffect(() => {
    form.setData('discount', discount);
  }, [discount]);

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
          toast.success('Coupon applied', { description: `${code} — ${data.coupon.label}` });
        } else {
          setAppliedCoupon(null);
          form.setData('coupon_code', '');
          form.setData('discount', 0);
          toast.error('Invalid coupon', { description: data.message || 'Coupon code is not valid.' });
        }
      })
      .catch(() => {
        toast.error('Error', { description: 'Could not validate coupon.' });
      });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(route('admin.bookings.modify', booking.id), {
      onSuccess: () => {
        toast.success('Booking modified', { description: 'Changes saved successfully.' });
      },
      onError: (errors: any) => {
        const message = errors.error || 'Failed to save changes.';
        toast.error('Error', { description: message });
      },
    });
  }

  const hasPriceChanged = estimatedTotal !== booking.total_amount;
  const priceDiff = estimatedTotal - booking.total_amount;

  const updateField = useCallback((field: string, value: any) => {
    form.setData(field as any, value);
  }, []);

  const onOneWayChange = useCallback((val: boolean) => {
    setOneWay(val);
    if (!val) form.setData('return_location', form.data.pickup_location);
  }, [form.data.pickup_location]);

  const onApplyCoupon = useCallback(() => applyCoupon(), [applyCoupon]);
  const onRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    form.setData('coupon_code', '');
    form.setData('discount', 0);
  }, []);

  return (
    <>
      <Head title={`Modify Booking #${booking.reference_code ?? booking.id}`} />

      <AuthenticatedLayout
        header={
          <div className="border-b border-border bg-gradient-to-b from-muted/30 to-background">
            <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Link href={route('admin.bookings.index')} className="hover:text-foreground transition-colors">
                  Bookings
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={route('admin.bookings.show', booking.id)} className="hover:text-foreground transition-colors">
                  {booking.reference_code ?? `#${String(booking.id).padStart(4, '0')}`}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground font-medium truncate">Modify</span>
              </nav>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                  <PenLine className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Modify Booking</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {booking.reference_code ?? `#${String(booking.id).padStart(4, '0')}`}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <VehicleSection
              cars={cars}
              carId={form.data.car_id}
              onCarChange={updateField}
              bookingCar={booking.car}
              originalCarDailyRate={originalCarDailyRate}
              selectedCar={selectedCar}
              dailyRate={dailyRate}
            />

            <RentalPeriodSection
              pickup_date={form.data.pickup_date}
              pickup_time={form.data.pickup_time}
              return_date={form.data.return_date}
              return_time={form.data.return_time}
              billingDays={billingDays}
              updateField={updateField}
            />

            <LocationsSection
              pickup_location={form.data.pickup_location}
              return_location={form.data.return_location}
              oneWay={oneWay}
              onOneWayChange={onOneWayChange}
              locations={locations}
              updateField={updateField}
            />

            <DriverInfoSection
              title={form.data.title}
              first_name={form.data.first_name}
              last_name={form.data.last_name}
              driver_age={form.data.driver_age}
              phone={form.data.phone}
              email={form.data.email}
              address={form.data.address}
              address2={form.data.address2}
              country={form.data.country}
              state={form.data.state}
              city={form.data.city}
              postal_code={form.data.postal_code}
              flight_no={form.data.flight_no}
              updateField={updateField}
            />

            <CouponSection
              coupon_code={form.data.coupon_code}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={onApplyCoupon}
              onRemoveCoupon={onRemoveCoupon}
              updateField={updateField}
            />

            <NotesSection
              notes={form.data.notes}
              updateField={updateField}
            />

            <PriceSummarySection
              selectedCar={selectedCar}
              dailyRate={dailyRate}
              billingDays={billingDays}
              subtotal={subtotal}
              taxes={taxes}
              totalFees={totalFees}
              discount={discount}
              estimatedTotal={estimatedTotal}
              hasPriceChanged={hasPriceChanged}
              priceDiff={priceDiff}
              bookingTotal={booking.total_amount}
            />

            <div className="flex items-center justify-between pt-2">
              <Link
                href={route('admin.bookings.show', booking.id)}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={form.processing}
                className="min-w-[180px]"
              >
                {form.processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </AuthenticatedLayout>
    </>
  );
}

const VehicleSection = memo(function VehicleSection({
  cars, carId, onCarChange, bookingCar, originalCarDailyRate, selectedCar, dailyRate,
}: {
  cars: CarItem[];
  carId: number;
  onCarChange: (field: string, value: any) => void;
  bookingCar: CarItem;
  originalCarDailyRate: number;
  selectedCar: CarItem;
  dailyRate: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="w-4 h-4 text-muted-foreground" />
          Vehicle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CarCombobox
          cars={cars}
          value={carId}
          onChange={v => onCarChange('car_id', v)}
          originalCarId={bookingCar.id}
          originalCarDailyRate={originalCarDailyRate}
          bookingCar={bookingCar}
        />

        {selectedCar && selectedCar.id !== bookingCar.id && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Changing from <strong>{bookingCar.brand} {bookingCar.model}</strong> to <strong>{selectedCar.brand} {selectedCar.model}</strong>.
              Rate changes from {formatPrice(originalCarDailyRate)}/day to {formatPrice(dailyRate)}/day.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {selectedCar.seats && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30 border">
              <Users className="w-3.5 h-3.5" /> {selectedCar.seats} seats
            </div>
          )}
          {selectedCar.transmission && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30 border">
              <Gauge className="w-3.5 h-3.5" /> {selectedCar.transmission}
            </div>
          )}
          {selectedCar.fuel_type && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30 border">
              <Fuel className="w-3.5 h-3.5" /> {selectedCar.fuel_type}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30 border">
            <Hash className="w-3.5 h-3.5" /> {selectedCar.license_plate}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const RentalPeriodSection = memo(function RentalPeriodSection({
  pickup_date, pickup_time, return_date, return_time, billingDays, updateField,
}: {
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  billingDays: number;
  updateField: (field: string, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          Rental Period
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Pickup Date</Label>
            <Input
              type="date"
              value={pickup_date}
              onChange={e => updateField('pickup_date', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Pickup Time</Label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={pickup_time}
                onChange={e => updateField('pickup_time', e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-1 shrink-0">
                {['08:00', '12:00', '15:00', '18:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateField('pickup_time', t)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                      pickup_time === t
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted'
                    }`}
                  >
                    {t === '08:00' ? 'AM' : t === '12:00' ? 'Mid' : t === '15:00' ? 'PM' : 'Eve'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Return Date</Label>
            <Input
              type="date"
              value={return_date}
              onChange={e => updateField('return_date', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Return Time</Label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={return_time}
                onChange={e => updateField('return_time', e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-1 shrink-0">
                {['08:00', '12:00', '15:00', '18:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateField('return_time', t)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                      return_time === t
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted'
                    }`}
                  >
                    {t === '08:00' ? 'AM' : t === '12:00' ? 'Mid' : t === '15:00' ? 'PM' : 'Eve'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Quick select:</span>
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
                  const base = pickup_date ? new Date(pickup_date + 'T00:00:00') : new Date();
                  const end = new Date(base);
                  end.setDate(end.getDate() + preset.days);
                  if (!pickup_date) {
                    const today = new Date();
                    updateField('pickup_date', today.toISOString().split('T')[0]);
                  }
                  updateField('return_date', end.toISOString().split('T')[0]);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                  isActive
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {billingDays > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-semibold text-foreground">{billingDays} day{billingDays !== 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const LocationsSection = memo(function LocationsSection({
  pickup_location, return_location, oneWay, onOneWayChange, locations, updateField,
}: {
  pickup_location: string;
  return_location: string;
  oneWay: boolean;
  onOneWayChange: (val: boolean) => void;
  locations: LocationItem[];
  updateField: (field: string, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Pickup Location</Label>
          <Select
            value={pickup_location}
            onValueChange={v => {
              updateField('pickup_location', v);
              if (!oneWay) updateField('return_location', v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pickup location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc.location_id} value={loc.location}>{loc.location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">Same as pickup</span>
          <button
            type="button"
            role="switch"
            aria-checked={oneWay}
            onClick={() => onOneWayChange(!oneWay)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              oneWay ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
              oneWay ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
          <span className="text-xs text-muted-foreground font-medium">One-way (different return)</span>
        </div>

        {oneWay && (
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Return Location</Label>
            <Select
              value={return_location}
              onValueChange={v => updateField('return_location', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select return location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.location_id} value={loc.location}>{loc.location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const DriverInfoSection = memo(function DriverInfoSection({
  title, first_name, last_name, driver_age, phone, email, address, address2,
  country, state, city, postal_code, flight_no, updateField,
}: {
  title: string;
  first_name: string;
  last_name: string;
  driver_age: string;
  phone: string;
  email: string;
  address: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  flight_no: string;
  updateField: (field: string, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Driver Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Title</Label>
            <Select value={title} onValueChange={v => updateField('title', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Mr.', 'Mrs.', 'Ms.', 'Mx.', 'Dr.', 'Prof.'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">First Name</Label>
            <Input
              type="text"
              value={first_name}
              onChange={e => updateField('first_name', e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Last Name</Label>
            <Input
              type="text"
              value={last_name}
              onChange={e => updateField('last_name', e.target.value)}
              placeholder="Doe"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Driver's Age</Label>
            <Input
              type="number"
              min={18}
              value={driver_age}
              onChange={e => updateField('driver_age', e.target.value)}
              placeholder="30"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Phone</Label>
            <Input
              type="tel"
              value={phone}
              onChange={e => updateField('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Flight No. (optional)</Label>
            <Input
              type="text"
              value={flight_no}
              onChange={e => updateField('flight_no', e.target.value)}
              placeholder="UA 201"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-sm font-medium mb-1.5 block">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => updateField('email', e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div className="sm:col-span-3">
            <Label className="text-sm font-medium mb-1.5 block">Address</Label>
            <Input
              type="text"
              value={address}
              onChange={e => updateField('address', e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div className="sm:col-span-3">
            <Label className="text-sm font-medium mb-1.5 block">Address 2 (optional)</Label>
            <Input
              type="text"
              value={address2}
              onChange={e => updateField('address2', e.target.value)}
              placeholder="Apartment, suite, etc."
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Country</Label>
            <Select value={country} onValueChange={v => updateField('country', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {countries.map(c => (
                  <SelectItem key={c.code} value={c.name}>{c.flag} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">State / Province</Label>
            <Input
              type="text"
              value={state}
              onChange={e => updateField('state', e.target.value)}
              placeholder="State"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">City</Label>
            <Input
              type="text"
              value={city}
              onChange={e => updateField('city', e.target.value)}
              placeholder="City"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Postal Code</Label>
            <Input
              type="text"
              value={postal_code}
              onChange={e => updateField('postal_code', e.target.value)}
              placeholder="96940"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const CouponSection = memo(function CouponSection({
  coupon_code, appliedCoupon, onApplyCoupon, onRemoveCoupon, updateField,
}: {
  coupon_code: string;
  appliedCoupon: { code: string; type: string; value: number; label: string } | null;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  updateField: (field: string, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          Coupon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={coupon_code}
              onChange={e => updateField('coupon_code', e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onApplyCoupon(); } }}
              placeholder="Enter coupon code"
              className="uppercase tracking-wider"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onApplyCoupon}
            disabled={!coupon_code.trim()}
          >
            {appliedCoupon ? 'Change' : 'Apply'}
          </Button>
        </div>
        {appliedCoupon && (
          <div className="mt-2.5 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{appliedCoupon.code}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1.5">— {appliedCoupon.label}</span>
            </div>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="shrink-0 p-1 rounded text-emerald-500 hover:text-emerald-700 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 transition-all"
            >
              &times;
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const NotesSection = memo(function NotesSection({
  notes, updateField,
}: {
  notes: string;
  updateField: (field: string, value: any) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine className="w-4 h-4 text-muted-foreground" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <textarea
          value={notes}
          onChange={e => updateField('notes', e.target.value)}
          rows={3}
          placeholder="Any special requests, flight details, or additional information..."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </CardContent>
    </Card>
  );
});

const PriceSummarySection = memo(function PriceSummarySection({
  selectedCar, dailyRate, billingDays, subtotal, taxes, totalFees,
  discount, estimatedTotal, hasPriceChanged, priceDiff, bookingTotal,
}: {
  selectedCar: CarItem;
  dailyRate: number;
  billingDays: number;
  subtotal: number;
  taxes: Array<{ tax_desc: string; amount: number; add_or_minus: boolean; value_in?: string; rate?: number }>;
  totalFees: number;
  discount: number;
  estimatedTotal: number;
  hasPriceChanged: boolean;
  priceDiff: number;
  bookingTotal: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          Price Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{selectedCar.brand} {selectedCar.model}</span>
            <span className="font-medium text-foreground">{formatPrice(dailyRate)}<span className="text-xs text-muted-foreground font-normal">/day</span></span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium text-foreground">{billingDays} day{billingDays !== 1 ? 's' : ''}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-medium">
            <span className="text-foreground">Subtotal</span>
            <span className="text-foreground">{formatPrice(subtotal)}</span>
          </div>

          {taxes.filter(t => t.add_or_minus).length > 0 && (
            <>
              <div className="pt-1">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Fees & Taxes</p>
                <div className="space-y-1">
                  {taxes.filter(t => t.add_or_minus).map(t => (
                    <div key={t.tax_desc} className="flex justify-between text-sm pl-3">
                      <span className="text-muted-foreground">
                        {t.tax_desc}
                        {t.value_in && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({t.value_in === 'Percentage' ? `${t.rate}%` : formatPrice(t.rate ?? 0)})
                          </span>
                        )}
                      </span>
                      <span className="text-foreground">+{formatPrice(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Fees & Taxes</span>
                <span className="font-medium text-foreground">{formatPrice(totalFees)}</span>
              </div>
            </>
          )}

          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600 font-medium">Coupon Discount</span>
              <span className="text-emerald-600 font-medium">-{formatPrice(discount)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center pt-1">
            <span className="text-base font-bold text-foreground">Estimated Total</span>
            <div className="flex items-center gap-2.5">
              {hasPriceChanged && (
                <Badge variant={priceDiff > 0 ? 'destructive' : 'default'} className={`text-xs font-bold px-2 py-0.5 ${priceDiff > 0 ? '' : 'bg-emerald-600 hover:bg-emerald-600'}`}>
                  {priceDiff > 0 ? '+' : ''}{formatPrice(priceDiff)}
                </Badge>
              )}
              <span className="text-xl font-bold text-foreground">{formatPrice(estimatedTotal)}</span>
            </div>
          </div>
          {hasPriceChanged && (
            <p className="text-xs text-muted-foreground mt-1">
              {priceDiff > 0
                ? 'This is higher than the original booking total of ' + formatPrice(bookingTotal) + '.'
                : 'This is lower than the original booking total of ' + formatPrice(bookingTotal) + '.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

function CarCombobox({
  cars, value, onChange, originalCarId, originalCarDailyRate, bookingCar,
}: {
  cars: CarItem[];
  value: number;
  onChange: (id: number) => void;
  originalCarId: number;
  originalCarDailyRate: number;
  bookingCar: CarItem;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const selectedCar = cars.find(c => c.id === value) ?? bookingCar;

  const grouped = useMemo(() => {
    const filtered = debouncedSearch
      ? cars.filter(c => `${c.brand} ${c.model} ${c.vehicle_type || ''}`.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : cars;
    const groups: Record<string, CarItem[]> = {};
    for (const car of filtered) {
      const type = car.vehicle_type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(car);
    }
    return groups;
  }, [cars, debouncedSearch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto py-2.5 px-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-9 rounded-md overflow-hidden bg-muted shrink-0">
              {selectedCar.image_path ? (
                <img src={`/storage/${selectedCar.image_path}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <Car className="w-4 h-4 text-white/40" />
                </div>
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-medium truncate">
                {selectedCar.brand} {selectedCar.model}
                <span className="text-muted-foreground font-normal ml-1">({selectedCar.year})</span>
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {formatPrice(selectedCar.daily_rate)}/day &middot; {selectedCar.license_plate}
              </p>
            </div>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            type="text"
            placeholder="Search by brand or model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
        </div>
        <div className="max-h-[340px] overflow-y-auto">
          {Object.entries(grouped).map(([type, typeCars]) => {
            if (typeCars.length === 0) return null;
            return (
              <div key={type}>
                <div className="sticky top-0 bg-popover px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b z-10">
                  {type}
                </div>
                {typeCars.map(car => {
                  const isSelected = car.id === value;
                  const rateDiff = car.daily_rate - originalCarDailyRate;
                  return (
                    <button
                      key={car.id}
                      type="button"
                      onClick={() => {
                        onChange(car.id);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                        isSelected ? 'bg-accent' : ''
                      } border-b border-border/50 last:border-b-0`}
                    >
                      <div className="w-14 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                        {car.image_path ? (
                          <img src={`/storage/${car.image_path}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                            <Car className="w-5 h-5 text-white/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{car.brand} {car.model}</p>
                          {car.id === originalCarId && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">Current</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{car.year}</span>
                          {car.seats && <span>{car.seats} seats</span>}
                          {car.transmission && <span>{car.transmission}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{formatPrice(car.daily_rate)}</p>
                        {rateDiff !== 0 && (
                          <p className={`text-[11px] font-medium ${rateDiff > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                            {rateDiff > 0 ? '+' : ''}{formatPrice(rateDiff)}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No vehicles match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
