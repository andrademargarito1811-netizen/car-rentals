import { useState } from 'react';
import InputLabel from './InputLabel';
import InputError from './InputError';

interface CouponType {
    id: number;
    name: string;
}

interface CouponFormData {
    issued_by: string;
    start_date: string;
    end_date: string;
    min_order: string;
    max_uses: string;
    coupon_type_id: string;
    min_rate: string;
    is_active: boolean;
}

interface CouponFormProps {
    couponTypes: CouponType[];
    data: CouponFormData;
    setData: (key: keyof CouponFormData, value: string | boolean) => void;
    errors: Record<string, string>;
    processing?: boolean;
    onCancel?: () => void;
    submitLabel?: string;
}

function Divider({ label }: { label: string }) {
    return (
        <div className="relative col-span-full">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-100 dark:border-surface-700/60" />
            </div>
            <div className="relative flex justify-start">
                <span className="pr-3 text-[11px] font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 bg-white dark:bg-brand-800">
                    {label}
                </span>
            </div>
        </div>
    );
}

const rateConfig: Record<string, { label: string; description: string; placeholder: string; step: string }> = {
    Amount: { label: 'Amount', description: 'Fixed discount amount.', placeholder: '0.00', step: '0.01' },
    Percentage: { label: 'Percentage (%)', description: 'Discount percentage.', placeholder: '0.00', step: '0.01' },
    'Per Day': { label: 'Rate Per Day', description: 'Discount rate per day.', placeholder: '0.00', step: '0.01' },
    'Day Free': { label: 'Free Days', description: 'Number of free days.', placeholder: '0', step: '1' },
};

const inputBase = [
    'w-full h-11 px-4 text-sm',
    'bg-white dark:bg-brand-900/50',
    'border border-surface-200 dark:border-surface-700/60 rounded-lg',
    'text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500',
    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
    'transition-colors duration-150',
].join(' ');

export default function CouponForm({ couponTypes, data, setData, errors, processing = false, onCancel, submitLabel = 'Create Coupon' }: CouponFormProps) {
    const selectedType = couponTypes.find(t => t.id.toString() === data.coupon_type_id);
    const rc = rateConfig[selectedType?.name ?? ''] ?? { label: 'Rate', description: 'Rate value based on coupon type.', placeholder: '0.00', step: '0.01' };
    const [noExpiry, setNoExpiry] = useState(!data.start_date && !data.end_date);

    return (
        <div className="bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 rounded-xl shadow-sm">
            {/* Header */}
            <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-700/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-surface-900 dark:text-white">Coupon Details</h2>
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">The coupon code is auto-generated.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-surface-400 dark:text-surface-500">Status</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={data.is_active}
                            onClick={() => setData('is_active', !data.is_active)}
                            className={[
                                'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full',
                                'border-2 border-transparent transition-colors duration-200 ease-in-out',
                                'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-800',
                                data.is_active
                                    ? 'bg-emerald-500'
                                    : 'bg-surface-200 dark:bg-surface-600',
                            ].join(' ')}
                        >
                            <span
                                className={[
                                    'pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm ring-0',
                                    'transition-transform duration-200 ease-in-out',
                                    data.is_active ? 'translate-x-5' : 'translate-x-0',
                                ].join(' ')}
                            >
                                {data.is_active ? (
                                    <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </span>
                        </button>
                        <span className={[
                            'text-xs font-semibold min-w-[4ch]',
                            data.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400 dark:text-surface-500',
                        ].join(' ')}>
                            {data.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-12">
                    {/* Details section */}
                    <Divider label="Details" />

                    <div className="sm:col-span-6">
                        <InputLabel value="Coupon Type *" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                        <div className="relative">
                            <select
                                value={data.coupon_type_id}
                                onChange={e => setData('coupon_type_id', e.target.value)}
                                className={`${inputBase} appearance-none cursor-pointer pr-10`}
                            >
                                <option value="">Select type...</option>
                                {couponTypes.map((type) => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <InputError message={errors.coupon_type_id} className="mt-1" />
                    </div>

                    <div className="sm:col-span-6">
                        <InputLabel value="Issued By" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                        <input
                            type="text"
                            value={data.issued_by}
                            onChange={e => setData('issued_by', e.target.value)}
                            placeholder="e.g. Marketing Campaign"
                            className={inputBase}
                        />
                        <InputError message={errors.issued_by} className="mt-1" />
                    </div>

                    {/* Validity section */}
                    <Divider label="Validity Period" />

                    <div className="col-span-full bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5">
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

                        {!noExpiry && (
                            <>
                                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                                    <div className="w-full sm:flex-1">
                                        <InputLabel value="Start Date" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                            </span>
                                            <input
                                                type="date"
                                                value={data.start_date}
                                                onChange={e => setData('start_date', e.target.value)}
                                                className={`${inputBase} pl-10 [color-scheme:light] dark:[color-scheme:dark]`}
                                            />
                                        </div>
                                        <InputError message={errors.start_date} className="mt-1" />
                                    </div>

                                    <div className="hidden sm:flex items-center pb-3 px-1 text-surface-300 dark:text-surface-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>

                                    <div className="w-full sm:flex-1">
                                        <InputLabel value="End Date" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                            </span>
                                            <input
                                                type="date"
                                                value={data.end_date}
                                                onChange={e => setData('end_date', e.target.value)}
                                                min={data.start_date || undefined}
                                                className={`${inputBase} pl-10 [color-scheme:light] dark:[color-scheme:dark]`}
                                            />
                                        </div>
                                        <InputError message={errors.end_date} className="mt-1" />
                                    </div>
                                </div>
                                {data.start_date && data.end_date && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700/40">
                                        <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs text-surface-500 dark:text-surface-400">
                                            Valid for{' '}
                                            <strong className="text-brand-600 dark:text-brand-400 font-semibold">
                                                {(() => {
                                                    const diff = Math.round((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24));
                                                    return diff >= 0 ? `${diff} day${diff !== 1 ? 's' : ''}` : 'Invalid';
                                                })()}
                                            </strong>
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {noExpiry && (
                            <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">No expiry date &mdash; coupon never expires.</span>
                            </div>
                        )}
                    </div>

                    {/* Constraints section */}
                    <Divider label="Constraints" />

                    <div className="col-span-full bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5">
                        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-12">
                            <div className="sm:col-span-4">
                                <div className="flex items-start gap-1.5 mb-1.5 min-h-[2.5rem]">
                                    <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M1 4a1 1 0 011-1h2a1 1 0 010 2H2a1 1 0 01-1-1zM2 7.75a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 7.75zM2 11.75a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 15.75a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" />
                                    </svg>
                                    <InputLabel value="Minimum Order Amount" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300" />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                                        className={`${inputBase} pl-10`}
                                    />
                                </div>
                                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">Minimum cart value to apply this coupon.</p>
                                <InputError message={errors.min_order} className="mt-1" />
                            </div>

                            <div className="sm:col-span-4">
                                <div className="flex items-start gap-1.5 mb-1.5 min-h-[2.5rem]">
                                    {selectedType?.name === 'Day Free' ? (
                                        <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    <InputLabel value={rc.label} className="!text-xs !font-semibold text-surface-700 dark:text-surface-300" />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
                                        {selectedType?.name === 'Percentage' ? (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V4.5m0 15H4.5" />
                                            </svg>
                                        ) : selectedType?.name === 'Day Free' ? (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : selectedType?.name === 'Per Day' ? (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </span>
                                    <input
                                        type="number"
                                        step={rc.step}
                                        min="0"
                                        value={data.min_rate}
                                        onChange={e => setData('min_rate', e.target.value)}
                                        placeholder={rc.placeholder}
                                        className={`${inputBase} pl-10`}
                                    />
                                </div>
                                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">{rc.description}</p>
                                <InputError message={errors.min_rate} className="mt-1" />
                            </div>

                            <div className="sm:col-span-4">
                                <div className="flex items-start gap-1.5 mb-1.5 min-h-[2.5rem]">
                                    <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                                    </svg>
                                    <InputLabel value="Maximum Uses" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300" />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v18m9-18v18m3-16.5v15m-9-4.5h2.25m-4.5 0h1.5" />
                                        </svg>
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.max_uses}
                                        onChange={e => setData('max_uses', e.target.value)}
                                        placeholder="No limit"
                                        className={`${inputBase} pl-10`}
                                    />
                                </div>
                                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">Total redemptions allowed. Leave blank for unlimited.</p>
                                <InputError message={errors.max_uses} className="mt-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer actions */}
            <div className="relative px-6 py-5 border-t border-surface-100 dark:border-surface-700/60 rounded-b-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-surface-50/60 via-surface-50/30 to-transparent dark:from-brand-900/30 dark:via-brand-900/10 dark:to-transparent" />
                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent dark:via-brand-400/20" />
                <div className="relative flex items-center justify-between gap-4">
                    <p className="hidden sm:block text-[11px] text-surface-400 dark:text-surface-500">
                        Fields marked with <span className="text-red-400">*</span> are required.
                    </p>
                    <div className="flex items-center gap-3">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-surface-500 dark:text-surface-400 bg-white/80 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-xl hover:bg-white dark:hover:bg-brand-900/80 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600 active:scale-[0.97] transition-all duration-150 shrink-0 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                                <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="relative">Cancel</span>
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 shrink-0 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {processing ? (
                                <>
                                    <svg className="relative w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="relative">Creating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    <span className="relative">{submitLabel}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
