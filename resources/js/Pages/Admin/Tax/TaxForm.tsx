import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface TaxCategory {
    id: number;
    name: string;
}

interface VehicleLocation {
    location_id: number;
    location: string;
}

interface VehicleClass {
    class_no: string;
    class_desc: string;
}

interface Tax {
    id: number;
    tax_desc: string;
}

interface TaxFormData {
    tax_desc: string;
    calculation: string;
    category_id: string;
    value_in: string;
    add_or_minus: boolean;
    rate: string;
    apply_always: boolean;
    location_id: string;
    vehicle_classes: string[];
    is_active: boolean;
}

interface TaxListItem {
    id: number;
    tax_desc: string;
}

interface TaxFormProps {
    data: TaxFormData;
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
    processing: boolean;
    editingTax: Tax | null;
    categories: TaxCategory[];
    locations: VehicleLocation[];
    vehicleClasses: VehicleClass[];
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    taxList?: TaxListItem[];
    onCopyFrom?: (taxId: number) => void;
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

export default function TaxForm({
    data, setData, errors, processing, editingTax,
    categories, locations, vehicleClasses,
    onSubmit, onCancel, taxList, onCopyFrom,
}: TaxFormProps) {

    function toggleVehicleClass(classNo: string) {
        const current = data.vehicle_classes;
        if (current.includes(classNo)) {
            setData('vehicle_classes', current.filter((c) => c !== classNo));
        } else {
            setData('vehicle_classes', [...current, classNo]);
        }
    }

    function selectAllClasses() {
        setData('vehicle_classes', vehicleClasses.map((vc) => vc.class_no));
    }

    function clearAllClasses() {
        setData('vehicle_classes', []);
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Copy from existing */}
            {taxList && taxList.length > 0 && (
                <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-dashed border-brand-300/60 dark:border-brand-700/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                        <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Copy from existing</span>
                        <span className="text-[10px] text-surface-400 dark:text-surface-500 ml-1">— pre-fill this form from an existing rule</span>
                    </div>
                    <div className="relative">
                        <select
                            value=""
                            onChange={(e) => {
                                const id = parseInt(e.target.value);
                                if (id && onCopyFrom) onCopyFrom(id);
                            }}
                            className={selectBase}
                        >
                            <option value="">Select a tax to copy...</option>
                            {taxList.map((tax) => (
                                <option key={tax.id} value={tax.id}>{tax.tax_desc}</option>
                            ))}
                        </select>
                        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Description */}
            <div>
                <InputLabel value="Description *" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                <input
                    type="text"
                    value={data.tax_desc}
                    onChange={(e) => setData('tax_desc', e.target.value)}
                    placeholder="e.g. Airport Surcharge"
                    className={inputBase}
                />
                <InputError message={errors.tax_desc} className="mt-1" />
            </div>

            {/* Calculation & Category row */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <InputLabel value="Calculation *" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                    <div className="relative">
                        <select
                            value={data.calculation}
                            onChange={(e) => setData('calculation', e.target.value)}
                            className={selectBase}
                        >
                            <option value="Per Day">Per Day</option>
                            <option value="Per Rental">Per Rental</option>
                        </select>
                        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <InputError message={errors.calculation} className="mt-1" />
                </div>
                <div>
                    <InputLabel value="Category *" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                    <div className="relative">
                        <select
                            value={data.category_id}
                            onChange={(e) => setData('category_id', e.target.value)}
                            className={selectBase}
                        >
                            <option value="">Select category...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <InputError message={errors.category_id} className="mt-1" />
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
                    <InputLabel value={`Rate (${data.value_in === 'Percentage' ? '%' : '$'}) *`} className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
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

            {/* Add or Minus + Apply Always + is_active toggles */}
            <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Type</span>
                        <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Add a charge or subtract a discount.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setData('add_or_minus', true)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                data.add_or_minus
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
                            onClick={() => setData('add_or_minus', false)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                !data.add_or_minus
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
                            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Apply Always</span>
                            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Apply regardless of other conditions.</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={data.apply_always}
                            onClick={() => setData('apply_always', !data.apply_always)}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-800 ${
                                data.apply_always ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-600'
                            }`}
                        >
                            <span className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${data.apply_always ? 'translate-x-5' : 'translate-x-0'}`}>
                                {data.apply_always ? (
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

                <div className="border-t border-surface-100 dark:border-surface-700/40 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Status</span>
                            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Enable or disable this tax rule.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={data.is_active}
                                onClick={() => setData('is_active', !data.is_active)}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-800 ${
                                    data.is_active ? 'bg-emerald-500' : 'bg-surface-200 dark:bg-surface-600'
                                }`}
                            >
                                <span className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`}>
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
                            <span className={`text-xs font-semibold min-w-[4ch] ${data.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400 dark:text-surface-500'}`}>
                                {data.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location */}
            <div>
                <InputLabel value="Applicable Location" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300 mb-1.5" />
                <div className="relative">
                    <select
                        value={data.location_id}
                        onChange={(e) => setData('location_id', e.target.value)}
                        className={selectBase}
                    >
                        <option value="">All Locations</option>
                        {locations.map((loc) => (
                            <option key={loc.location_id} value={loc.location_id}>{loc.location}</option>
                        ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">Leave as "All Locations" to apply everywhere.</p>
                <InputError message={errors.location_id} className="mt-1" />
            </div>

            {/* Vehicle Classes - multi-select */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <InputLabel value="Applicable Vehicle Classes" className="!text-xs !font-semibold text-surface-700 dark:text-surface-300" />
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={selectAllClasses}
                            className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                        >
                            All
                        </button>
                        <button
                            type="button"
                            onClick={clearAllClasses}
                            className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-400 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50">
                    {vehicleClasses.map((vc) => {
                        const selected = data.vehicle_classes.includes(vc.class_no);
                        return (
                            <button
                                key={vc.class_no}
                                type="button"
                                onClick={() => toggleVehicleClass(vc.class_no)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                    selected
                                        ? 'bg-brand-500 text-white shadow-sm'
                                        : 'bg-white dark:bg-brand-800/60 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700/50 hover:border-brand-300 dark:hover:border-brand-600'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${selected ? 'bg-white/60' : 'bg-surface-300 dark:bg-surface-600'}`} />
                                <span>{vc.class_desc}</span>
                            </button>
                        );
                    })}
                </div>
                {data.vehicle_classes.length > 0 && (
                    <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">
                        {data.vehicle_classes.length} class{data.vehicle_classes.length !== 1 ? 'es' : ''} selected
                        {data.vehicle_classes.length === vehicleClasses.length && ' (All)'}
                    </p>
                )}
                <InputError message={errors.vehicle_classes} className="mt-1" />
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
                                {editingTax ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                {editingTax ? 'Update Tax' : 'Create Tax'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
