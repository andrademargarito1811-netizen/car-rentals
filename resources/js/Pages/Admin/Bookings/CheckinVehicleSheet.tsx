import { useState, useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/Components/ui/sheet';
import VehicleDamageMap from '@/Components/VehicleDamageMap';
import PrintDamageSummary from '@/Components/car3d/PrintDamageSummary';
import FuelGaugeInput, { FUEL_MAX_BARS } from '@/Components/FuelGaugeInput';
import { type VehicleDamage } from '@/lib/carZones';
import { toast } from 'sonner';
import { BadgeCheck, Info, ChevronDown, Receipt } from 'lucide-react';
import { PAYMENT_METHODS } from './PaymentItem';
import type { BookingTax } from './types';

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

function formatOdometer(value: number | null | undefined): string {
    return value == null ? '—' : `${Math.round(value).toLocaleString()}`;
}

function getDaysDifference(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.max(1, Math.round((Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) - Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) / msPerDay));
}

interface CheckinVehicleBooking {
    id: number;
    reference_code: string | null;
    start_date: string;
    end_date: string;
    pickup_time: string | null;
    return_time: string | null;
    total_amount: number;
    car: {
        daily_rate: number;
        fuel_charges: number | null;
        free_km_per_day: number | null;
        additional_km_rate: number | null;
        vehicle_type: string | null;
    };
    payments: { amount: number; payment_status: string }[];
    pickup_handover: { fuel_level: number | null; odometer: number | null; damages: VehicleDamage[] | null; captured_at: string | null } | null;
    coupon_usage: { code: string; discount_amount: number } | null;
    booking_taxes: BookingTax[];
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

interface CheckinVehicleSheetProps {
    booking: CheckinVehicleBooking;
    extraCharges?: ExtraChargeCatalogItem[];
    triggerClassName?: string;
}

function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toDateTime(date: string, time: string | null): Date {
    return new Date(`${date}T${time ?? '00:00:00'}`);
}

function billingDays(start: Date, end: Date): number {
    return Math.max(1, Math.ceil(Math.max(0, end.getTime() - start.getTime()) / 86400000));
}

function toLocalInputValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CheckinVehicleSheet({ booking, extraCharges = [], triggerClassName }: CheckinVehicleSheetProps) {
    const route = useRoute();
    const [open, setOpen] = useState(false);
    const [showExistingDamages, setShowExistingDamages] = useState(false);
    const pickup = booking.pickup_handover;
    const days = getDaysDifference(booking.start_date, booking.end_date);

    const initialExtraChargeIds = extraCharges.filter(c => c.apply_always).map(c => c.id);

    const checkinForm = useForm({
        _method: 'PATCH',
        status: 'completed',
        returned_at: toLocalInputValue(new Date()),
        return_fuel: '',
        return_odometer: '',
        return_notes: '',
        return_damages: (pickup?.damages ?? []) as VehicleDamage[],
        payment_method: 'Cash',
        amount: '',
        no_damage: false,
        extra_charges: extraCharges.filter(c => c.apply_always).map(c => ({ id: c.id, rate: c.rate })) as { id: number; rate?: string }[],
    });
    const checkinAmountEdited = useRef(false);

    const totalAmount = Number(booking.total_amount) || 0;
    const totalPaid = (booking.payments ?? []).filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = totalAmount - totalPaid;

    const dailyRate = Number(booking.car?.daily_rate ?? 0) || 0;
    const rentalSubtotal = round2(dailyRate * days);
    const taxableRate = (booking.booking_taxes ?? []).reduce((sum, t) =>
        t.add_or_minus && t.tax?.value_in === 'Percentage' && t.tax.calculation === 'Per Rental'
            ? sum + (Number(t.tax.rate) || 0)
            : sum, 0);

    function getChargeRate(id: number): number {
        const catalog = extraCharges.find(c => c.id === id);
        const entry = checkinForm.data.extra_charges.find(x => x.id === id);
        const raw = entry?.rate !== undefined && entry.rate !== '' ? entry.rate : (catalog?.rate ?? '0');
        const parsed = Number(raw);
        return isNaN(parsed) ? 0 : parsed;
    }

    function computeExtraChargeAmount(c: ExtraChargeCatalogItem): number {
        const rate = getChargeRate(c.id);
        let amount = 0;
        if (c.value_in === 'Percentage') {
            amount = c.calculation === 'Per Day'
                ? (dailyRate * rate / 100) * days
                : rentalSubtotal * rate / 100;
        } else {
            amount = c.calculation === 'Per Day'
                ? rate * days
                : rate;
        }
        return round2(amount);
    }

    function toggleExtraCharge(id: number) {
        const selected = checkinForm.data.extra_charges;
        if (selected.some(x => x.id === id)) {
            checkinForm.setData('extra_charges', selected.filter(x => x.id !== id));
        } else {
            const catalog = extraCharges.find(c => c.id === id);
            checkinForm.setData('extra_charges', [...selected, { id, rate: catalog?.rate ?? '' }]);
        }
    }

    function setChargeRate(id: number, rate: string) {
        checkinForm.setData('extra_charges', checkinForm.data.extra_charges.map(x => x.id === id ? { ...x, rate } : x));
    }

    const selectedCharges = extraCharges.filter(c => checkinForm.data.extra_charges.some(x => x.id === c.id));

    function computeExtraChargeTotal(): number {
        return selectedCharges.reduce((sum, c) => {
            const amount = computeExtraChargeAmount(c);
            const tax = c.taxable ? round2(amount * taxableRate / 100) : 0;
            const signed = c.operator === '-' ? -(amount + tax) : amount + tax;
            return round2(sum + signed);
        }, 0);
    }

    function recomputeTaxAmount(t: BookingTax, subtotal: number, actualDays: number, reservedDays: number): number {
        const tax = t.tax;
        if (!tax) {
            return reservedDays > 0 ? round2(Number(t.amount) * actualDays / reservedDays) : 0;
        }
        const rate = Number(tax.rate) || 0;
        if (tax.value_in === 'Percentage') {
            return round2(tax.calculation === 'Per Day' ? (dailyRate * rate / 100) * actualDays : subtotal * rate / 100);
        }
        return round2(tax.calculation === 'Per Day' ? rate * actualDays : rate);
    }

    function computeProration(): { proratedBase: number | null; actualDays: number; reservedDays: number } {
        const pickupAt = booking.pickup_handover?.captured_at;
        const returnedAt = checkinForm.data.returned_at;
        if (!pickupAt || !returnedAt) return { proratedBase: null, actualDays: 0, reservedDays: 0 };

        const actualDays = billingDays(new Date(pickupAt), new Date(returnedAt));
        const reservedDays = billingDays(
            toDateTime(booking.start_date, booking.pickup_time),
            toDateTime(booking.end_date, booking.return_time),
        );

        if (actualDays >= reservedDays) return { proratedBase: null, actualDays, reservedDays };

        const subtotal = round2(dailyRate * actualDays);
        let taxTotal = 0;
        for (const t of (booking.booking_taxes ?? [])) {
            const amount = recomputeTaxAmount(t, subtotal, actualDays, reservedDays);
            taxTotal += t.add_or_minus ? amount : -amount;
        }
        const coupon = Number(booking.coupon_usage?.discount_amount ?? 0);
        const proratedBase = Math.max(0, round2(subtotal + taxTotal - coupon));

        return { proratedBase, actualDays, reservedDays };
    }

    function submitCheckin(e: React.FormEvent) {
        e.preventDefault();
        checkinForm.post(route('admin.bookings.status', booking.id), {
            preserveScroll: true,
            onSuccess: () => {
                checkinForm.reset();
                setOpen(false);
                toast.success('Booking completed', { description: 'Return readings recorded and charges applied.' });
            },
        });
    }

    function computeReturnCharges(returnFuel: string, returnOdometer: string) {
        if (!pickup) return { fuel: 0, mileage: 0, excessKm: 0, total: 0 };
        const rFuel = Number(returnFuel);
        const rOdo = Number(returnOdometer);
        if (returnFuel === '' || returnOdometer === '' || isNaN(rFuel) || isNaN(rOdo)) {
            return { fuel: 0, mileage: 0, excessKm: 0, total: 0 };
        }
        const fuelDrop = (pickup.fuel_level ?? 0) - rFuel;
        const fuel = fuelDrop > 1 ? (Number(booking.car.fuel_charges) || 0) : 0;
        const kmDriven = Math.max(0, rOdo - (pickup.odometer ?? 0));
        const freeKm = (Number(booking.car.free_km_per_day) || 0) * Math.max(1, days);
        const excessKm = Math.max(0, kmDriven - freeKm);
        const mileage = excessKm * (Number(booking.car.additional_km_rate) || 0);
        return { fuel, mileage, excessKm, total: fuel + mileage };
    }

    const returnCharges = computeReturnCharges(checkinForm.data.return_fuel, checkinForm.data.return_odometer);
    const extraChargeTotal = computeExtraChargeTotal();
    const proration = computeProration();
    const proratedTotal = round2((proration.proratedBase ?? totalAmount) + returnCharges.total + extraChargeTotal);
    const requiredPayment = Math.max(0, round2(proratedTotal - totalPaid));

    useEffect(() => {
        if (!open) return;
        checkinAmountEdited.current = false;
        checkinForm.setData('returned_at', toLocalInputValue(new Date()));
    }, [open]);

    useEffect(() => {
        if (!open || checkinAmountEdited.current) return;
        checkinForm.setData('amount', requiredPayment > 0 ? requiredPayment.toFixed(2) : '');
    }, [open, requiredPayment]);

    return (
                        <Sheet open={open} onOpenChange={open => {
                            setOpen(open);
                            setShowExistingDamages(false);
                            if (!open) checkinForm.reset();
                        }}>
            <SheetTrigger asChild>
                <Button variant="default" className={triggerClassName ?? 'w-full'} disabled={!pickup} title={pickup ? undefined : 'Pickup handover must be recorded before check-in.'}>
                    <BadgeCheck className="w-4 h-4 mr-1.5" />
                    Check-in Vehicle
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-lg flex flex-col">
                <SheetHeader>
                    <SheetTitle>Check-in Vehicle</SheetTitle>
                    <SheetDescription>
                        {booking.reference_code} · Return {formatDate(booking.end_date)} {formatTime(booking.return_time)}
                    </SheetDescription>
                </SheetHeader>
                <form
                    onSubmit={submitCheckin}
                    className="space-y-4 mt-5 flex-1 flex flex-col min-h-0"
                >
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1 min-h-0">
                        {pickup && (
                            <div className="rounded-lg bg-muted/50 border p-3 grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground">Fuel at pickup</p>
                                    <p className="text-sm font-bold text-foreground">{pickup.fuel_level}/{FUEL_MAX_BARS}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground">Odometer at pickup</p>
                                    <p className="text-sm font-bold text-foreground">{formatOdometer(pickup.odometer)}</p>
                                </div>
                            </div>
                        )}
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Actual Return Date &amp; Time
                            </Label>
                            <Input
                                type="datetime-local"
                                value={checkinForm.data.returned_at}
                                onChange={e => checkinForm.setData('returned_at', e.target.value)}
                            />
                            {checkinForm.errors.returned_at && (
                                <p className="mt-1 text-xs text-destructive">{checkinForm.errors.returned_at}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Fuel Level <span className="text-destructive">*</span>
                            </Label>
                            <FuelGaugeInput
                                value={checkinForm.data.return_fuel}
                                onChange={v => checkinForm.setData('return_fuel', v)}
                            />
                            {checkinForm.errors.return_fuel && (
                                <p className="mt-1 text-xs text-destructive">{checkinForm.errors.return_fuel}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Odometer <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="number"
                                min={pickup?.odometer ?? 0}
                                value={checkinForm.data.return_odometer}
                                onChange={e => checkinForm.setData('return_odometer', e.target.value)}
                                placeholder={`≥ ${formatOdometer(pickup?.odometer)}`}
                            />
                            {checkinForm.errors.return_odometer && (
                                <p className="mt-1 text-xs text-destructive">{checkinForm.errors.return_odometer}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">New Damage at Return</Label>
                            {pickup?.damages && pickup.damages.length > 0 && (
                                <details
                                    className="group mb-2 rounded-lg border bg-muted/30 p-3 open:pb-2"
                                    open={showExistingDamages}
                                    onToggle={e => setShowExistingDamages(e.currentTarget.open)}
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-medium text-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                            Pre-existing at pickup ({pickup.damages.length})
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
                                    </summary>
                                    <div className="mt-2 border-t pt-2">
                                        {showExistingDamages && (
                                            <VehicleDamageMap
                                                damages={pickup.damages}
                                                readOnly
                                                variant="existing"
                                                vehicleType={booking.car.vehicle_type}
                                                stacked
                                            />
                                        )}
                                    </div>
                                </details>
                            )}
                            <div className="print:hidden">
                                <VehicleDamageMap
                                    damages={checkinForm.data.return_damages}
                                    onChange={d => checkinForm.setData('return_damages', d)}
                                    vehicleType={booking.car.vehicle_type}
                                    stacked
                                />
                            </div>
                            <div className="hidden print:block">
                                <PrintDamageSummary
                                    damages={checkinForm.data.return_damages}
                                    variant="new"
                                    vehicleType={booking.car.vehicle_type}
                                />
                            </div>
                            {checkinForm.data.return_damages.length === 0 && (
                                <div className="mt-2 flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
                                    <input
                                        id="return_no_damage"
                                        type="checkbox"
                                        checked={checkinForm.data.no_damage}
                                        onChange={e => checkinForm.setData('no_damage', e.target.checked)}
                                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                                    />
                                    <div>
                                        <label htmlFor="return_no_damage" className="cursor-pointer text-xs font-medium text-foreground">
                                            No new damage at return
                                        </label>
                                        <p className="text-[11px] text-muted-foreground">
                                            Confirm the vehicle was returned without new damage.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {checkinForm.errors.no_damage && (
                                <p className="mt-1 text-xs text-destructive">{checkinForm.errors.no_damage}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Notes <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Input
                                type="text"
                                value={checkinForm.data.return_notes}
                                onChange={e => checkinForm.setData('return_notes', e.target.value)}
                                placeholder="Additional notes"
                            />
                        </div>
                        {extraCharges.length > 0 && (
                            <div className="rounded-lg bg-background border p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-sm font-medium text-foreground">Extra Charges</p>
                                </div>
                                <div className="space-y-2">
                                    {extraCharges.map(c => {
                                        const selected = checkinForm.data.extra_charges.some(x => x.id === c.id);
                                        const amount = computeExtraChargeAmount(c);
                                        const tax = c.taxable ? round2(amount * taxableRate / 100) : 0;
                                        const rate = getChargeRate(c.id);
                                        return (
                                            <div key={c.id} className={`rounded-lg border p-3 transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}>
                                                <div
                                                    className="flex items-start gap-3 cursor-pointer"
                                                    onClick={() => toggleExtraCharge(c.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={() => toggleExtraCharge(c.id)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-semibold text-foreground">{c.name}</span>
                                                            <span className={`text-sm font-bold tabular-nums ${c.operator === '-' ? 'text-emerald-600' : 'text-foreground'}`}>
                                                                {c.operator === '-' ? '-' : '+'}{formatPrice(round2(amount + tax))}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {c.value_in === 'Percentage' ? `${rate.toFixed(2)}%` : `${c.calculation === 'Per Day' ? `${formatPrice(rate)}/day × ${days} day${days !== 1 ? 's' : ''}` : formatPrice(rate)}`}
                                                            {c.taxable && <span className="ml-1 text-blue-500">· taxable</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selected && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                                                            Rate{c.value_in === 'Percentage' ? ' (%)' : ' ($)'}
                                                        </span>
                                                        <div className="relative flex-1">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <span className="text-muted-foreground text-xs">{c.value_in === 'Percentage' ? '%' : '$'}</span>
                                                            </div>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={checkinForm.data.extra_charges.find(x => x.id === c.id)?.rate ?? ''}
                                                                onChange={e => setChargeRate(c.id, e.target.value)}
                                                                className="pl-7 h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {selectedCharges.length > 0 && (
                                    <div className="rounded-lg bg-muted/40 border p-2.5 space-y-1.5">
                                        {selectedCharges.map(c => {
                                            const amount = computeExtraChargeAmount(c);
                                            const tax = c.taxable ? round2(amount * taxableRate / 100) : 0;
                                            return (
                                                <div key={c.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        {c.name}
                                                        {tax > 0 && <span className="text-[10px] text-muted-foreground/70"> incl. tax</span>}
                                                    </span>
                                                    <span className={`font-semibold ${c.operator === '-' ? 'text-emerald-600' : 'text-foreground'}`}>
                                                        {c.operator === '-' ? '-' : '+'}{formatPrice(round2(amount + tax))}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        <div className="flex items-center justify-between text-sm border-t pt-1.5">
                                            <span className="font-medium text-foreground">Extra charges</span>
                                            <span className={`font-bold ${extraChargeTotal < 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                                                {extraChargeTotal < 0 ? '-' : ''}{formatPrice(Math.abs(extraChargeTotal))}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {returnCharges.total > 0 && (
                            <div className="rounded-lg bg-background border p-3 space-y-1.5">
                                {returnCharges.fuel > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Fuel refueling</span>
                                        <span className="font-semibold text-foreground">+{formatPrice(returnCharges.fuel)}</span>
                                    </div>
                                )}
                                {returnCharges.mileage > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Excess mileage ({returnCharges.excessKm.toFixed(0)} km)</span>
                                        <span className="font-semibold text-foreground">+{formatPrice(returnCharges.mileage)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm border-t pt-1.5">
                                    <span className="font-medium text-foreground">Additional charges</span>
                                    <span className="font-bold text-foreground">{formatPrice(returnCharges.total)}</span>
                                </div>
                            </div>
                        )}
                        <div className="rounded-lg bg-muted/50 border p-3 space-y-2">
                            <p className="text-sm font-medium text-foreground">Final Payment</p>
                            {proration.proratedBase !== null && (
                                <div className="rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-[11px] text-blue-600">
                                    Early return: billed for {proration.actualDays} day{proration.actualDays !== 1 ? 's' : ''} instead of {proration.reservedDays}.
                                    {' '}Adjustment {formatPrice(proration.proratedBase - totalAmount)}
                                </div>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                Remaining {formatPrice(remainingBalance)}
                                {proration.proratedBase !== null && <> · proration {formatPrice(proration.proratedBase - totalAmount)}</>}
                                {returnCharges.total > 0 && <> + charges {formatPrice(returnCharges.total)}</>}
                                {extraChargeTotal !== 0 && <> {extraChargeTotal > 0 ? '+' : '−'} extra charges {formatPrice(Math.abs(extraChargeTotal))}</>}
                                {' = '}
                                <span className="font-semibold text-foreground">{formatPrice(requiredPayment)}</span>
                            </p>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-muted-foreground text-sm">$</span>
                                </div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={checkinForm.data.amount}
                                    onChange={e => {
                                        checkinAmountEdited.current = true;
                                        checkinForm.setData('amount', e.target.value);
                                    }}
                                    className="pl-7"
                                />
                            </div>
                            <Select
                                value={checkinForm.data.payment_method}
                                onValueChange={v => checkinForm.setData('payment_method', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {checkinForm.errors.amount && (
                                <p className="text-xs text-destructive">{checkinForm.errors.amount}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2 mt-auto">
                        <SheetClose asChild>
                            <Button type="button" variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </SheetClose>
                        <Button type="submit" className="flex-1" disabled={checkinForm.processing}>
                            {checkinForm.processing ? 'Saving...' : 'Complete Booking'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
