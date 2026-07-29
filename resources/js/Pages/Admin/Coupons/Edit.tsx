import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface CouponType {
    id: number;
    name: string;
}

interface Coupon {
    id: number;
    code: string;
    issued_by: string | null;
    start_date: string | null;
    end_date: string | null;
    min_order: number | null;
    max_uses: number | null;
    user_count: number;
    coupon_type_id: number;
    min_rate: number | null;
    is_active: boolean;
    coupon_type: CouponType;
}

interface EditProps {
    coupon: Coupon;
    couponTypes: CouponType[];
}

const rateConfig: Record<string, { label: string; placeholder: string; step: string }> = {
    Amount: { label: 'Amount', placeholder: '0.00', step: '0.01' },
    Percentage: { label: 'Percentage (%)', placeholder: '0.00', step: '0.01' },
    'Per Day': { label: 'Rate Per Day', placeholder: '0.00', step: '0.01' },
    'Day Free': { label: 'Free Days', placeholder: '0', step: '1' },
};

export default function Edit({ coupon, couponTypes }: EditProps) {
    const route = useRoute();
    const selectedType = couponTypes.find(t => t.id === coupon.coupon_type_id);
    const rc = rateConfig[selectedType?.name ?? ''] ?? { label: 'Rate', placeholder: '0.00', step: '0.01' };
    const { data, setData, put, processing, errors } = useForm({
        issued_by: coupon.issued_by ?? '',
        start_date: coupon.start_date?.substring(0, 10) ?? '',
        end_date: coupon.end_date?.substring(0, 10) ?? '',
        min_order: coupon.min_order?.toString() ?? '',
        max_uses: coupon.max_uses?.toString() ?? '',
        coupon_type_id: coupon.coupon_type_id.toString(),
        min_rate: coupon.min_rate?.toString() ?? '',
        is_active: coupon.is_active,
    });
    const [noExpiry, setNoExpiry] = useState(!coupon.start_date && !coupon.end_date);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('admin.coupons.update', coupon.id));
    }

    const expired = coupon.end_date ? new Date(coupon.end_date) < new Date() : false;
    const exhausted = coupon.max_uses !== null && coupon.user_count >= coupon.max_uses;
    const usagePercent = coupon.max_uses !== null && coupon.max_uses > 0
        ? Math.min(Math.round((coupon.user_count / coupon.max_uses) * 100), 100)
        : 0;
    const daysDiff = data.start_date && data.end_date
        ? Math.round((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <>
            <Head title="Edit Coupon" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Coupons', href: 'admin.coupons.index' }, { label: 'Edit Coupon' }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative animate-fade-in-up">
                            <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Coupon Management
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1">
                                Edit Coupon
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <p className="text-white/60 text-sm font-mono tracking-wider">{coupon.code}</p>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    coupon.is_active && !expired && !exhausted
                                        ? 'bg-emerald-400/20 text-emerald-300'
                                        : 'bg-red-400/20 text-red-300'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        coupon.is_active && !expired && !exhausted ? 'bg-emerald-400' : 'bg-red-400'
                                    }`} />
                                    {coupon.is_active && !expired && !exhausted ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="py-8 sm:py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <form onSubmit={submit}>
                            <div className="grid gap-8 lg:grid-cols-3">

                                {/* Main form content */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Back link */}
                                    <Link href={route('admin.coupons.index')}
                                        className="inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors animate-fade-in-up">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Coupons
                                    </Link>

                                    {/* Status Alert */}
                                    {(!coupon.is_active || expired || exhausted) && (
                                        <div className="animate-fade-in-up stagger-1">
                                            <div className="card !rounded-2xl border-amber-200/80 dark:border-amber-700/30 overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10 dark:to-transparent" />
                                                <div className="relative flex items-start gap-3 p-5">
                                                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                        </svg>
                                                    </div>
                                                    <div className="text-sm text-amber-700 dark:text-amber-300">
                                                        <p className="font-semibold">This coupon is currently inactive.</p>
                                                        <p className="text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                                                            {expired && coupon.end_date && 'It has passed its end date.'}
                                                            {exhausted && 'It has reached its maximum usage limit.'}
                                                            {!coupon.is_active && !expired && !exhausted && 'It has been manually deactivated.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Basic Information */}
                                    <div className="card p-6 sm:p-8 animate-fade-in-up stagger-2">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-surface-900 dark:text-white">Basic Information</h2>
                                                <p className="text-sm text-surface-500 dark:text-surface-400">Configure the coupon's general details and validity period.</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="label-text">Coupon Type <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <select
                                                        value={data.coupon_type_id}
                                                        onChange={e => setData('coupon_type_id', e.target.value)}
                                                        className="input-field appearance-none cursor-pointer pr-10">
                                                        <option value="">Select type...</option>
                                                        {couponTypes.map((type) => (
                                                            <option key={type.id} value={type.id}>{type.name}</option>
                                                        ))}
                                                    </select>
                                                    <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                {errors.coupon_type_id && <p className="text-sm text-red-500 mt-1.5">{errors.coupon_type_id}</p>}
                                            </div>

                                            <div>
                                                <label className="label-text">Issued By</label>
                                                <input
                                                    type="text"
                                                    value={data.issued_by}
                                                    onChange={e => setData('issued_by', e.target.value)}
                                                    placeholder="e.g. Marketing Campaign"
                                                    className="input-field" />
                                                {errors.issued_by && <p className="text-sm text-red-500 mt-1.5">{errors.issued_by}</p>}
                                            </div>

                                            <div className="sm:col-span-2">
                                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-100 dark:border-surface-700/40">
                                                    <div>
                                                        <span className="text-sm font-semibold text-surface-900 dark:text-white">Set Expiry</span>
                                                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">When disabled, the coupon never expires.</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={!noExpiry}
                                                        onClick={() => {
                                                            const next = !noExpiry;
                                                            setNoExpiry(next);
                                                            if (!next) {
                                                                const today = new Date();
                                                                const end = new Date(today);
                                                                end.setMonth(end.getMonth() + 1);
                                                                setData('start_date', today.toISOString().substring(0, 10));
                                                                setData('end_date', end.toISOString().substring(0, 10));
                                                            } else {
                                                                setData('start_date', '');
                                                                setData('end_date', '');
                                                            }
                                                        }}
                                                        className={[
                                                            'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full',
                                                            'border-2 border-transparent transition-colors duration-200 ease-in-out',
                                                            'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-800',
                                                            !noExpiry
                                                                ? 'bg-brand-500'
                                                                : 'bg-surface-200 dark:bg-surface-600',
                                                        ].join(' ')}
                                                    >
                                                        <span
                                                            className={[
                                                                'pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm ring-0',
                                                                'transition-transform duration-200 ease-in-out',
                                                                !noExpiry ? 'translate-x-5' : 'translate-x-0',
                                                            ].join(' ')}
                                                        >
                                                            {!noExpiry ? (
                                                                <svg className="w-3 h-3 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-3 h-3 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            )}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            {!noExpiry && (
                                                <>
                                                    <div>
                                                        <label className="label-text">Start Date</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                                </svg>
                                                            </span>
                                                            <input
                                                                type="date"
                                                                value={data.start_date}
                                                                onChange={e => setData('start_date', e.target.value)}
                                                                className="input-field pl-11 [color-scheme:light] dark:[color-scheme:dark]" />
                                                        </div>
                                                        {errors.start_date && <p className="text-sm text-red-500 mt-1.5">{errors.start_date}</p>}
                                                    </div>

                                                    <div>
                                                        <label className="label-text">End Date</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                                </svg>
                                                            </span>
                                                            <input
                                                                type="date"
                                                                value={data.end_date}
                                                                onChange={e => setData('end_date', e.target.value)}
                                                                min={data.start_date || undefined}
                                                                className="input-field pl-11 [color-scheme:light] dark:[color-scheme:dark]" />
                                                        </div>
                                                        {errors.end_date && <p className="text-sm text-red-500 mt-1.5">{errors.end_date}</p>}
                                                    </div>
                                                </>
                                            )}

                                            {noExpiry && (
                                                <div className="sm:col-span-2 flex items-center gap-2 text-surface-500 dark:text-surface-400">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-sm">No expiry date &mdash; coupon never expires.</span>
                                                </div>
                                            )}
                                        </div>

                                        {!noExpiry && daysDiff !== null && daysDiff >= 0 && (
                                            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-surface-100 dark:border-surface-700/40">
                                                <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm text-surface-500 dark:text-surface-400">
                                                    Valid for <strong className="text-brand-600 dark:text-brand-400 font-semibold">{daysDiff} day{daysDiff !== 1 ? 's' : ''}</strong>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Constraints */}
                                    <div className="card p-6 sm:p-8 animate-fade-in-up stagger-3">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                                                <svg className="w-5 h-5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-surface-900 dark:text-white">Constraints</h2>
                                                <p className="text-sm text-surface-500 dark:text-surface-400">Set usage limits and order requirements for this coupon.</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="label-text">Minimum Order Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.min_order}
                                                        onChange={e => setData('min_order', e.target.value)}
                                                        placeholder="0.00"
                                                        className="input-field pl-11" />
                                                </div>
                                                {errors.min_order && <p className="text-sm text-red-500 mt-1.5">{errors.min_order}</p>}
                                            </div>

                                            <div>
                                                <label className="label-text">{rc.label}</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            {selectedType?.name === 'Percentage' ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V4.5m0 15H4.5" />
                                                            ) : selectedType?.name === 'Day Free' ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            ) : (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            )}
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step={rc.step}
                                                        min="0"
                                                        value={data.min_rate}
                                                        onChange={e => setData('min_rate', e.target.value)}
                                                        placeholder={rc.placeholder}
                                                        className="input-field pl-11" />
                                                </div>
                                                {errors.min_rate && <p className="text-sm text-red-500 mt-1.5">{errors.min_rate}</p>}
                                            </div>

                                            <div>
                                                <label className="label-text">Maximum Uses</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v18m9-18v18m3-16.5v15m-9-4.5h2.25m-4.5 0h1.5" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={data.max_uses}
                                                        onChange={e => setData('max_uses', e.target.value)}
                                                        placeholder="No limit"
                                                        className="input-field pl-11" />
                                                </div>
                                                {errors.max_uses && <p className="text-sm text-red-500 mt-1.5">{errors.max_uses}</p>}
                                            </div>

                                            <div>
                                                <label className="label-text">Status</label>
                                                <div className="flex items-center gap-3 h-[52px]">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.is_active}
                                                            onChange={e => setData('is_active', e.target.checked)}
                                                            className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-surface-200 dark:bg-surface-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-[22px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-all duration-200" />
                                                    </label>
                                                    <div>
                                                        <span className={`text-sm font-semibold ${data.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400 dark:text-surface-500'}`}>
                                                            {data.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                        <p className="text-xs text-surface-400 dark:text-surface-500">
                                                            {data.is_active ? 'Coupon can be redeemed' : 'Coupon is disabled'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">

                                    {/* Usage Statistics */}
                                    <div className="card p-6 sm:p-7 animate-fade-in-up stagger-4">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Usage Statistics</h3>
                                                <p className="text-xs text-surface-500 dark:text-surface-400">Real-time redemption data</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs text-surface-500 dark:text-surface-400">Times Used</span>
                                                    <span className="text-xs font-semibold text-surface-900 dark:text-white">
                                                        {coupon.user_count} {coupon.max_uses !== null ? `/ ${coupon.max_uses}` : ''}
                                                    </span>
                                                </div>
                                                {coupon.max_uses !== null && (
                                                    <div className="w-full h-2 bg-surface-100 dark:bg-surface-700/60 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                usagePercent >= 90
                                                                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                                                                    : usagePercent >= 60
                                                                    ? 'bg-gradient-to-r from-accent-400 to-accent-500'
                                                                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                            }`}
                                                            style={{ width: `${usagePercent}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-surface-100 dark:border-surface-700/40">
                                                <div>
                                                    <span className="text-[11px] text-surface-400 dark:text-surface-500 uppercase tracking-wider font-semibold">Type</span>
                                                    <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">{coupon.coupon_type?.name || '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[11px] text-surface-400 dark:text-surface-500 uppercase tracking-wider font-semibold">Rate</span>
                                                    <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                                                        {coupon.min_rate !== null ? `${coupon.min_rate}${coupon.coupon_type?.name === 'Percentage' ? '%' : coupon.coupon_type?.name === 'Day Free' ? ' days' : ''}` : '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[11px] text-surface-400 dark:text-surface-500 uppercase tracking-wider font-semibold">Min. Order</span>
                                                    <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                                                        {coupon.min_order !== null ? `$${coupon.min_order}` : 'None'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[11px] text-surface-400 dark:text-surface-500 uppercase tracking-wider font-semibold">Created</span>
                                                    <p className="text-sm font-bold text-surface-900 dark:text-white mt-1">
                                                        {new Date(coupon.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Info */}
                                    <div className="card p-6 sm:p-7 animate-fade-in-up stagger-5">
                                        <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Quick Actions</h3>
                                        <div className="space-y-2">
                                            <Link href={route('admin.coupons.index')}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-all duration-200 text-sm text-surface-600 dark:text-surface-300">
                                                <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                </svg>
                                                Back to All Coupons
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <div className="card p-6 sm:p-7 animate-fade-in-up stagger-6">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="btn-primary w-full">
                                            {processing ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Updating Coupon...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                    Update Coupon
                                                </>
                                            )}
                                        </button>
                                        <Link href={route('admin.coupons.index')}
                                            className="btn-ghost w-full justify-center mt-3">
                                            Cancel
                                        </Link>
                                    </div>
                                </div>

                            </div>
                        </form>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
