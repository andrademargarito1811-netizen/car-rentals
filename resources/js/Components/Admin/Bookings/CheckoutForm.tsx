import { useMemo, useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import VehicleDamageMap from '@/Components/VehicleDamageMap';
import PrintDamageSummary from '@/Components/car3d/PrintDamageSummary';
import FuelGaugeInput from '@/Components/FuelGaugeInput';
import type { VehicleDamage } from '@/lib/carZones';
import { toast } from 'sonner';
import { PAYMENT_METHODS } from '@/Pages/Admin/Bookings/PaymentItem';

export interface CheckoutBookingData {
    id: number;
    reference_code: string | null;
    start_date: string;
    end_date: string;
    car: { vehicle_type: string | null };
}

export interface CheckoutDriverData {
    driver_id: number;
    guest_id: number | null;
    first_name: string;
    last_name: string;
    birth_date: string | null;
    license_category: string | null;
    license_expiry: string | null;
    masked_license: string;
}

interface CheckoutFormProps {
    booking: CheckoutBookingData;
    remainingBalance: number;
    cancelAction?: React.ReactNode;
    onSuccess?: () => void;
    previousDamages?: VehicleDamage[];
    driver?: CheckoutDriverData | null;
    companyName?: string | null;
    renterFirstName?: string;
    renterLastName?: string;
    driverIsRenter?: boolean;
    requireDriverLicense?: boolean;
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function StepBadge({ step }: { step: number }) {
    return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">
            {step}
        </span>
    );
}

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export default function CheckoutForm({
    booking,
    remainingBalance,
    cancelAction,
    onSuccess,
    previousDamages = [],
    driver,
    companyName,
    renterFirstName = '',
    renterLastName = '',
    driverIsRenter = true,
    requireDriverLicense = false,
}: CheckoutFormProps) {
    const route = useRoute();
    const [noDamageError, setNoDamageError] = useState<string | null>(null);
    const [driverError, setDriverError] = useState<string | null>(null);
    const initialDriverFirstName = driver?.first_name ?? (driverIsRenter ? renterFirstName : '');
    const initialDriverLastName = driver?.last_name ?? (driverIsRenter ? renterLastName : '');
    const checkoutForm = useForm({
        _method: 'PATCH',
        status: 'active',
        company_name: companyName ?? '',
        driver_is_renter: driverIsRenter,
        driver_first_name: initialDriverFirstName,
        driver_last_name: initialDriverLastName,
        driver_birth_date: driver?.birth_date ?? '',
        license_number: '',
        license_category: driver?.license_category ?? '',
        license_expiry: driver?.license_expiry ?? '',
        pickup_fuel: '',
        pickup_odometer: '',
        pickup_notes: '',
        pickup_damages: previousDamages as VehicleDamage[],
        payment_method: 'Cash',
        amount: '',
        no_damage: false,
    });

    const todayIso = (() => {
        const d = new Date();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${m}-${day}`;
    })();

    const driverAge = useMemo(() => {
        if (!checkoutForm.data.driver_birth_date) return null;
        const dob = new Date(checkoutForm.data.driver_birth_date + 'T00:00:00');
        if (isNaN(dob.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age;
    }, [checkoutForm.data.driver_birth_date]);

    function handleSameAsRenter(checked: boolean) {
        checkoutForm.setData(data => ({
            ...data,
            driver_is_renter: checked,
            driver_first_name: checked ? renterFirstName : data.driver_first_name,
            driver_last_name: checked ? renterLastName : data.driver_last_name,
        }));
    }

    function submitCheckout(e: React.FormEvent) {
        e.preventDefault();
        if (checkoutForm.data.pickup_damages.length === 0 && !checkoutForm.data.no_damage) {
            setNoDamageError('Please confirm that the vehicle has no existing damage before check out.');
            return;
        }
        setNoDamageError(null);

        if (requireDriverLicense) {
            const { driver_first_name, driver_last_name, driver_birth_date, license_number, license_category, license_expiry } = checkoutForm.data;
            if (!driver_first_name || !driver_last_name || !driver_birth_date || !license_number || !license_category || !license_expiry) {
                setDriverError('Driver license details are required before check out.');
                return;
            }
            if (driverAge !== null && driverAge < 18) {
                setDriverError('The driver must be at least 18 years old.');
                return;
            }
            if (license_expiry && license_expiry <= todayIso) {
                setDriverError('The driver license must not be expired.');
                return;
            }
        }
        setDriverError(null);

        checkoutForm.post(route('admin.bookings.status', booking.id), {
            preserveScroll: true,
            onSuccess: () => {
                checkoutForm.reset();
                toast.success('Vehicle checked out', { description: 'Pickup fuel, odometer and damage recorded.' });
                onSuccess?.();
            },
        });
    }

    return (
        <form onSubmit={submitCheckout} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                        <StepBadge step={1} />
                        Driver License & Company
                    </CardTitle>
                    <CardDescription>
                        Verify the driver's license and record the company before the vehicle leaves the lot.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Company (optional)
                        </Label>
                        <Input
                            type="text"
                            value={checkoutForm.data.company_name}
                            onChange={e => checkoutForm.setData('company_name', e.target.value)}
                            placeholder="e.g. Palau Pacific Resort"
                        />
                        {checkoutForm.errors.company_name && (
                            <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.company_name}</p>
                        )}
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-2">
                        <input
                            id="driver_is_renter"
                            type="checkbox"
                            checked={checkoutForm.data.driver_is_renter}
                            onChange={e => handleSameAsRenter(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                        />
                        <div>
                            <label htmlFor="driver_is_renter" className="cursor-pointer text-xs font-medium text-foreground">
                                Driver is the same as the renter
                            </label>
                            <p className="text-[11px] text-muted-foreground">
                                Auto-fills the driver name from the guest booking details.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Driver First Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={checkoutForm.data.driver_first_name}
                                onChange={e => checkoutForm.setData('driver_first_name', e.target.value)}
                                placeholder="Juan"
                            />
                            {checkoutForm.errors.driver_first_name && (
                                <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.driver_first_name}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Driver Last Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={checkoutForm.data.driver_last_name}
                                onChange={e => checkoutForm.setData('driver_last_name', e.target.value)}
                                placeholder="Remengesau"
                            />
                            {checkoutForm.errors.driver_last_name && (
                                <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.driver_last_name}</p>
                            )}
                        </div>

                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Birthdate <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="date"
                                max={todayIso}
                                value={checkoutForm.data.driver_birth_date}
                                onChange={e => checkoutForm.setData('driver_birth_date', e.target.value)}
                            />
                            {checkoutForm.errors.driver_birth_date && (
                                <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.driver_birth_date}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">Age</Label>
                            <div className={`flex h-10 items-center rounded-md border px-3 text-sm ${
                                driverAge !== null && driverAge >= 18 ? 'bg-background' : 'bg-muted/50 text-muted-foreground'
                            }`}>
                                {driverAge !== null ? `${driverAge}${driverAge < 18 ? ' (min 18)' : ''}` : '—'}
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                License Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={checkoutForm.data.license_number}
                                onChange={e => checkoutForm.setData('license_number', e.target.value)}
                                placeholder="e.g. DL-1234"
                            />
                            {driver?.masked_license && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    License on file: {driver.masked_license} — leave blank to keep it.
                                </p>
                            )}
                            {checkoutForm.errors.license_number && (
                                <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.license_number}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                License Category <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={checkoutForm.data.license_category}
                                onValueChange={v => checkoutForm.setData('license_category', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LICENSE_CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {checkoutForm.errors.license_category && (
                                <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.license_category}</p>
                            )}
                        </div>

                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                License Expiry <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="date"
                                min={todayIso}
                                value={checkoutForm.data.license_expiry}
                                onChange={e => checkoutForm.setData('license_expiry', e.target.value)}
                            />
                            {checkoutForm.errors.license_expiry && (
                                <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.license_expiry}</p>
                            )}
                        </div>
                    </div>

                    {driverError && (
                        <p className="text-xs text-destructive">{driverError}</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                        <StepBadge step={2} />
                        Vehicle State
                    </CardTitle>
                    <CardDescription>
                        Record the fuel level and odometer reading before the guest takes the car.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Fuel Level <span className="text-destructive">*</span>
                        </Label>
                        <FuelGaugeInput
                            value={checkoutForm.data.pickup_fuel}
                            onChange={v => checkoutForm.setData('pickup_fuel', v)}
                        />
                        {checkoutForm.errors.pickup_fuel && (
                            <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.pickup_fuel}</p>
                        )}
                    </div>
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Odometer <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            type="number"
                            min={0}
                            value={checkoutForm.data.pickup_odometer}
                            onChange={e => checkoutForm.setData('pickup_odometer', e.target.value)}
                            placeholder="e.g. 45200"
                        />
                        {checkoutForm.errors.pickup_odometer && (
                            <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.pickup_odometer}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                        <StepBadge step={3} />
                        Existing Damage Inspection
                    </CardTitle>
                    <CardDescription>
                        Inspect the vehicle and mark any existing damage. Click an exact spot on the diagram or
                        select a part to record damage before the guest takes the car.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="print:hidden">
                        <VehicleDamageMap
                            damages={checkoutForm.data.pickup_damages}
                            onChange={d => checkoutForm.setData('pickup_damages', d)}
                            vehicleType={booking.car.vehicle_type}
                            variant="existing"
                            size="xl"
                        />
                    </div>
                    <div className="hidden print:block">
                        <PrintDamageSummary
                            damages={checkoutForm.data.pickup_damages}
                            variant="existing"
                            vehicleType={booking.car.vehicle_type}
                        />
                    </div>
                    {checkoutForm.data.pickup_damages.length === 0 && (
                        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
                            <input
                                id="no_damage"
                                type="checkbox"
                                checked={checkoutForm.data.no_damage}
                                onChange={e => checkoutForm.setData('no_damage', e.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                            />
                            <div>
                                <label htmlFor="no_damage" className="cursor-pointer text-xs font-medium text-foreground">
                                    No existing damage to report
                                </label>
                                <p className="text-[11px] text-muted-foreground">
                                    Confirm the vehicle is free of damage before the guest takes it.
                                </p>
                            </div>
                        </div>
                    )}
                    {noDamageError && (
                        <p className="text-xs text-destructive">{noDamageError}</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                        <StepBadge step={4} />
                        Notes
                    </CardTitle>
                    <CardDescription>Optional notes about the handover.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        type="text"
                        value={checkoutForm.data.pickup_notes}
                        onChange={e => checkoutForm.setData('pickup_notes', e.target.value)}
                        placeholder="Additional notes"
                    />
                </CardContent>
            </Card>

            {remainingBalance > 0 && (
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                        <StepBadge step={5} />
                        Optional Payment
                    </CardTitle>
                        <CardDescription>
                            Remaining balance:{' '}
                            <span className="font-semibold text-foreground">{formatPrice(remainingBalance)}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">Amount</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-muted-foreground text-sm">$</span>
                                </div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={checkoutForm.data.amount}
                                    onChange={e => checkoutForm.setData('amount', e.target.value)}
                                    placeholder="0.00"
                                    className="pl-7"
                                />
                            </div>
                            {checkoutForm.errors.amount && (
                                <p className="mt-1 text-xs text-destructive">{checkoutForm.errors.amount}</p>
                            )}
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">Payment Method</Label>
                            <Select
                                value={checkoutForm.data.payment_method}
                                onValueChange={v => checkoutForm.setData('payment_method', v)}
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
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-2 pt-2">
                {cancelAction}
                <Button type="submit" className="flex-1" disabled={checkoutForm.processing}>
                    {checkoutForm.processing ? 'Saving...' : 'Check Out'}
                </Button>
            </div>
        </form>
    );
}
