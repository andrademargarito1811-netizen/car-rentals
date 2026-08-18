import { Fragment, useEffect, useRef, useState, type RefObject } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    useSwapQuote,
    formatPrice,
    formatDate,
    formatTime,
    type SwapProps,
    type SwapCar,
} from '@/Components/Bookings/useSwapQuote';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Separator } from '@/Components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    ArrowRight,
    ArrowRightLeft,
    Calendar,
    Car,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Clock,
    History,
    LayoutGrid,
    Lock,
    MapPin,
    Phone,
    Rows3,
    Search,
    TriangleAlert,
    User,
    X,
    ClipboardCheck,
} from 'lucide-react';
import SwapPriceComparison from '@/Components/Bookings/SwapPriceComparison';
import FuelGaugeInput from '@/Components/FuelGaugeInput';
import VehicleDamageMap from '@/Components/VehicleDamageMap';
import { DAMAGE_TYPES, SEVERITY_COLORS, ZONE_BY_ID, type VehicleDamage } from '@/lib/carZones';

const STYLES = `
@keyframes fadeIn { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
.anim-fade { animation: fadeIn 0.5s ease-out both; }
@keyframes popIn { 0% { opacity: 0; transform: scale(0.6); } 70% { transform: scale(1.15); } 100% { opacity: 1; transform: scale(1); } }
.anim-pop { animation: popIn 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55) both; }
`;

function formatNumber(value: number): string {
    return value.toLocaleString('en-US');
}

function formatShortDate(value: string): string {
    return new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function damageTypeLabel(value: string): string {
    return DAMAGE_TYPES.find(t => t.value === value)?.label ?? value;
}

function severityColor(value: string): string {
    return SEVERITY_COLORS[value] ?? '#94a3b8';
}

function zoneLabelOf(id: string): string {
    return ZONE_BY_ID[id]?.label ?? id;
}

function damageKey(d: VehicleDamage): string {
    return `${d.zone}|${d.type}|${d.x != null ? Math.round(d.x * 100) : ''}|${d.y != null ? Math.round(d.y * 100) : ''}`;
}

// The outgoing car's return handover must include its full condition, so the
// recorded pickup baseline is carried over (tagged as pre-existing, not
// chargeable) and only genuinely new marks — those not already present in the
// baseline — are appended.
function mergeDamageMarks(baseline: VehicleDamage[], current: VehicleDamage[]): VehicleDamage[] {
    const base = (baseline ?? []).map(d => ({ ...d, preexisting: true }));
    const baseKeys = new Set(base.map(damageKey));
    const fresh = (current ?? [])
        .filter(m => !baseKeys.has(damageKey(m)))
        .map(m => ({ ...m, preexisting: false }));
    return [...base, ...fresh];
}

function SectionBadge({ n, done }: { n: number; done: boolean }) {
    return (
        <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                done ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'
            }`}
        >
            {done ? <Check className="h-4 w-4" /> : n}
        </span>
    );
}

interface SectionHeaderProps {
    n: number;
    title: string;
    subtitle: string;
    done: boolean;
    right?: React.ReactNode;
}

function SectionHeader({ n, title, subtitle, done, right }: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-3">
            <SectionBadge n={n} done={done} />
            <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
            {right && <div className="ml-auto flex shrink-0 items-center gap-2">{right}</div>}
        </div>
    );
}

function MiniCarRow({ car, label }: { car: SwapCar; label: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {car.image_path ? (
                    <img src={`/storage/${car.image_path}`} alt={`${car.brand} ${car.model}`} className="h-full w-full object-cover" />
                ) : (
                    <Car className="h-4 w-4 text-muted-foreground" />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="truncate text-xs font-bold text-foreground">{car.brand} {car.model}</p>
            </div>
        </div>
    );
}

interface VehicleCardProps {
    car: SwapCar;
    selected: boolean;
    deltaPerDay: number;
    totalForSwap?: number;
    currentRate: number;
    onSelect: () => void;
}

function VehicleCard({ car, selected, deltaPerDay, totalForSwap, currentRate, onSelect }: VehicleCardProps) {
    const deltaChip = priceDeltaChip(deltaPerDay);

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`group relative w-full overflow-hidden rounded-2xl border bg-white text-left transition-all duration-300 cursor-pointer dark:bg-brand-800/80 ${
                selected
                    ? 'border-primary ring-2 ring-primary/30 shadow-elevated'
                    : 'border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover'
            }`}
        >
            <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700">
                {car.image_path ? (
                    <img
                        src={`/storage/${car.image_path}`}
                        alt={`${car.brand} ${car.model}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Car className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

                <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${deltaChip.cls}`}>
                    {deltaChip.label}
                </span>

                {selected && (
                    <span className="anim-pop absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <Check className="h-4 w-4" />
                    </span>
                )}

                <div className="absolute bottom-2.5 left-2.5 text-white">
                    <p className="text-base font-extrabold leading-none drop-shadow-sm">{formatPrice(car.daily_rate)}</p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/80">per day</p>
                </div>
            </div>
            <div className="space-y-2.5 p-3.5">
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{car.brand} {car.model}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {car.year && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{car.year}</span>
                        )}
                        {car.vehicle_type && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">{car.vehicle_type}</span>
                        )}
                        {car.license_plate && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">{car.license_plate}</span>
                        )}
                    </div>
                </div>
                {selected && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold text-primary">
                        <Check className="h-3 w-3" /> Selected vehicle
                    </div>
                )}
                {deltaPerDay !== 0 && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rate change</span>
                        <span className={`text-xs font-bold tabular-nums ${deltaPerDay > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatPrice(currentRate)}
                            <ArrowRight className="inline h-3 w-3 mx-0.5" />
                            {formatPrice(car.daily_rate)}
                            <span className="text-muted-foreground">/day</span>
                        </span>
                    </div>
                )}
                {typeof totalForSwap === 'number' && (
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Swap total</span>
                        <span className="text-sm font-extrabold tabular-nums text-primary">{formatPrice(totalForSwap)}</span>
                    </div>
                )}
            </div>
        </button>
    );
}

function priceDeltaChip(delta: number): { cls: string; label: string } {
    if (delta > 0) {
        return { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', label: `+${formatPrice(delta)}/day` };
    }
    if (delta < 0) {
        return { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', label: `−${formatPrice(Math.abs(delta))}/day` };
    }
    return { cls: 'bg-muted/90 text-muted-foreground ring-border', label: 'Same rate' };
}

interface VehicleListRowProps {
    car: SwapCar;
    selected: boolean;
    deltaPerDay: number;
    totalForSwap?: number;
    currentRate: number;
    onSelect: () => void;
}

function VehicleListRow({ car, selected, deltaPerDay, totalForSwap, currentRate, onSelect }: VehicleListRowProps) {
    const deltaChip = priceDeltaChip(deltaPerDay);
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all duration-300 cursor-pointer ${
                selected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-elevated'
                    : 'border-border bg-white hover:border-primary/40 hover:shadow-card-hover dark:bg-brand-800/80'
            }`}
        >
            <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {car.image_path ? (
                    <img
                        src={`/storage/${car.image_path}`}
                        alt={`${car.brand} ${car.model}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <Car className="h-5 w-5 text-muted-foreground/50" />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{car.brand} {car.model}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {car.year && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{car.year}</span>
                    )}
                    {car.vehicle_type && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">{car.vehicle_type}</span>
                    )}
                    {car.license_plate && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">{car.license_plate}</span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${deltaChip.cls}`}>
                        {deltaChip.label}
                    </span>
                </div>
            </div>
            <div className="shrink-0 text-right">
                <p className="text-sm font-extrabold tabular-nums text-foreground">
                    {formatPrice(car.daily_rate)} <span className="text-[10px] font-semibold text-muted-foreground">/day</span>
                </p>
                {deltaPerDay !== 0 && (
                    <p className={`mt-0.5 text-[10px] font-bold tabular-nums ${deltaPerDay > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatPrice(currentRate)} → {formatPrice(car.daily_rate)}
                    </p>
                )}
                {typeof totalForSwap === 'number' && (
                    <p className="mt-0.5 text-xs font-bold tabular-nums text-primary">{formatPrice(totalForSwap)}</p>
                )}
            </div>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border text-transparent group-hover:border-primary/40'
            }`}>
                <Check className="h-4 w-4" />
            </span>
        </button>
    );
}

interface HandoverCardProps {
    idPrefix: string;
    title: string;
    baselineLabel?: string;
    baselineDamages?: VehicleDamage[];
    vehicleType: string | null;
    disabled?: boolean;
    fuel: string;
    setFuel: (v: string) => void;
    odometer: string;
    setOdometer: (v: string) => void;
    notes: string;
    setNotes: (v: string) => void;
    damages: VehicleDamage[];
    setDamages: (v: VehicleDamage[]) => void;
    noDamage: boolean;
    setNoDamage: (v: boolean) => void;
    fuelError?: string;
    odometerError?: string;
    noDamageError?: string;
}

function HandoverCard({
    idPrefix,
    title,
    baselineLabel,
    baselineDamages,
    vehicleType,
    disabled = false,
    fuel,
    setFuel,
    odometer,
    setOdometer,
    notes,
    setNotes,
    damages,
    setDamages,
    noDamage,
    setNoDamage,
    fuelError,
    odometerError,
    noDamageError,
}: HandoverCardProps) {
    const fieldDisabled = disabled;
    const hasBaseline = (baselineDamages?.length ?? 0) > 0;
    const noDamageLabel = hasBaseline
        ? 'No new damage beyond the pickup baseline'
        : 'No damage to report';
    return (
        <div className={`rounded-2xl border border-border bg-muted/40 p-4 space-y-4 ${disabled ? 'opacity-60' : ''}`}>
            <div>
                <p className="text-xs font-bold text-foreground truncate" title={title}>{title}</p>
                {baselineLabel && <p className="text-[11px] text-muted-foreground mt-0.5">{baselineLabel}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`${idPrefix}-fuel`} className="text-xs font-semibold text-muted-foreground mb-1.5 block">Fuel Level <span className="text-destructive">*</span></label>
                    <div className={fieldDisabled ? 'pointer-events-none' : ''}>
                        <FuelGaugeInput value={fuel} onChange={setFuel} />
                    </div>
                    {fuelError && <p className="mt-1 text-xs text-destructive">{fuelError}</p>}
                </div>
                <div>
                    <label htmlFor={`${idPrefix}-odometer`} className="text-xs font-semibold text-muted-foreground mb-1.5 block">Odometer <span className="text-destructive">*</span></label>
                    <input
                        id={`${idPrefix}-odometer`}
                        type="number"
                        min={0}
                        disabled={fieldDisabled}
                        value={odometer}
                        onChange={e => setOdometer(e.target.value)}
                        placeholder="e.g. 45200"
                        className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted disabled:text-muted-foreground dark:bg-brand-900"
                    />
                    {odometerError && <p className="mt-1 text-xs text-destructive">{odometerError}</p>}
                </div>
            </div>
            <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Damage marks</label>

                {hasBaseline && (
                    <div className="mb-2 rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800/60 dark:bg-blue-900/20">
                        <p className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                            <span>Pre-existing at pickup</span>
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-800/60 dark:text-blue-200">
                                {baselineDamages!.length}
                            </span>
                        </p>
                        <ul className="mt-1.5 space-y-1">
                            {baselineDamages!.map((d, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-[11px] text-blue-900 dark:text-blue-100">
                                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: severityColor(d.severity) }} />
                                    <span className="font-semibold">{zoneLabelOf(d.zone)}</span>
                                    <span className="text-blue-700/70 dark:text-blue-200/70">· {damageTypeLabel(d.type)}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-1.5 border-t border-blue-200/60 pt-1.5 text-[10px] text-blue-700/70 dark:border-blue-800/60 dark:text-blue-200/70">
                            Mark any new damage below — the pickup marks above are carried over unchanged.
                        </p>
                    </div>
                )}

                <div className={fieldDisabled ? 'pointer-events-none' : ''}>
                    <VehicleDamageMap
                        damages={damages}
                        onChange={setDamages}
                        vehicleType={vehicleType}
                        variant="existing"
                        size="md"
                        stacked
                    />
                </div>
                {damages.length === 0 && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-white p-3 dark:bg-brand-900">
                        <input
                            id={`${idPrefix}-no-damage`}
                            type="checkbox"
                            disabled={fieldDisabled}
                            checked={noDamage}
                            onChange={e => setNoDamage(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                        />
                        <label htmlFor={`${idPrefix}-no-damage`} className="cursor-pointer text-xs font-medium text-muted-foreground">
                            {noDamageLabel}
                        </label>
                    </div>
                )}
                {noDamageError && <p className="mt-1 text-xs text-destructive">{noDamageError}</p>}
            </div>
            <div>
                <label htmlFor={`${idPrefix}-notes`} className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notes</label>
                <input
                    id={`${idPrefix}-notes`}
                    type="text"
                    disabled={fieldDisabled}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Additional notes"
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted disabled:text-muted-foreground dark:bg-brand-900"
                />
            </div>
        </div>
    );
}

function BookingInfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold text-foreground leading-snug break-words">{value}</p>
            </div>
        </div>
    );
}

type SortBy = 'default' | 'rate-asc' | 'rate-desc' | 'delta-asc';

export default function AdminBookingSwap({ booking, cars, swaps, quoteUrl, submitUrl, backUrl, isAdmin, pickup_handover, carDamages }: SwapProps) {
    const route = useRoute();
    const {
        flash,
        flashVisible,
        setFlashVisible,
        swapDate,
        setSwapDate,
        swapTime,
        setSwapTime,
        selectedCarId,
        setSelectedCarId,
        quote,
        quoteError,
        quoteLoading,
        quoteTime,
        minDate,
        maxDate,
        minSwapTime,
        captureHandover,
        handoverComplete,
        hasHandoverInput,
        form,
        submit,
    } = useSwapQuote({ booking, quoteUrl, submitUrl, captureHandover: isAdmin });

    const [handoverOpen, setHandoverOpen] = useState(true);
    const [historyOpen, setHistoryOpen] = useState((swaps?.length ?? 0) <= 2);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortBy>('default');
    const [search, setSearch] = useState('');
    const [maxPrice, setMaxPrice] = useState<string>('any');
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const whenRef = useRef<HTMLDivElement>(null);
    const handoverRef = useRef<HTMLDivElement>(null);
    const reviewRef = useRef<HTMLDivElement>(null);

    const selectedCar = quote && !quoteLoading ? quote.to_car : (cars.find(c => c.id === selectedCarId) ?? null);
    const pendingCar = cars.find(c => c.id === selectedCarId) ?? null;
    const availableCars = cars.filter(c => c.id !== booking.car.id);

    const pickupOdo = pickup_handover?.odometer ?? null;
    const baselineOut = pickup_handover?.damages ?? [];

    // Where the swap sits in the rental window (0..1) for the summary timeline.
    const swapSplitPct = (() => {
        const start = new Date(booking.start_date + 'T00:00:00').getTime();
        const end = new Date(booking.end_date + 'T00:00:00').getTime() + 86400000;
        const sw = new Date(swapDate + 'T00:00:00').getTime();
        const total = Math.max(1, end - start);
        return Math.min(1, Math.max(0, (sw - start) / total));
    })();

    // Carry the pickup baseline into the recorded return handover so the
    // outgoing car's full condition is preserved, then submit as usual.
    const handleSubmit = () => {
        if (captureHandover && baselineOut.length > 0) {
            form.setData('swap_out_damages', mergeDamageMarks(baselineOut, form.data.swap_out_damages));
        }
        submit();
    };

    // Prefill the returning vehicle's fuel/odometer/notes from the recorded
    // pickup state so staff only confirm/edit readings. Damage marks are NOT
    // pre-filled: the pickup baseline is shown read-only and carried over at
    // submit, so staff must actively confirm or add new marks.
    useEffect(() => {
        if (!captureHandover || !pickup_handover) return;
        form.setData(d => ({
            ...d,
            swap_out_fuel: d.swap_out_fuel !== '' ? d.swap_out_fuel : String(pickup_handover?.fuel_level ?? ''),
            swap_out_odometer: d.swap_out_odometer !== '' ? d.swap_out_odometer : String(pickup_handover?.odometer ?? ''),
            swap_out_notes: d.swap_out_notes !== '' ? d.swap_out_notes : (pickup_handover?.notes ?? ''),
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Warn before leaving the page with unrecorded inspection data.
    useEffect(() => {
        if (!hasHandoverInput) return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasHandoverInput]);

    // Changing any filter/search/sort resets pagination back to the first page.
    useEffect(() => {
        setPage(1);
    }, [filterType, search, maxPrice, sortBy]);

    // Switching the replacement car resets its baseline and prefills the car's
    // most recent known damage marks so staff confirm/edit them. Known marks are
    // tagged pre-existing so they are never treated as newly-found damage.
    const handleSelectCar = (id: number | null) => {
        setSelectedCarId(id);
        if (id === null) return;
        const previousDamages = (carDamages?.[id] ?? []).map(d => ({ ...d, preexisting: true }));
        form.setData(d => ({
            ...d,
            swap_in_fuel: '',
            swap_in_odometer: '',
            swap_in_notes: '',
            swap_in_damages: previousDamages,
            swap_in_no_damage: false,
        }));
    };

    const handleSwapOutDamages = (d: VehicleDamage[]) => {
        form.setData('swap_out_damages', d);
        if (d.length > 0) form.setData('swap_out_no_damage', false);
    };

    const handleSwapInDamages = (d: VehicleDamage[]) => {
        form.setData('swap_in_damages', d);
        if (d.length > 0) form.setData('swap_in_no_damage', false);
    };

    // A quote is only trustworthy while it reflects the current selection.
    const quoteIsStale = !!quote && (quote.swap_date !== swapDate || quoteTime !== swapTime || quote.to_car?.id !== selectedCarId);
    const quoteReady = !!quote && !quoteError && !quoteIsStale && !quoteLoading;

    // The returning vehicle's odometer cannot be lower than its recorded pickup.
    const swapOutOdoInvalid = captureHandover && pickupOdo !== null
        && form.data.swap_out_odometer !== ''
        && Number(form.data.swap_out_odometer) < Number(pickupOdo);
    const swapOutOdoError = form.errors.swap_out_odometer
        ?? (swapOutOdoInvalid ? `Must be at least the pickup odometer (${formatNumber(pickupOdo!)} km).` : undefined);

    const swapOutComplete = captureHandover
        && form.data.swap_out_fuel !== ''
        && form.data.swap_out_odometer !== ''
        && (form.data.swap_out_no_damage || form.data.swap_out_damages.length > 0);
    const swapInComplete = captureHandover
        && selectedCarId !== null
        && form.data.swap_in_fuel !== ''
        && form.data.swap_in_odometer !== ''
        && (form.data.swap_in_no_damage || form.data.swap_in_damages.length > 0);

    const canReview = captureHandover
        ? handoverComplete && !swapOutOdoInvalid && quoteReady
        : quoteReady;

    const goTo = (ref: RefObject<HTMLDivElement | null>) =>
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const progress = [
        { id: 'when', label: 'Vehicle & date', icon: Car, done: selectedCarId !== null, ref: whenRef },
        { id: 'handover', label: 'Handover', icon: ClipboardCheck, done: !captureHandover || handoverComplete, ref: handoverRef },
        { id: 'review', label: 'Review & confirm', icon: CheckCircle2, done: quoteReady, ref: reviewRef },
    ];
    const activeIndex = progress.findIndex(p => !p.done);
    const doneCount = progress.filter(p => p.done).length;
    const currentStep = activeIndex === -1 ? progress.length : activeIndex + 1;

    const confirmLabel = form.processing
        ? 'Applying…'
        : quoteLoading
            ? 'Checking availability…'
            : !selectedCarId
                ? 'Select a vehicle'
                : !quoteReady
                    ? 'Waiting for price'
                    : 'Confirm Vehicle Swap';

    const footerHint = () => {
        if (quoteError) return 'Resolve the availability issue to continue.';
        if (quoteLoading || quoteIsStale) {
            return (
                <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {selectedCarId && pendingCar ? `Checking availability for ${pendingCar.brand} ${pendingCar.model}…` : 'Checking availability…'}
                </span>
            );
        }
        if (!selectedCarId) return 'Choose a vehicle to continue.';
        if (!quote) return 'Fetching the price for the selected vehicle…';
        if (captureHandover && !handoverComplete) return 'Complete the vehicle handover fields to continue.';
        if (swapOutOdoInvalid) return "The returning vehicle's odometer must be at least the pickup reading.";
        if (!quoteReady) return 'Waiting for an updated price…';
        return <span className="font-semibold text-foreground">New total {formatPrice(quote!.new_total_amount)}</span>;
    };

    const guestName = booking.guest
        ? `${booking.guest.first_name} ${booking.guest.last_name}`
        : booking.user?.name ?? '—';
    const guestEmail = booking.guest?.email ?? booking.user?.email;
    const guestPhone = booking.guest?.phone ?? booking.user?.phone;

    // Filtering / sorting / pagination for the replacement-vehicle grid.
    const PRICE_LIMITS = [
        { value: 'any', label: 'Any price' },
        { value: '50', label: 'Under $50/day' },
        { value: '100', label: 'Under $100/day' },
        { value: '150', label: 'Under $150/day' },
        { value: '250', label: 'Under $250/day' },
        { value: '500', label: 'Under $500/day' },
    ];
    const types = Array.from(new Set(availableCars.map(c => c.vehicle_type).filter((t): t is string => !!t)));

    const searchTerm = search.trim().toLowerCase();
    const filteredCars = availableCars.filter(c => {
        if (filterType && c.vehicle_type !== filterType) return false;
        if (maxPrice !== 'any' && c.daily_rate > Number(maxPrice)) return false;
        if (searchTerm) {
            const haystack = `${c.brand} ${c.model} ${c.vehicle_type ?? ''} ${c.year ?? ''} ${c.license_plate ?? ''}`.toLowerCase();
            if (!haystack.includes(searchTerm)) return false;
        }
        return true;
    });

    const sortedCars = sortBy === 'rate-asc'
        ? [...filteredCars].sort((a, b) => a.daily_rate - b.daily_rate)
        : sortBy === 'rate-desc'
            ? [...filteredCars].sort((a, b) => b.daily_rate - a.daily_rate)
            : sortBy === 'delta-asc'
                ? [...filteredCars].sort((a, b) => (a.daily_rate - booking.car.daily_rate) - (b.daily_rate - booking.car.daily_rate))
                : filteredCars;

    const PAGE_SIZE = 9;
    const totalPages = Math.max(1, Math.ceil(sortedCars.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pagedCars = sortedCars.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const hasActiveFilters = !!filterType || !!searchTerm || maxPrice !== 'any';

    const chipBase = 'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer';
    const chipIdle = 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary dark:bg-brand-800/80';
    const chipActive = 'border-transparent bg-primary text-primary-foreground shadow-sm';

    return (
        <>
            <Head title={`Swap Vehicle #${booking.reference_code ?? booking.id}`} />
            <AuthenticatedLayout
                header={
                    <div className="border-b border-border bg-gradient-to-b from-muted/30 to-background">
                        <div className="relative max-w-screen-2xl mx-auto px-4 py-5">
                            <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                                <Link href={route('admin.reservations.index')} className="hover:text-foreground transition-colors">
                                    Reservations
                                </Link>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <Link href={route('admin.bookings.show', booking.id)} className="hover:text-foreground transition-colors">
                                    {booking.reference_code ?? `#${booking.id}`}
                                </Link>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span className="text-foreground font-medium truncate">Swap Vehicle</span>
                            </nav>
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                                        <ArrowRightLeft className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Swap Vehicle</p>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">
                                            {booking.reference_code ?? `#${booking.id}`}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">{booking.car.brand} {booking.car.model}</span>
                                            <span>·</span>
                                            <span>{formatDate(booking.start_date)} — {formatDate(booking.end_date)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Badge variant={booking.status === 'active' ? 'active' : 'confirmed'}>
                                        {booking.status}
                                    </Badge>
                                    <Link href={backUrl}>
                                        <Button type="button" variant="outline">Back to Booking</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                <style>{STYLES}</style>
                <div className="px-4 py-6 space-y-4 max-w-screen-2xl mx-auto">
                    {flashVisible && flash?.success && (
                        <div className="anim-fade flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flashVisible && flash?.error && (
                        <div className="anim-fade flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700 dark:bg-red-800 dark:text-red-300">✕</span>
                            <span>{flash.error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
                        {/* Main column */}
                        <div className="space-y-5">
                            {/* Hero + progress */}
                            <div className="anim-fade overflow-hidden rounded-2xl border border-border bg-white shadow-card dark:bg-brand-800/80">
                                <div className="flex items-center gap-3 px-4 py-4 sm:px-5 border-b border-border">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                                        <ArrowRightLeft className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold text-foreground">Swap to another vehicle</h2>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                            Your rental is unchanged; only the daily-rate difference on the new vehicle applies from the swap time onward.
                                        </p>
                                    </div>
                                </div>

                                <nav className="px-4 pt-4 pb-3 sm:px-5" aria-label="Swap steps">
                                    <ol className="flex w-full items-start">
                                        {progress.map((p, i) => {
                                            const isLast = i === progress.length - 1;
                                            const active = i === activeIndex;
                                            const Icon = p.icon;
                                            return (
                                                <Fragment key={p.id}>
                                                    <li className={`flex min-w-0 flex-col items-center ${isLast ? '' : 'flex-1'}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => goTo(p.ref)}
                                                            aria-current={active ? 'step' : undefined}
                                                            className="group flex flex-col items-center gap-1.5"
                                                        >
                                                            <span
                                                                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                                                                    p.done
                                                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                                        : active
                                                                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/15 shadow-md shadow-primary/25'
                                                                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                                                }`}
                                                            >
                                                                {p.done ? <Check className="anim-pop h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                                            </span>
                                                            <span
                                                                className={`max-w-[7rem] truncate text-[11px] font-bold leading-tight transition-colors ${
                                                                    p.done
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : active
                                                                            ? 'text-foreground'
                                                                            : 'text-muted-foreground group-hover:text-primary'
                                                                }`}
                                                            >
                                                                {p.label}
                                                            </span>
                                                        </button>
                                                    </li>
                                                    {!isLast && (
                                                        <li className="mx-2 mt-[16px] flex-1 sm:mx-3" aria-hidden="true">
                                                            <div className="relative h-1 overflow-hidden rounded-full bg-border">
                                                                <span
                                                                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 ${
                                                                        p.done ? 'w-full' : 'w-0'
                                                                    }`}
                                                                />
                                                            </div>
                                                        </li>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </ol>
                                    <div className="mt-3.5 flex items-center justify-between gap-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Step {currentStep} of {progress.length}
                                        </p>
                                        <div
                                            className="h-1 w-28 overflow-hidden rounded-full bg-border"
                                            role="progressbar"
                                            aria-valuemin={0}
                                            aria-valuemax={progress.length}
                                            aria-valuenow={doneCount}
                                        >
                                            <span
                                                className="block h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                                                style={{ width: `${(doneCount / progress.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </nav>
                            </div>

                            {/* Step 1 — Vehicle & date */}
                            <section id="swap-when" ref={whenRef} className="anim-fade scroll-mt-24 space-y-5 rounded-2xl border border-border bg-white p-4 shadow-card sm:p-5 dark:bg-brand-800/80" style={{ animationDelay: '60ms' }}>
                                <SectionHeader
                                    n={1}
                                    title="When & which vehicle"
                                    subtitle="Choose the return moment and the replacement vehicle."
                                    done={selectedCarId !== null}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-border bg-white p-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 dark:bg-brand-800/80">
                                        <label htmlFor="swap-date" className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-2">
                                            <Calendar className="h-3.5 w-3.5 text-primary" /> Swap date
                                        </label>
                                        <Input
                                            id="swap-date"
                                            type="date"
                                            min={minDate}
                                            max={maxDate}
                                            value={swapDate}
                                            onChange={e => setSwapDate(e.target.value)}
                                        />
                                        <p className="text-[11px] text-muted-foreground mt-2">Day the current vehicle is returned. Same-day swaps are allowed after 2 hours of use.</p>
                                    </div>
                                    <div className="rounded-2xl border border-border bg-white p-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 dark:bg-brand-800/80">
                                        <label htmlFor="swap-time" className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-2">
                                            <Clock className="h-3.5 w-3.5 text-primary" /> Swap time
                                        </label>
                                        <Input
                                            id="swap-time"
                                            type="time"
                                            min={swapDate === booking.start_date ? minSwapTime : undefined}
                                            value={swapTime}
                                            onChange={e => setSwapTime(e.target.value)}
                                        />
                                        <p className="text-[11px] text-muted-foreground mt-2">
                                            {swapDate === booking.start_date
                                                ? `Same-day swap requires at least 2 hours of use (${minSwapTime} or later).`
                                                : 'Return time for the current vehicle.'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                        <p className="text-xs font-bold text-muted-foreground">
                                            Available alternative vehicles
                                            {cars.length > availableCars.length && (
                                                <span className="font-semibold text-muted-foreground/70"> — current vehicle excluded</span>
                                            )}
                                        </p>
                                        {availableCars.length > 0 && (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                                {hasActiveFilters ? `${sortedCars.length} of ${availableCars.length}` : `${availableCars.length}`} available
                                            </span>
                                        )}
                                    </div>

                                    {/* Toolbar: search + price + sort + view toggle */}
                                    <div className="mb-3 flex flex-wrap items-center gap-2.5">
                                        <div className="relative min-w-[200px] flex-1">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                placeholder="Search brand, model, type, year, plate…"
                                                className="h-9 pl-8 pr-9 text-xs"
                                            />
                                            {search && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearch('')}
                                                    aria-label="Clear search"
                                                    className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/20 hover:text-primary"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <Select value={maxPrice} onValueChange={v => setMaxPrice(v)}>
                                            <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs font-semibold">
                                                <SelectValue placeholder="Price" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PRICE_LIMITS.map(p => (
                                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={sortBy} onValueChange={v => setSortBy(v as SortBy)}>
                                            <SelectTrigger className="h-9 w-[170px] rounded-xl text-xs font-semibold">
                                                <SelectValue placeholder="Sort" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Default order</SelectItem>
                                                <SelectItem value="delta-asc">Cheapest swap first</SelectItem>
                                                <SelectItem value="rate-asc">Price: low to high</SelectItem>
                                                <SelectItem value="rate-desc">Price: high to low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex shrink-0 overflow-hidden rounded-xl border border-border">
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('grid')}
                                                aria-pressed={viewMode === 'grid'}
                                                title="Grid view"
                                                className={`flex h-9 w-9 items-center justify-center transition-colors ${
                                                    viewMode === 'grid'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-white text-muted-foreground hover:text-foreground dark:bg-brand-800/80'
                                                }`}
                                            >
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('list')}
                                                aria-pressed={viewMode === 'list'}
                                                title="List view"
                                                className={`flex h-9 w-9 items-center justify-center border-l border-border transition-colors ${
                                                    viewMode === 'list'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-white text-muted-foreground hover:text-foreground dark:bg-brand-800/80'
                                                }`}
                                            >
                                                <Rows3 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Type filter chips */}
                                    {types.length > 1 && (
                                        <div className="mb-3 flex flex-wrap items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setFilterType(null)}
                                                className={`${chipBase} ${filterType === null ? chipActive : chipIdle}`}
                                            >
                                                All
                                            </button>
                                            {types.map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setFilterType(filterType === t ? null : t)}
                                                    className={`${chipBase} capitalize ${filterType === t ? chipActive : chipIdle}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {sortedCars.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
                                            <Car className="mx-auto h-8 w-8 text-muted-foreground/50" />
                                            <p className="mt-3 text-sm font-semibold text-foreground">No vehicles match your filters</p>
                                            <p className="mt-1 text-xs text-muted-foreground">Try clearing the search or filters.</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="mt-4"
                                                onClick={() => { setFilterType(null); setSearch(''); setMaxPrice('any'); }}
                                            >
                                                Clear filters
                                            </Button>
                                        </div>
                                    ) : viewMode === 'list' ? (
                                        <div className="space-y-2">
                                            {pagedCars.map(car => {
                                                const selected = selectedCarId === car.id;
                                                const totalForSwap = quoteReady && quote?.to_car?.id === car.id
                                                    ? quote.to_subtotal
                                                    : undefined;
                                                return (
                                                    <VehicleListRow
                                                        key={car.id}
                                                        car={car}
                                                        selected={selected}
                                                        deltaPerDay={car.daily_rate - booking.car.daily_rate}
                                                        totalForSwap={totalForSwap}
                                                        currentRate={booking.car.daily_rate}
                                                        onSelect={() => handleSelectCar(selected ? null : car.id)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                                            {pagedCars.map(car => {
                                                const selected = selectedCarId === car.id;
                                                const totalForSwap = quoteReady && quote?.to_car?.id === car.id
                                                    ? quote.to_subtotal
                                                    : undefined;
                                                return (
                                                    <VehicleCard
                                                        key={car.id}
                                                        car={car}
                                                        selected={selected}
                                                        deltaPerDay={car.daily_rate - booking.car.daily_rate}
                                                        totalForSwap={totalForSwap}
                                                        currentRate={booking.car.daily_rate}
                                                        onSelect={() => handleSelectCar(selected ? null : car.id)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {sortedCars.length > PAGE_SIZE && (
                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                            <p className="text-xs text-muted-foreground">
                                                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, sortedCars.length)} of {sortedCars.length}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="px-1 text-xs font-bold text-foreground tabular-nums">Page {currentPage} / {totalPages}</span>
                                                <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Step 2 — Vehicle handover */}
                            {captureHandover && (
                                <section id="swap-handover" ref={handoverRef} className="anim-fade scroll-mt-24 space-y-5 rounded-2xl border border-border bg-white p-4 shadow-card sm:p-5 dark:bg-brand-800/80" style={{ animationDelay: '120ms' }}>
                                    <div className="flex items-center gap-3">
                                        <SectionBadge n={2} done={handoverComplete} />
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-foreground">Vehicle handover</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Record the return and replacement states so each car is charged against its own baseline.
                                            </p>
                                        </div>
                                        <div className="ml-auto flex shrink-0 items-center gap-2">
                                            {selectedCarId !== null && (
                                                <>
                                                    <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${swapOutComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {swapOutComplete ? <CheckCircle2 className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
                                                        Returning
                                                    </span>
                                                    <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${swapInComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {swapInComplete ? <CheckCircle2 className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
                                                        Replacement
                                                    </span>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setHandoverOpen(o => !o)}
                                                aria-expanded={handoverOpen}
                                                aria-label="Toggle handover fields"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
                                            >
                                                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${handoverOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {selectedCarId === null ? (
                                        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-5">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                                <Lock className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Select a vehicle to unlock handover</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Return and replacement states can only be recorded once a vehicle is chosen.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        handoverOpen && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <HandoverCard
                                                    idPrefix="swap-out"
                                                    title={`Returning vehicle — ${booking.car.brand} ${booking.car.model}`}
                                                    baselineLabel={pickup_handover
                                                        ? `Pickup baseline · ${formatNumber(pickupOdo ?? 0)} km · ${pickup_handover.fuel_level ?? '—'}/8 fuel${baselineOut.length ? ` · ${baselineOut.length} damage mark${baselineOut.length > 1 ? 's' : ''}` : ''}`
                                                        : undefined}
                                                    baselineDamages={baselineOut}
                                                    vehicleType={booking.car.vehicle_type ?? null}
                                                    fuel={form.data.swap_out_fuel}
                                                    setFuel={v => form.setData('swap_out_fuel', v)}
                                                    odometer={form.data.swap_out_odometer}
                                                    setOdometer={v => form.setData('swap_out_odometer', v)}
                                                    notes={form.data.swap_out_notes}
                                                    setNotes={v => form.setData('swap_out_notes', v)}
                                                    damages={form.data.swap_out_damages}
                                                    setDamages={handleSwapOutDamages}
                                                    noDamage={form.data.swap_out_no_damage}
                                                    setNoDamage={v => form.setData('swap_out_no_damage', v)}
                                                    fuelError={form.errors.swap_out_fuel}
                                                    odometerError={swapOutOdoError}
                                                    noDamageError={form.errors.swap_out_no_damage}
                                                />
                                                <HandoverCard
                                                    idPrefix="swap-in"
                                                    title={`Replacement vehicle — ${selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : 'select a vehicle above'}`}
                                                    baselineLabel={carDamages?.[selectedCarId ?? '']?.length
                                                        ? 'Existing damage marks pre-filled — confirm or edit.'
                                                        : undefined}
                                                    vehicleType={selectedCar?.vehicle_type ?? null}
                                                    disabled={selectedCarId === null}
                                                    fuel={form.data.swap_in_fuel}
                                                    setFuel={v => form.setData('swap_in_fuel', v)}
                                                    odometer={form.data.swap_in_odometer}
                                                    setOdometer={v => form.setData('swap_in_odometer', v)}
                                                    notes={form.data.swap_in_notes}
                                                    setNotes={v => form.setData('swap_in_notes', v)}
                                                    damages={form.data.swap_in_damages}
                                                    setDamages={handleSwapInDamages}
                                                    noDamage={form.data.swap_in_no_damage}
                                                    setNoDamage={v => form.setData('swap_in_no_damage', v)}
                                                    fuelError={form.errors.swap_in_fuel}
                                                    odometerError={form.errors.swap_in_odometer}
                                                    noDamageError={form.errors.swap_in_no_damage}
                                                />
                                            </div>
                                        )
                                    )}
                                </section>
                            )}

                            {/* Step 3 — Review & confirm */}
                            <section id="swap-review" ref={reviewRef} className="anim-fade scroll-mt-24 space-y-5 rounded-2xl border border-border bg-white p-4 shadow-card sm:p-5 dark:bg-brand-800/80" style={{ animationDelay: '180ms' }}>
                                <SectionHeader
                                    n={captureHandover ? 3 : 2}
                                    title="Review & confirm"
                                    subtitle="Confirm the price change and the newly assigned vehicle."
                                    done={quoteReady}
                                />

                                {quoteReady && quote ? (
                                    <>
                                        <div className="rounded-2xl border border-border bg-muted/40 p-4 flex flex-wrap items-center gap-2 text-sm">
                                            <span className="font-semibold text-foreground">{booking.car.brand} {booking.car.model}</span>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-semibold text-foreground">{quote.to_car?.brand} {quote.to_car?.model}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">{formatDate(quote.swap_date)} · {swapTime ? formatTime(swapTime) : '—'}</span>
                                        </div>
                                        <SwapPriceComparison
                                            fromSubtotal={quote.from_subtotal}
                                            toSubtotal={quote.to_subtotal}
                                            oldTotal={quote.old_total_amount}
                                            newTotal={quote.new_total_amount}
                                            priceDelta={quote.price_delta}
                                            taxes={quote.taxes}
                                            fromLabel={booking.car.brand}
                                            toLabel={quote.to_car?.brand ?? 'New vehicle'}
                                        />
                                        <div className="border-t border-border pt-4">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">What's changing</p>
                                            <div className="space-y-1.5">
                                                {quote.segments.map((seg, i) => (
                                                    <div key={i} className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">
                                                            {seg.car?.brand} {seg.car?.model} · {seg.days} {seg.days === 1 ? 'day' : 'days'}
                                                        </span>
                                                        <span className="font-semibold text-foreground tabular-nums">{formatPrice(seg.subtotal)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                            <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 dark:text-amber-400" />
                                            <p className="text-xs text-amber-800 dark:text-amber-200">
                                                This changes the assigned vehicle and the booking total
                                                ({formatPrice(quote.old_total_amount)} → {formatPrice(quote.new_total_amount)}).
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
                                        {quoteLoading ? (
                                            <>
                                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
                                                <p className="mt-3 text-xs font-medium text-muted-foreground">
                                                    {selectedCarId && pendingCar ? `Checking availability for ${pendingCar.brand} ${pendingCar.model}…` : 'Checking availability…'}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Car className="mx-auto h-8 w-8 text-muted-foreground/50" />
                                                <p className="mt-3 text-sm font-semibold text-foreground">
                                                    {selectedCarId ? 'Price breakdown will appear here once confirmed.' : 'Select a vehicle above to see the price breakdown.'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </section>

                            {quoteError && (
                                <div className="anim-fade flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                                    <TriangleAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5 dark:text-red-400" />
                                    <p className="text-sm font-medium">{quoteError}</p>
                                </div>
                            )}

                            {/* Sticky floating action bar */}
                            <div className="sticky bottom-0 z-10">
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/95 px-5 py-4 shadow-elevated backdrop-blur dark:bg-brand-800/95">
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                        {footerHint()}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Link href={backUrl}>
                                            <Button type="button" variant="outline">Cancel</Button>
                                        </Link>
                                        <Button type="button" onClick={handleSubmit} disabled={!canReview || form.processing}>
                                            {confirmLabel}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-4">
                            <Card className="anim-fade hover:translate-y-0 hover:shadow-card">
                                <CardHeader className="p-4 pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4 text-primary" />
                                        Swap summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-4">
                                    <div className="space-y-2">
                                        <MiniCarRow car={booking.car} label="Current vehicle" />
                                        <div className="flex items-center gap-2 pl-1">
                                            <span className="h-px flex-1 bg-border" />
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                            <span className="h-px flex-1 bg-border" />
                                        </div>
                                        {selectedCar ? (
                                            <MiniCarRow car={selectedCar} label="New vehicle" />
                                        ) : (
                                            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                    <Car className="h-4 w-4" />
                                                </span>
                                                <p className="text-xs font-medium text-muted-foreground">Select a vehicle to continue</p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedCar && quoteReady && quote && (
                                        <div className="rounded-xl bg-muted/40 p-3 space-y-2">
                                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-border">
                                                <div
                                                    className="absolute inset-y-0 left-0 rounded-full bg-primary/30"
                                                    style={{ width: `${Math.max(swapSplitPct * 100, 3)}%` }}
                                                />
                                                <div
                                                    className="absolute inset-y-0 rounded-full bg-accent/50"
                                                    style={{ left: `${Math.max(swapSplitPct * 100, 3)}%`, right: 0 }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-muted-foreground">
                                                <span className="truncate">{booking.car.brand} · {formatShortDate(booking.start_date)}</span>
                                                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                                <span className="truncate text-right">{quote.to_car?.brand} · {formatShortDate(booking.end_date)}</span>
                                            </div>
                                            <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                                Swap at {swapTime ? formatTime(swapTime) : '—'} · {formatShortDate(swapDate)}
                                            </p>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" /> Swap date
                                            </span>
                                            <span className="font-semibold text-foreground text-right">{formatDate(swapDate)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" /> Swap time
                                            </span>
                                            <span className="font-semibold text-foreground text-right">{swapTime ? formatTime(swapTime) : '—'}</span>
                                        </div>
                                    </div>

                                    {captureHandover && selectedCarId !== null && (
                                        <div className="space-y-1.5 text-xs">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Handover</p>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <ArrowRightLeft className="h-3.5 w-3.5" /> Returning
                                                </span>
                                                <span className="font-semibold text-foreground text-right tabular-nums">
                                                    {form.data.swap_out_fuel || '—'}/8 · {form.data.swap_out_odometer ? `${formatNumber(Number(form.data.swap_out_odometer))} km` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Car className="h-3.5 w-3.5" /> Replacement
                                                </span>
                                                <span className="font-semibold text-foreground text-right tabular-nums">
                                                    {form.data.swap_in_fuel || '—'}/8 · {form.data.swap_in_odometer ? `${formatNumber(Number(form.data.swap_in_odometer))} km` : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">Current total</span>
                                            <span className="font-semibold tabular-nums text-foreground">{formatPrice(booking.total_amount)}</span>
                                        </div>
                                        {quoteLoading || quoteIsStale ? (
                                            <div className="space-y-2 pt-1">
                                                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                                                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                                            </div>
                                        ) : quoteError ? (
                                            <p className="flex items-start gap-1.5 pt-1 text-xs font-medium text-destructive">
                                                <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {quoteError}
                                            </p>
                                        ) : quoteReady && quote ? (
                                            <div className="mt-1 space-y-1.5 rounded-xl bg-muted/40 p-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">New total</span>
                                                    <span className="font-extrabold tabular-nums text-accent-600 dark:text-accent-400">{formatPrice(quote.new_total_amount)}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-border pt-1.5">
                                                    <span className="text-xs text-muted-foreground">Difference</span>
                                                    <span className={`text-sm font-extrabold tabular-nums ${quote.price_delta > 0 ? 'text-amber-600 dark:text-amber-400' : quote.price_delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                                        {quote.price_delta < 0 ? '-' : quote.price_delta > 0 ? '+' : ''}{formatPrice(Math.abs(quote.price_delta))}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="pt-1 text-xs text-muted-foreground">Select a vehicle to see the new total.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {(swaps?.length ?? 0) > 0 && (
                                <Card className="anim-fade hover:translate-y-0 hover:shadow-card" style={{ animationDelay: '120ms' }}>
                                    <button
                                        type="button"
                                        onClick={() => setHistoryOpen(o => !o)}
                                        aria-expanded={historyOpen}
                                        className="w-full flex items-center gap-2 p-4 pb-3 text-left"
                                    >
                                        <History className="w-4 h-4 text-violet-500 shrink-0" />
                                        <CardTitle className="text-sm flex-1">Vehicle swap history</CardTitle>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{swaps.length}</span>
                                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${historyOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {historyOpen && (
                                        <CardContent className="p-4 pt-1 space-y-2">
                                            {swaps.map((swap, i) => (
                                                <div key={swap.id} className="rounded-xl border border-border px-3 py-2.5">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-semibold text-foreground truncate">{swap.from_car?.brand} {swap.from_car?.model}</span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                        <span className="font-semibold text-foreground truncate">{swap.to_car?.brand} {swap.to_car?.model}</span>
                                                    </div>
                                                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                                                        <span className="text-muted-foreground">
                                                            Swap #{i + 1} · {formatDate(swap.swap_date)}{swap.swap_time ? ` · ${formatTime(swap.swap_time)}` : ''}
                                                        </span>
                                                        <span className={`font-bold tabular-nums ${Number(swap.price_delta) < 0 ? 'text-emerald-600 dark:text-emerald-400' : Number(swap.price_delta) > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                                            {Number(swap.price_delta) < 0 ? '-' : Number(swap.price_delta) > 0 ? '+' : ''}{formatPrice(Math.abs(Number(swap.price_delta)))}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    )}
                                </Card>
                            )}

                            <Card className="anim-fade hover:translate-y-0 hover:shadow-card" style={{ animationDelay: '240ms' }}>
                                <CardHeader className="p-4 pb-3">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm flex items-center gap-2 flex-1">
                                            <User className="w-4 h-4 text-primary" />
                                            Booking details
                                        </CardTitle>
                                        <span className="text-xs font-semibold text-muted-foreground">{booking.reference_code ?? `#${booking.id}`}</span>
                                        <Badge variant={booking.status === 'active' ? 'active' : 'confirmed'}>{booking.status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-3">
                                    <BookingInfoRow icon={<User className="h-3.5 w-3.5" />} label="Customer" value={guestName} />
                                    {guestEmail && (
                                        <BookingInfoRow
                                            icon={<span className="text-xs">@</span>}
                                            label="Email"
                                            value={<a href={`mailto:${guestEmail}`} className="break-all text-foreground transition-colors hover:text-primary">{guestEmail}</a>}
                                        />
                                    )}
                                    {guestPhone && (
                                        <BookingInfoRow
                                            icon={<Phone className="h-3.5 w-3.5" />}
                                            label="Phone"
                                            value={<a href={`tel:${guestPhone}`} className="text-foreground transition-colors hover:text-primary">{guestPhone}</a>}
                                        />
                                    )}
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                                            {booking.car.image_path ? (
                                                <img src={`/storage/${booking.car.image_path}`} alt={`${booking.car.brand} ${booking.car.model}`} className="h-full w-full object-cover" />
                                            ) : (
                                                <Car className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vehicle</p>
                                            <p className="text-xs font-semibold text-foreground leading-snug break-words">
                                                {[
                                                    `${booking.car.brand} ${booking.car.model}`,
                                                    booking.car.vehicle_type,
                                                    booking.car.license_plate?.toUpperCase(),
                                                ].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5 rounded-xl border border-border bg-muted/40 p-3">
                                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                <Calendar className="h-3 w-3 shrink-0" /> Pickup
                                            </p>
                                            <p className="text-xs font-semibold text-foreground leading-snug">{formatDate(booking.start_date)}{booking.pickup_time ? ` · ${formatTime(booking.pickup_time)}` : ''}</p>
                                            <p className="flex items-start gap-1 text-xs text-muted-foreground leading-snug">
                                                <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {booking.pickup_location?.location ?? '—'}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5 rounded-xl border border-border bg-muted/40 p-3">
                                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                <Calendar className="h-3 w-3 shrink-0" /> Return
                                            </p>
                                            <p className="text-xs font-semibold text-foreground leading-snug">{formatDate(booking.end_date)}{booking.return_time ? ` · ${formatTime(booking.return_time)}` : ''}</p>
                                            <p className="flex items-start gap-1 text-xs text-muted-foreground leading-snug">
                                                <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {booking.return_location?.location ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('admin.bookings.show', booking.id)}
                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                                    >
                                        <ArrowRight className="h-3.5 w-3.5" />
                                        View full booking
                                    </Link>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
