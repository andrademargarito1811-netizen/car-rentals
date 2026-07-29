import { useEffect, useRef } from 'react';

interface FilterState {
    query: string;
    brand: string;
    filter: string;
    vehicleType: string;
    fuelFilter: string;
    transmissionFilter: string;
    minSeats: number;
    priceMin: number;
    priceMax: number;
    priceRangeMin: number;
    priceRangeMax: number;
}

interface SearchFiltersDropdownProps {
    show: boolean;
    onClose: () => void;
    state: FilterState;
    brands: string[];
    brandCounts: Record<string, number>;
    stats: { total: number; available: number; topRated: number; avgPrice: number };
    carsTotal: number;
    cheapCount: number;
    onQueryChange: (v: string) => void;
    onBrandChange: (v: string) => void;
    onFilterChange: (v: string) => void;
    onVehicleTypeChange: (v: string) => void;
    onFuelFilterChange: (v: string) => void;
    onTransmissionFilterChange: (v: string) => void;
    onMinSeatsChange: (v: number) => void;
    onPriceMinChange: (v: number) => void;
    onPriceMaxChange: (v: number) => void;
    onReset: () => void;
    inline?: boolean;
}

const VEHICLE_TYPES = ['Economy', "Regular SUV'S", 'Vans', 'Full Size Van', 'Flatbeds'];
const FUEL_OPTIONS = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSION_OPTIONS = ['Automatic', 'Manual'];
const SEAT_OPTIONS = [2, 4, 5, 7];

export default function SearchFiltersDropdown({
    show,
    onClose,
    state,
    onVehicleTypeChange,
    onFuelFilterChange,
    onTransmissionFilterChange,
    onMinSeatsChange,
    onPriceMinChange,
    onPriceMaxChange,
    onReset,
    inline = false,
}: SearchFiltersDropdownProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!show || inline) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [show, onClose, inline]);

    useEffect(() => {
        if (!show || inline) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [show, onClose, inline]);

    if (!inline && !show) return null;

    const containerClass = inline
        ? 'relative w-full bg-white rounded-2xl border border-surface-200 shadow-elevated overflow-hidden'
        : 'absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[480px] max-w-[90vw] bg-white rounded-2xl border border-surface-200 shadow-elevated overflow-hidden animate-fade-in-up origin-top';

    return (
        <div
            ref={panelRef}
            className={containerClass}
            style={inline ? undefined : { animationDuration: '200ms' }}
        >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 border-b border-surface-100">
                <h3 className="text-xs font-black text-surface-950 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Filters
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReset}
                        className="text-[10px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50 transition"
                    >
                        Reset
                    </button>
                    {!inline && (
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
                {/* Vehicle Type */}
                <div>
                    <h4 className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">Vehicle Type</h4>
                    <div className="flex flex-wrap gap-1.5">
                        <PillBtn active={state.vehicleType === 'any'} onClick={() => onVehicleTypeChange('any')}>
                            <span className="w-5 h-5 rounded-md bg-surface-200 text-surface-600 flex items-center justify-center text-[9px] font-black">*</span>
                            Any
                        </PillBtn>
                        {VEHICLE_TYPES.map((t) => (
                            <PillBtn key={t} active={state.vehicleType === t} onClick={() => onVehicleTypeChange(t)}>
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${
                                    state.vehicleType === t
                                        ? 'bg-white/20 text-white'
                                        : 'bg-brand-100 text-brand-700'
                                }`}>
                                    {t === "Regular SUV'S" ? 'SUV' : t[0]}
                                </span>
                                {t}
                            </PillBtn>
                        ))}
                    </div>
                </div>

                {/* Fuel Type & Transmission */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">Fuel Type</h4>
                        <div className="flex flex-wrap gap-1.5">
                            <PillBtn active={state.fuelFilter === 'any'} onClick={() => onFuelFilterChange('any')}>Any</PillBtn>
                            {FUEL_OPTIONS.map((f) => (
                                <PillBtn key={f} active={state.fuelFilter === f} onClick={() => onFuelFilterChange(f)}>{f}</PillBtn>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">Transmission</h4>
                        <div className="flex flex-wrap gap-1.5">
                            <PillBtn active={state.transmissionFilter === 'any'} onClick={() => onTransmissionFilterChange('any')}>Any</PillBtn>
                            {TRANSMISSION_OPTIONS.map((t) => (
                                <PillBtn key={t} active={state.transmissionFilter === t} onClick={() => onTransmissionFilterChange(t)}>{t}</PillBtn>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Min Seats & Price Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">Min Seats</h4>
                        <div className="flex flex-wrap gap-1.5">
                            <PillBtn active={state.minSeats === 0} onClick={() => onMinSeatsChange(0)}>Any</PillBtn>
                            {SEAT_OPTIONS.map((n) => (
                                <PillBtn key={n} active={state.minSeats === n} onClick={() => onMinSeatsChange(n)}>{n}+</PillBtn>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">Price / Day</h4>
                        <div className="flex items-center gap-1">
                            <div className="flex-1">
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-surface-400">$</span>
                                    <input
                                        type="number"
                                        min={state.priceRangeMin}
                                        max={state.priceMax}
                                        value={state.priceMin}
                                        onChange={(e) => onPriceMinChange(Math.max(state.priceRangeMin, Math.min(state.priceMax, Number(e.target.value))))}
                                        className="w-full h-8 pl-5 pr-1.5 bg-white border border-surface-200 rounded-lg text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                    />
                                </div>
                            </div>
                            <span className="text-surface-300 text-[10px]">—</span>
                            <div className="flex-1">
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-surface-400">$</span>
                                    <input
                                        type="number"
                                        min={state.priceMin}
                                        max={state.priceRangeMax}
                                        value={state.priceMax}
                                        onChange={(e) => onPriceMaxChange(Math.min(state.priceRangeMax, Math.max(state.priceMin, Number(e.target.value))))}
                                        className="w-full h-8 pl-5 pr-1.5 bg-white border border-surface-200 rounded-lg text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Button */}
            {!inline && (
                <div className="sticky bottom-0 bg-white border-t border-surface-100 px-4 py-3">
                    <button
                        onClick={onClose}
                        className="w-full h-10 rounded-xl bg-gradient-to-r from-brand-700 to-brand-800 text-white text-sm font-bold shadow-lg shadow-brand-700/20 hover:shadow-glow-blue hover:from-brand-600 hover:to-brand-700 transition-all duration-300 active:scale-95"
                    >
                        Apply Filters
                    </button>
                </div>
            )}
        </div>
    );
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all duration-200 active:scale-95 ${
                active
                    ? 'bg-gradient-to-r from-brand-700 to-brand-800 text-white shadow-sm'
                    : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
            }`}
        >
            {children}
        </button>
    );
}
