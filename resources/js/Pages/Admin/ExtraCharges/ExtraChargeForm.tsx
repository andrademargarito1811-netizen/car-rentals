import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface ExtraCharge {
    id: number;
    name: string;
}

interface ExtraChargeFormData {
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

interface ExtraChargeFormProps {
    data: ExtraChargeFormData;
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
    processing: boolean;
    editingCharge: ExtraCharge | null;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const inputBase = [
    'w-full h-11 px-4 text-sm',
    'bg-white dark:bg-brand-900/50',
    'border border-surface-200 dark:border-surface-700/60 rounded-lg',
    'text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500',
    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
    'transition-colors duration-150',
].join(' ');

const selectBase = `${inputBase} appearance-none cursor-pointer pr-10`;

const Switch = ({ checked, onChange, tone = 'brand' }: { checked: boolean; onChange: () => void; tone?: 'brand' | 'emerald' }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-800 ${
            checked ? (tone === 'emerald' ? 'bg-emerald-500' : 'bg-brand-500') : 'bg-surface-200 dark:bg-surface-600'
        }`}
    >
        <span className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}>
            {checked ? (
                <svg className={`w-3 h-3 ${tone === 'emerald' ? 'text-emerald-500' : 'text-brand-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            ) : (
                <svg className="w-3 h-3 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
        </span>
    </button>
);

export default function ExtraChargeForm({
    data, setData, errors, processing, editingCharge,
    onSubmit, onCancel,
}: ExtraChargeFormProps) {

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Name */}
            <div>
                <InputLabel value="Name *" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. CDW"
                    className={inputBase}
                />
                <InputError message={errors.name} className="mt-1" />
            </div>

            {/* Type & Calculation row */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <InputLabel value="Type *" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                    <div className="relative">
                        <select
                            value={data.type}
                            onChange={(e) => setData('type', e.target.value)}
                            className={selectBase}
                        >
                            <option value="Extra Charge">Extra Charge</option>
                            <option value="Discount">Discount</option>
                        </select>
                        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <InputError message={errors.type} className="mt-1" />
                </div>
                <div>
                    <InputLabel value="Calculation *" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                    <div className="relative">
                        <select
                            value={data.calculation}
                            onChange={(e) => setData('calculation', e.target.value)}
                            className={selectBase}
                        >
                            <option value="Fixed">Fixed</option>
                            <option value="Per Day">Per Day</option>
                        </select>
                        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <InputError message={errors.calculation} className="mt-1" />
                </div>
            </div>

            {/* Value In & Rate row */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <InputLabel value="Value In *" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                    <div className="relative">
                        <select
                            value={data.value_in}
                            onChange={(e) => setData('value_in', e.target.value)}
                            className={selectBase}
                        >
                            <option value="Amount">Amount ($)</option>
                            <option value="Percentage">Percentage (%)</option>
                        </select>
                        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <InputError message={errors.value_in} className="mt-1" />
                </div>
                <div>
                    <InputLabel value={`Rate (${data.value_in === 'Percentage' ? '%' : '$'})`} className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none">
                            {data.value_in === 'Percentage' ? '%' : '$'}
                        </span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.rate}
                            onChange={(e) => setData('rate', e.target.value)}
                            placeholder="0.00"
                            className={`${inputBase} pl-8`}
                        />
                    </div>
                    <InputError message={errors.rate} className="mt-1" />
                </div>
            </div>

            {/* Operator + Taxable + Apply Always + Status */}
            <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Operator</span>
                        <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Add a charge or subtract a discount.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setData('operator', '+')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                data.operator === '+'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600/50'
                            }`}
                        >
                            <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setData('operator', '-')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                data.operator === '-'
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600/50'
                            }`}
                        >
                            <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                            Minus
                        </button>
                    </div>
                </div>

                <div className="border-t border-surface-100 dark:border-surface-700/40 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Taxable</span>
                            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Taxes apply on top of this charge.</p>
                        </div>
                        <Switch checked={data.taxable} onChange={() => setData('taxable', !data.taxable)} tone="emerald" />
                    </div>
                </div>

                <div className="border-t border-surface-100 dark:border-surface-700/40 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Apply Always</span>
                            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Pre-select this charge on every return.</p>
                        </div>
                        <Switch checked={data.apply_always} onChange={() => setData('apply_always', !data.apply_always)} />
                    </div>
                </div>

                <div className="border-t border-surface-100 dark:border-surface-700/40 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Status</span>
                            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Enable or disable this charge.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch checked={data.is_active} onChange={() => setData('is_active', !data.is_active)} tone="emerald" />
                            <span className={`text-xs font-semibold min-w-[4ch] ${data.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400 dark:text-surface-500'}`}>
                                {data.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit footer */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-surface-100 dark:border-surface-700/60">
                <p className="text-[11px] text-surface-400 dark:text-surface-500">
                    Fields marked with <span className="text-red-400">*</span> are required.
                </p>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-surface-500 dark:text-surface-400 bg-white/80 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-xl hover:bg-white dark:hover:bg-brand-900/80 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600 active:scale-[0.97] transition-all duration-150 shrink-0 overflow-hidden"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 shrink-0 overflow-hidden"
                    >
                        {processing ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {editingCharge ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                {editingCharge ? 'Update Charge' : 'Create Charge'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
