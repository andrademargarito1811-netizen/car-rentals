import InvoiceHeader from '@/Components/InvoiceHeader';
import { DamageDiagram, DamageLegend } from '@/Components/car3d/PrintDamageSummary';
import { FUEL_MAX_BARS } from '@/Components/FuelGaugeInput';
import { type VehicleDamage } from '@/lib/carZones';
import { cn } from '@/lib/utils';

export interface InvoiceSettings {
    company_name?: string | null;
    company_legal_name?: string | null;
    phone?: string | null;
    emergency_phone?: string | null;
    fax?: string | null;
    email?: string | null;
    address?: string | null;
    tax_id?: string | null;
    logo_path?: string | null;
    is_active?: boolean;
}

export interface InvoiceLine {
    description: string;
    details?: string;
    amount: number;
    negative?: boolean;
}

interface InvoiceBooking {
    id: number;
    reference_code: string | null;
    start_date: string;
    end_date: string;
    pickup_time: string | null;
    return_time: string | null;
    total_amount: number;
    status: string;
    created_at: string;
    user: { id: number; name: string; email: string; phone: string | null; address: string | null } | null;
    guest: {
        guest_id: number;
        title: string | null;
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
        address: string | null;
        address2: string | null;
        country: string | null;
        state: string | null;
        city: string | null;
        postal_code: string | null;
        company_name: string | null;
    } | null;
    car: {
        brand: string;
        model: string;
        year: number;
        license_plate: string;
        daily_rate: number;
        color: string | null;
        vin: string | null;
        stock_number: string | null;
        vehicle_type: string | null;
    };
    payments: { id: string; type: string; amount: number; payment_method: string; payment_status: string; transaction_id: string | null; created_at: string }[];
    booking_taxes: { tax_desc: string; amount: number; add_or_minus: boolean; tax: { rate: number; value_in: string; calculation: string } | null }[];
    coupon_usage: { code: string; discount_amount: number } | null;
    pickup_location: { location: string } | null;
    return_location: { location: string } | null;
    extra_charges: { id: number; name: string; amount: string; tax_amount: string; operator: string }[];
    handover_charges: { fuel_refuel: number; excess_mileage: number; excess_km: number; total: number } | null;
    swap_segments?: Array<{
        car: { brand: string; model: string; year: number; license_plate: string; daily_rate: number } | null;
        start_date: string;
        end_date: string;
        days: number;
        daily_rate: number;
        subtotal: number;
    }>;
    pickup_handover: {
        fuel_level: number | null;
        odometer: number | null;
        notes: string | null;
        damages: VehicleDamage[] | null;
        captured_at: string | null;
    } | null;
    return_handover: {
        fuel_level: number | null;
        odometer: number | null;
        notes: string | null;
        damages: VehicleDamage[] | null;
        captured_at: string | null;
    } | null;
}

interface InvoiceProps {
    ref?: React.Ref<HTMLDivElement>;
    booking: InvoiceBooking;
    settings?: InvoiceSettings | null;
    documentType?: string;
    showPrintButton?: boolean;
    onPrint?: () => void;
    onDownloadPdf?: () => void;
    invoiceTerms?: {
        title: string;
        subtitle?: string | null;
        content: string;
    } | null;
    invoiceTerms2?: {
        title: string;
        subtitle?: string | null;
        content: string;
    } | null;
    termsConditions?: {
        title: string;
        subtitle?: string | null;
        content: string;
    } | null;
    driver?: {
        driver_id: number;
        guest_id: number | null;
        first_name: string;
        last_name: string;
        birth_date: string | null;
        license_category: string | null;
        license_expiry: string | null;
        masked_license: string;
    } | null;
}

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
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
    value == null ? '—' : `${Math.round(value).toLocaleString('en-US')}`;

function getDaysDifference(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

function paymentTypeLabel(type: string): string {
    const labels: Record<string, string> = { downpayment: 'Down Payment', remaining: 'Balance', full_payment: 'Full Payment' };
    return labels[type] ?? type;
}

function taxLabel(t: { tax_desc: string; tax: { rate: number; value_in: string; calculation: string } | null }): string {
    const base = t.tax_desc;
    if (t.tax?.value_in === 'Percentage') {
        return `${base} (${t.tax.rate}%)`;
    }
    return base;
}

const labelClass = 'text-[0.625rem] font-bold uppercase tracking-[0.14em] text-surface-400 dark:text-surface-500 print:text-[0.5rem]';

const sectionTitleClass = 'text-xs font-bold uppercase tracking-[0.14em] text-surface-600 dark:text-surface-400 print:text-[0.625rem]';

const commentsBodyClass = 'text-xs leading-snug text-surface-600 dark:text-surface-300 print:text-[0.625rem] [&_h1]:mb-1 [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-surface-900 print:[&_h1]:text-[0.6875rem] [&_h2]:mb-1 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-surface-800 dark:[&_h2]:text-surface-200 print:[&_h2]:text-[0.625rem] [&_p]:mt-0.5 [&_ul]:mt-0.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5';

function statusBadge(status: string): string {
    const tones: Record<string, string> = {
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        confirmed: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
        reserved: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    };
    return tones[status] ?? 'bg-surface-100 text-surface-600 dark:bg-surface-700/40 dark:text-surface-300';
}

const IconCalendar = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
);

const IconPin = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const IconCar = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
        <circle cx="6.5" cy="16.5" r="2.5" />
        <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
);

const Field = ({ label, value, sub, mono }: { label: string; value: string; sub?: string | null; mono?: boolean }) => (
    <div className="min-w-0">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-surface-500 dark:text-surface-400">{label}</p>
        <p className={cn('mt-0.5 truncate text-base font-semibold text-surface-800 dark:text-surface-200 print:text-base', mono && 'font-mono')}>{value}</p>
        {sub && <p className="mt-0.5 truncate text-xs text-surface-400 dark:text-surface-500">{sub}</p>}
    </div>
);

const TotalRow = ({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'positive' | 'balance' }) => (
    <tr className="border-t border-surface-100 dark:border-surface-700/40 print:border-surface-300">
        <td className="py-2.5 pr-3 text-sm text-surface-500 dark:text-surface-400 print:py-1.5 print:text-[0.6875rem]">{label}</td>
        <td className={cn(
            'py-2.5 text-right text-sm tabular-nums print:py-1.5 print:text-[0.6875rem]',
            tone === 'positive' && 'font-semibold text-emerald-600 dark:text-emerald-400',
            tone === 'balance' && 'text-base font-bold text-surface-900 dark:text-white print:text-sm',
            tone === 'default' && 'font-semibold text-surface-800 dark:text-surface-200',
        )}>{value}</td>
    </tr>
);

export default function Invoice({ ref, booking, settings, documentType = 'INVOICE', showPrintButton, onPrint, onDownloadPdf, invoiceTerms, invoiceTerms2, termsConditions, driver }: InvoiceProps) {
    const customer = booking.user ? {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone,
        address: booking.user.address,
    } : booking.guest ? {
        name: [booking.guest.title, booking.guest.first_name, booking.guest.last_name].filter(Boolean).join(' '),
        email: booking.guest.email,
        phone: booking.guest.phone,
        address: [
            booking.guest.company_name,
            booking.guest.address,
            booking.guest.address2,
            [booking.guest.city, booking.guest.state, booking.guest.postal_code].filter(Boolean).join(', '),
            booking.guest.country,
        ].filter(Boolean).join(', '),
    } : null;

    const days = getDaysDifference(booking.start_date, booking.end_date);
    const rentalSubtotal = Number(booking.car?.daily_rate ?? 0) * days;

    const addTaxes = (booking.booking_taxes ?? []).filter(t => t.add_or_minus);
    const subTaxes = (booking.booking_taxes ?? []).filter(t => !t.add_or_minus);
    const taxTotal = addTaxes.reduce((s, t) => s + Number(t.amount), 0) - subTaxes.reduce((s, t) => s + Number(t.amount), 0);

    const handoverCharges = booking.handover_charges?.total ?? 0;
    const handoverChargesLine = (booking.handover_charges?.excess_mileage ?? 0) > 0
        ? { description: 'Excess mileage', details: `${booking.handover_charges?.excess_km?.toFixed(0) ?? 0} km`, amount: booking.handover_charges?.excess_mileage ?? 0 }
        : null;

    const extraCharges = booking.extra_charges ?? [];
    const extraChargesTotal = extraCharges.reduce((s, c) => {
        const amt = Number(c.amount) + Number(c.tax_amount);
        return s + (c.operator === '-' ? -amt : amt);
    }, 0);

    const discount = Number(booking.coupon_usage?.discount_amount ?? 0);

    const swapSegments = booking.swap_segments ?? [];
    const hasSwaps = swapSegments.length > 0;

    const lines: InvoiceLine[] = hasSwaps
        ? [
            ...swapSegments.map(seg => ({
                description: `${seg.car?.brand ?? ''} ${seg.car?.model ?? ''} — ${seg.days} day${seg.days !== 1 ? 's' : ''}`,
                details: `${seg.days} day${seg.days !== 1 ? 's' : ''} × ${formatPrice(Number(seg.daily_rate))}/day`,
                amount: Number(seg.subtotal),
            })),
            ...addTaxes.map(t => ({ description: taxLabel(t), amount: Number(t.amount) })),
            ...subTaxes.map(t => ({ description: taxLabel(t), amount: Number(t.amount), negative: true })),
            ...extraCharges.map(c => ({
                description: Number(c.tax_amount) > 0 ? `${c.name} (incl. tax)` : c.name,
                amount: Number(c.amount) + Number(c.tax_amount),
                negative: c.operator === '-',
            })),
            ...(handoverCharges > 0 && handoverChargesLine ? [handoverChargesLine] : []),
        ]
        : [
            {
                description: `${booking.car?.brand ?? ''} ${booking.car?.model ?? ''} — ${days} day${days !== 1 ? 's' : ''}`,
                details: `${days} day${days !== 1 ? 's' : ''} × ${formatPrice(Number(booking.car?.daily_rate ?? 0))}/day`,
                amount: rentalSubtotal,
            },
            ...addTaxes.map(t => ({ description: taxLabel(t), amount: Number(t.amount) })),
            ...subTaxes.map(t => ({ description: taxLabel(t), amount: Number(t.amount), negative: true })),
            ...extraCharges.map(c => ({
                description: Number(c.tax_amount) > 0 ? `${c.name} (incl. tax)` : c.name,
                amount: Number(c.amount) + Number(c.tax_amount),
                negative: c.operator === '-',
            })),
            ...(handoverCharges > 0 && handoverChargesLine ? [handoverChargesLine] : []),
        ];

    if (discount > 0) {
        lines.push({ description: `Coupon (${booking.coupon_usage?.code})`, details: 'Discount', amount: discount, negative: true });
    }

    const paid = (booking.payments ?? []).filter(p => p.payment_status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    const balance = Number(booking.total_amount) - paid;
    const hasHandoverBreakdown = (booking.handover_charges?.fuel_refuel ?? 0) > 0;

    const returnHandover = booking.return_handover;
    const returnDamages = returnHandover?.damages ?? [];
    const returnFuelBars = Math.max(0, Math.min(FUEL_MAX_BARS, Math.round(Number(returnHandover?.fuel_level ?? 0))));

    return (
        <div ref={ref} className="mx-auto w-full max-w-4xl bg-white text-surface-900 shadow-card dark:bg-brand-900 dark:text-white overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700/60 print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
            {/* Toolbar (hidden on print) */}
            {showPrintButton && (
                <div className="flex items-center justify-between border-b border-surface-100 bg-surface-50/50 px-6 py-3 dark:border-surface-700/60 dark:bg-brand-800/40 print:hidden">
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                        Print preview — {formatDate(booking.created_at)}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onPrint}
                            title="Tip: uncheck 'Headers and footers' in the print dialog to hide the page URL"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-500/20 transition-colors hover:from-brand-500 hover:to-brand-600"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5z" />
                            </svg>
                            Print
                        </button>
                        <button
                            type="button"
                            onClick={onDownloadPdf}
                            className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2 text-xs font-semibold text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-brand-800 dark:text-surface-200 dark:hover:bg-brand-700"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                            </svg>
                            Download PDF
                        </button>
                    </div>
                </div>
            )}

            {/* Document body */}
            <div className="px-6 py-8 sm:px-10 print:flex print:min-h-[980px] print:flex-col print:px-4 print:py-1 print:text-[0.75rem]">
                <InvoiceHeader
                    settings={settings}
                    documentType={documentType}
                    documentNumber={booking.reference_code ?? `#${booking.id}`}
                    meta={[
                        { label: 'Date', value: formatDate(booking.created_at) },
                        { label: 'Status', value: booking.status, badge: statusBadge(booking.status) },
                    ]}
                />

                {/* Rental & Vehicle details — single compact box */}
                <div className="mb-6 border-y border-surface-200 py-3 dark:border-surface-700/60 print:mb-2 print:py-1 print:break-inside-avoid">
                    {/* Row 1: Bill To (left) | Driver (right) */}
                    <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 print:mb-4 print:gap-3 print:gap-y-2">
                        {customer && (
                            <div className="flex h-full flex-col">
                                <p className={sectionTitleClass}>Bill To</p>
                                <p className="mt-1 text-base font-bold text-surface-900 dark:text-white print:text-base">{customer.name}</p>
                                {customer.email && <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400 print:text-sm">{customer.email}</p>}
                                {customer.phone && <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400 print:text-sm">{customer.phone}</p>}
                                {customer.address && <p className="mt-0.5 text-sm leading-relaxed text-surface-500 dark:text-surface-400 print:text-sm">{customer.address}</p>}
                            </div>
                        )}
                        {driver && (
                            <div className="flex h-full flex-col">
                                <div className="grid grid-cols-2 gap-x-4">
                                    <div>
                                        <p className={sectionTitleClass}>Driver</p>
                                        <p className="mt-1 text-base font-bold text-surface-900 dark:text-white print:text-base">{driver.first_name} {driver.last_name}</p>
                                    </div>
                                    {driver.birth_date && (
                                        <div>
                                            <p className={labelClass}>DOB</p>
                                            <p className="mt-1 text-base font-semibold text-surface-800 dark:text-surface-200 print:text-base">{formatDate(driver.birth_date)}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-1.5 grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-1">
                                    {driver.masked_license && <Field label="License No." value={driver.masked_license} mono />}
                                    {driver.license_expiry && <Field label="Expiry" value={formatDate(driver.license_expiry)} />}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Row 2: Vehicle (left) | Pickup (middle) | Return (right) */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3 print:gap-3 print:gap-y-2">
                        <div>
                            <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                                <IconCar />
                                <span className={sectionTitleClass}>Vehicle</span>
                            </div>
                            <p className="mt-1 text-base font-bold text-surface-900 dark:text-white print:text-sm">
                                {[booking.car?.brand, booking.car?.model, booking.car?.year ? String(booking.car.year) : null, booking.car?.color]
                                    .filter(Boolean).join(' ')}
                            </p>
                            <p className="mt-0.5 truncate text-sm text-surface-500 dark:text-surface-400 print:text-xs">
                                {[
                                    booking.car?.license_plate ? `Reg: ${booking.car.license_plate}` : null,
                                    booking.car?.vin ? `VIN: ${booking.car.vin}` : null,
                                ].filter(Boolean).join(' · ')}
                            </p>
                            <p className="mt-0.5 truncate text-sm text-surface-500 dark:text-surface-400 print:text-xs">
                                {[
                                    booking.car?.stock_number ? `Stock: ${booking.car.stock_number}` : null,
                                    booking.car?.vehicle_type ? booking.car.vehicle_type : null,
                                    `${days} day${days !== 1 ? 's' : ''}`,
                                ].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                                <IconCalendar />
                                <span className={sectionTitleClass}>Pickup</span>
                            </div>
                            <p className="mt-1 text-base font-bold text-surface-900 dark:text-white print:text-sm">
                                {formatDate(booking.start_date)}{formatTime(booking.pickup_time) ? ` · ${formatTime(booking.pickup_time)}` : ''}
                            </p>
                            {booking.pickup_location?.location && (
                                <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400 print:text-xs">{booking.pickup_location.location}</p>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                                <IconPin />
                                <span className={sectionTitleClass}>Return</span>
                            </div>
                            <p className="mt-1 text-base font-bold text-surface-900 dark:text-white print:text-sm">
                                {formatDate(booking.end_date)}{formatTime(booking.return_time) ? ` · ${formatTime(booking.return_time)}` : ''}
                            </p>
                            {booking.return_location?.location && (
                                <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400 print:text-xs">{booking.return_location.location}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Return status (left) + Line items & totals (right) */}
                <div className="mb-12 print:mb-8">
                    <div className={cn('grid gap-6 print:gap-3 print:text-[0.6875rem]', returnHandover ? 'sm:grid-cols-2' : 'sm:grid-cols-1')}>
                        {returnHandover && (
                            <div className="flex h-full flex-col print:break-inside-avoid">
                                <p className={cn(sectionTitleClass, 'mb-3 print:mb-2')}>Return Vehicle Status</p>
                                <div className="mb-3 grid grid-cols-2 gap-4 print:mb-2 print:gap-4">
                                    <div>
                                        <p className={labelClass}>Return Fuel Level</p>
                                        <div className="mt-1.5 flex items-center gap-2.5">
                                            <div className="flex items-end gap-0.5">
                                                {Array.from({ length: FUEL_MAX_BARS }, (_, i) => (
                                                    <span key={i} className={cn('h-5 w-2.5 rounded-sm print:h-4 print:w-2', i < returnFuelBars ? 'bg-amber-400 print:bg-neutral-900 print:border print:border-neutral-900 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]' : 'bg-surface-200 dark:bg-surface-700/60 print:bg-white print:border print:border-neutral-400 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]')} />
                                                ))}
                                            </div>
                                            <span className="text-base font-bold text-surface-900 dark:text-white print:text-sm">
                                                {returnHandover.fuel_level ?? '—'}/{FUEL_MAX_BARS}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className={labelClass}>Odometer</p>
                                        <div className="mt-1.5 flex items-baseline justify-between gap-3">
                                            <span className="text-xs text-surface-500 dark:text-surface-400 print:text-[0.625rem]">
                                                Return{' '}
                                                <span className="text-base font-bold tabular-nums text-surface-900 dark:text-white print:text-sm">{formatOdometer(returnHandover.odometer)}</span>
                                            </span>
                                            <span className="text-xs text-surface-500 dark:text-surface-400 print:text-[0.625rem]">
                                                Pickup{' '}
                                                <span className="text-base font-bold tabular-nums text-surface-900 dark:text-white print:text-sm">{formatOdometer(booking.pickup_handover?.odometer)}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-3 print:mb-2">
                                    <p className={cn(sectionTitleClass, 'mb-2')}>Vehicle Condition</p>
                                    <DamageDiagram damages={returnDamages} vehicleType={booking.car?.vehicle_type ?? undefined} className="max-w-[370px]" />
                                </div>
                                <div>
                                    <p className={cn(sectionTitleClass, 'mb-2')}>Damage Legend</p>
                                    <DamageLegend damages={returnDamages} vehicleType={booking.car?.vehicle_type ?? undefined} size="lg" />
                                </div>
                                {returnHandover.notes && (
                                    <div className="mt-3 border-t border-surface-200 pt-2 dark:border-surface-700/60 print:mt-2 print:pt-1.5">
                                        <p className={labelClass}>Notes</p>
                                        <p className="mt-1 text-xs text-surface-600 dark:text-surface-300">{returnHandover.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Column 2 — Line items + Subtotal */}
                        <div className={cn('print:break-inside-avoid', returnHandover && 'sm:border-l sm:border-surface-200 sm:pl-6 dark:sm:border-surface-700/60')}>
                            <table className="mb-4 w-full text-sm print:mb-3">
                                <thead>
                                    <tr className="text-left text-[0.625rem] font-bold uppercase tracking-[0.12em] text-surface-500 dark:text-surface-400">
                                        <th className="border-b border-surface-300 py-2.5 pr-3 dark:border-surface-700 print:py-1">Description</th>
                                        <th className="border-b border-surface-300 py-2.5 text-right dark:border-surface-700 print:py-1">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((line, i) => (
                                        <tr key={i} className="border-b border-surface-100 last:border-0 dark:border-surface-700/40">
                                            <td className="py-3 pr-3 text-surface-800 dark:text-surface-200 print:py-1.5">
                                                <span className={line.negative ? 'text-emerald-600 dark:text-emerald-400' : ''}>{line.description}</span>
                                            </td>
                                            <td className={cn('py-3 text-right font-semibold tabular-nums print:py-1.5', line.negative ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-800 dark:text-surface-200')}>
                                                {line.negative ? '-' : ''}{formatPrice(line.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    {hasHandoverBreakdown && (
                                        <tr className="border-b border-surface-100 dark:border-surface-700/40">
                                            <td className="py-3 pr-3 text-surface-400 dark:text-surface-500 print:py-1.5">Fuel refueling</td>
                                            <td className="py-3 text-right font-semibold tabular-nums text-surface-800 dark:text-surface-200 print:py-1.5">
                                                {formatPrice(booking.handover_charges?.fuel_refuel ?? 0)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <TotalRow
                                        label="Subtotal"
                                        value={formatPrice(hasSwaps ? swapSegments.reduce((s, seg) => s + Number(seg.subtotal), 0) : rentalSubtotal)}
                                    />
                                    {taxTotal !== 0 && <TotalRow label="Fees & Taxes" value={formatPrice(taxTotal)} />}
                                    {extraChargesTotal !== 0 && (
                                        <TotalRow
                                            label="Extra Charges"
                                            value={`${extraChargesTotal < 0 ? '-' : ''}${formatPrice(Math.abs(extraChargesTotal))}`}
                                            tone={extraChargesTotal < 0 ? 'positive' : 'default'}
                                        />
                                    )}
                                    {discount > 0 && <TotalRow label="Coupon Discount" value={`-${formatPrice(discount)}`} tone="positive" />}
                                    <tr className="border-t border-surface-100 dark:border-surface-700/40 print:border-surface-300">
                                        <td className="py-2.5 pr-3 text-sm font-bold text-surface-900 dark:text-white print:py-1.5 print:text-[0.6875rem]">Total</td>
                                        <td className="py-2.5 text-right text-base font-extrabold tracking-tight text-surface-900 tabular-nums dark:text-white print:py-1.5 print:text-sm">{formatPrice(booking.total_amount)}</td>
                                    </tr>
                                    <tr className="border-t border-surface-100 dark:border-surface-700/40 print:border-surface-300">
                                        <td className="py-2.5 pr-3 text-sm text-surface-500 dark:text-surface-400 print:py-1.5 print:text-[0.6875rem]">
                                            Amount Paid <span className="font-semibold text-emerald-600 dark:text-emerald-400">-{formatPrice(paid)}</span>
                                        </td>
                                        <td className={cn('py-2.5 text-right text-sm font-bold tabular-nums print:py-1.5 print:text-[0.6875rem]', balance > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-emerald-600 dark:text-emerald-400')}>
                                            {balance > 0 ? `Balance ${formatPrice(Math.max(0, balance))}` : 'Paid in Full'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Row 2 — Agreement 2 (left) | Comments (right) */}
                    {(invoiceTerms || invoiceTerms2) && (
                        <div className={cn('mt-6 grid gap-6 border-t border-surface-200 pt-4 print:mt-3 print:gap-3 print:border-surface-300 print:pt-3', invoiceTerms && invoiceTerms2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1')}>
                            {invoiceTerms2 && (
                                <div className="min-w-0 print:break-inside-avoid">
                                    <div className="text-[0.5625rem] leading-snug text-surface-600 dark:text-surface-300 [&_h1]:mb-1 [&_h1]:text-[0.625rem] [&_h1]:font-bold [&_h1]:text-surface-900 [&_h2]:mb-1 [&_h2]:text-[0.5625rem] [&_h2]:font-bold [&_h2]:text-surface-800 dark:[&_h2]:text-surface-200 [&_p]:mt-0.5 [&_ul]:mt-0.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5">
                                        <div dangerouslySetInnerHTML={{ __html: invoiceTerms2.content }} />
                                    </div>
                                </div>
                            )}
                            {invoiceTerms && (
                                <div className={cn('min-w-0 print:break-inside-avoid', invoiceTerms2 && 'sm:border-l sm:border-surface-200 sm:pl-6 dark:sm:border-surface-700/60')}>
                                    <p className={cn('text-xs font-bold uppercase tracking-[0.14em] text-surface-400 dark:text-surface-500 print:text-[0.5rem]', 'mb-1.5')}>Note</p>
                                    <div className={commentsBodyClass}>
                                        <div dangerouslySetInnerHTML={{ __html: invoiceTerms.content }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Emergency contact banner */}
                {(settings?.emergency_phone || settings?.phone) && (
                    <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-5 py-3.5 dark:border-red-500/40 dark:bg-red-500/10 print:mt-auto print:mb-3 print:rounded-none print:border print:border-surface-300 print:bg-white print:px-3 print:py-2">
                        <svg className="h-6 w-6 shrink-0 text-destructive dark:text-red-400 print:h-4 print:w-4 print:text-surface-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        <p className="text-lg font-bold text-destructive dark:text-red-400 print:text-[0.75rem] print:text-surface-900">
                            In case of accident call <span className="font-mono text-2xl font-extrabold tracking-tight print:text-base">{settings.emergency_phone || settings.phone}</span>
                        </p>
                    </div>
                )}

                {/* Signatures */}
                <div className="mt-10 grid gap-8 pt-4 sm:grid-cols-2 print:mt-3 print:gap-4 print:pt-10 print:break-inside-avoid">
                    <div>
                        <p className={labelClass}>Authorized Signature</p>
                        <div className="mt-8 flex items-center gap-2 print:mt-6">
                            <div className="flex-1 border-b border-surface-300 dark:border-surface-700" />
                            <span className="whitespace-nowrap text-xs text-surface-500 dark:text-surface-400">Date: {formatDate(new Date().toISOString())}</span>
                        </div>
                    </div>
                    <div>
                        <p className={labelClass}>Customer Signature</p>
                        <div className="mt-8 flex items-center gap-2 print:mt-6">
                            <div className="flex-1 border-b border-surface-300 dark:border-surface-700" />
                            <span className="whitespace-nowrap text-xs text-surface-500 dark:text-surface-400">Date: {formatDate(new Date().toISOString())}</span>
                        </div>
                    </div>
                </div>

                {/* Terms & Conditions */}
                {termsConditions && (
                    <div id="invoice-terms" className="mt-6 border-t border-surface-200 pt-3 dark:border-surface-700/60 print:mt-0 print:break-before-page">
                        <p className={cn(labelClass, 'mb-1.5')}>{termsConditions.title}</p>
                        <div
                            className="text-[0.5rem] leading-[1.2] text-surface-600 dark:text-surface-300 [&_h1]:mb-0.25 [&_h1]:break-inside-avoid [&_h1]:text-[0.5625rem] [&_h1]:font-bold [&_h1]:text-surface-900 [&_h2]:mb-0.25 [&_h2]:break-inside-avoid [&_h2]:text-[0.5rem] [&_h2]:font-bold [&_h2]:text-surface-800 dark:[&_h2]:text-surface-200 [&_p]:mt-0 [&_p]:break-inside-avoid [&_li]:break-inside-avoid [&_ul]:mt-0 [&_ul]:break-inside-avoid [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0"
                        >
                            <div dangerouslySetInnerHTML={{ __html: termsConditions.content }} />
                        </div>
                    </div>
                )}

                {/* Footer note */}
                <div className="mt-6 border-t border-surface-200 pt-3 dark:border-surface-700/60 print:mt-1 print:pt-1 print:break-inside-avoid">
                    <p className="text-center text-[0.6875rem] leading-relaxed text-surface-400 dark:text-surface-500 print:text-[0.625rem]">
                        Thank you for choosing {settings?.company_name || 'our services'}. This document is an official record of your rental agreement and payments. Please keep a copy for your records.
                    </p>
                </div>
            </div>
        </div>
    );
}
