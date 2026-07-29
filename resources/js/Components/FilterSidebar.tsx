import { useMemo } from 'react';

interface FilterSidebarState {
    vehicleType: string;
    fuelFilter: string;
    transmissionFilter: string;
    minSeats: number;
    priceMin: number;
    priceMax: number;
    priceRangeMin: number;
    priceRangeMax: number;
}

interface FilterSidebarProps {
    state: FilterSidebarState;
    filteredCount: number;
    onVehicleTypeChange: (v: string) => void;
    onFuelFilterChange: (v: string) => void;
    onTransmissionFilterChange: (v: string) => void;
    onMinSeatsChange: (v: number) => void;
    onPriceMinChange: (v: number) => void;
    onPriceMaxChange: (v: number) => void;
    onReset: () => void;
    onApply?: () => void;
}

const VEHICLE_TYPES: { value: string; label: string }[] = [
    { value: 'Economy', label: 'Economy' },
    { value: "Regular SUV'S", label: 'SUV' },
    { value: 'Vans', label: 'Van' },
    { value: 'Full Size Van', label: 'Full Van' },
    { value: 'Flatbeds', label: 'Flatbed' },
];

const FUEL_OPTIONS = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSION_OPTIONS = ['Automatic', 'Manual'];
const SEAT_OPTIONS = [
    { value: 0, label: 'Any' },
    { value: 2, label: '2+' },
    { value: 4, label: '4+' },
    { value: 5, label: '5+' },
    { value: 7, label: '7+' },
];

const I = {
    sliders: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
    ),
    x: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    check: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
    ),
    fuel: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    gear: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    users: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    dollar: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    car: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
    ),
    vehicle: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    ),
    petrol: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 21V8a2 2 0 012-2h7a2 2 0 012 2v13M5 21h11M5 21a1 1 0 01-1-1M16 21a1 1 0 001-1M8 6h5M8 9h5M8 12h5M8 15h5" />
        </svg>
    ),
    diesel: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
    ),
    electric: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    hybrid: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M12 2l2.09 4.26L18.82 7l-1.18 4.73L21 14l-3.36 2.27L18.82 21l-4.73-1.18L12 22l-2.09-2.18L5.18 21l1.18-4.73L3 14l3.36-2.27L5.18 7l4.73-1.18L12 2z" />
        </svg>
    ),
    auto: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    manual: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16M4 6h16M4 18h7M4 18l3-3m-3 3l3 3M18 18l3-3m-3 3l3 3" />
        </svg>
    ),
    arrow: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
    ),
};

function vehicleTypeGlyph(type: string): React.ReactNode {
    const common = 'w-5 h-5';
    switch (type) {
        case 'Economy':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17h14l-1.4-5.6A2 2 0 0 0 15.7 10H8.3a2 2 0 0 0-1.9 1.4L5 17Z" />
                    <circle cx="8" cy="17" r="1.5" />
                    <circle cx="16" cy="17" r="1.5" />
                </svg>
            );
        case "Regular SUV'S":
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17h18l-1-7a2 2 0 0 0-2-1.6H6a2 2 0 0 0-2 1.6l-1 7Z" />
                    <path d="M3 17v2M21 17v2" />
                    <circle cx="7.5" cy="17" r="1.5" />
                    <circle cx="16.5" cy="17" r="1.5" />
                </svg>
            );
        case 'Vans':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="18" height="10" rx="1.5" />
                    <path d="M3 12h18" />
                    <circle cx="7" cy="18" r="1.5" />
                    <circle cx="17" cy="18" r="1.5" />
                </svg>
            );
        case 'Full Size Van':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 17V9a2 2 0 0 1 2-2h12l4 4v6H2Z" />
                    <path d="M16 7v4h4" />
                    <circle cx="7" cy="17" r="1.5" />
                    <circle cx="17" cy="17" r="1.5" />
                </svg>
            );
        case 'Flatbeds':
            return (
                <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 16h13V8H4a2 2 0 0 0-2 2v6Z" />
                    <path d="M15 11h4l3 3v2h-7" />
                    <circle cx="7" cy="18" r="1.5" />
                    <circle cx="18" cy="18" r="1.5" />
                </svg>
            );
        default:
            return I.car;
    }
}

const PULSE_STYLES = `
@keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes breathe { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
`;

export default function FilterSidebar({
    state,
    filteredCount,
    onVehicleTypeChange,
    onFuelFilterChange,
    onTransmissionFilterChange,
    onMinSeatsChange,
    onPriceMinChange,
    onPriceMaxChange,
    onReset,
    onApply,
}: FilterSidebarProps) {
    const activeCount = useMemo(() => {
        let n = 0;
        if (state.vehicleType !== 'any') n++;
        if (state.fuelFilter !== 'any') n++;
        if (state.transmissionFilter !== 'any') n++;
        if (state.minSeats > 0) n++;
        if (state.priceMin > state.priceRangeMin || state.priceMax < state.priceRangeMax) n++;
        return n;
    }, [state]);

    return (
        <>
            <style>{PULSE_STYLES}</style>
            <div className="relative group/panel">
                <div
                    className="absolute -inset-1 rounded-3xl opacity-60 group-hover/panel:opacity-90 transition-opacity duration-700"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(251,191,36,0.25), rgba(99,102,241,0.3))',
                        filter: 'blur(22px)',
                        animation: 'shimmer 6s ease-in-out infinite',
                        backgroundSize: '200% 200%',
                    }}
                />
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-surface-200/80 shadow-elevated overflow-hidden flex flex-col transition-all duration-500 group-hover/panel:border-surface-300/80">
                    <div className="relative h-28 shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-surface-900" />
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                                backgroundSize: '20px 20px',
                            }}
                        />
                        <div
                            className="absolute -top-16 -right-16 w-40 h-40 bg-accent-400/15 rounded-full blur-3xl"
                            style={{ animation: 'breathe 4s ease-in-out infinite' }}
                        />
                        <div
                            className="absolute -bottom-16 -left-16 w-40 h-40 bg-brand-400/15 rounded-full blur-3xl"
                            style={{ animation: 'breathe 4s ease-in-out infinite reverse' }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="relative h-full px-5 flex flex-col justify-end pb-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-accent-300 mb-1 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-400" />
                                </span>
                                Refine your search
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-white font-black text-lg flex items-center gap-2 min-w-0">
                                    <span className="text-accent-300 shrink-0">{I.sliders}</span>
                                    <span className="truncate">Filters</span>
                                </div>
                                {activeCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={onReset}
                                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95"
                                    >
                                        <span className="w-4 h-4 rounded-full bg-accent-400 text-brand-900 flex items-center justify-center">
                                            {activeCount}
                                        </span>
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 p-5 space-y-5">
                        <Section title="Vehicle type" icon={I.vehicle}>
                            <div className="grid grid-cols-3 gap-1.5">
                                <VehicleCard
                                    label="Any"
                                    active={state.vehicleType === 'any'}
                                    onClick={() => onVehicleTypeChange('any')}
                                    icon={I.car}
                                />
                                {VEHICLE_TYPES.map((t) => (
                                    <VehicleCard
                                        key={t.value}
                                        label={t.label}
                                        active={state.vehicleType === t.value}
                                        onClick={() => onVehicleTypeChange(t.value)}
                                        icon={vehicleTypeGlyph(t.value)}
                                    />
                                ))}
                            </div>
                        </Section>

                        <Section title="Fuel type" icon={I.fuel}>
                            <div className="grid grid-cols-2 gap-1.5">
                                <FuelCard
                                    label="Any"
                                    icon={I.fuel}
                                    tone="neutral"
                                    active={state.fuelFilter === 'any'}
                                    onClick={() => onFuelFilterChange('any')}
                                />
                                {FUEL_OPTIONS.map((f) => (
                                    <FuelCard
                                        key={f}
                                        label={f}
                                        icon={fuelIconFor(f)}
                                        tone={fuelToneFor(f)}
                                        active={state.fuelFilter === f}
                                        onClick={() => onFuelFilterChange(f)}
                                    />
                                ))}
                            </div>
                        </Section>

                        <Section title="Gearbox" icon={I.gear}>
                            <div className="grid grid-cols-3 gap-1.5">
                                <GearCard
                                    label="Any"
                                    icon={I.gear}
                                    active={state.transmissionFilter === 'any'}
                                    onClick={() => onTransmissionFilterChange('any')}
                                />
                                {TRANSMISSION_OPTIONS.map((t) => (
                                    <GearCard
                                        key={t}
                                        label={t}
                                        icon={t === 'Automatic' ? I.auto : I.manual}
                                        active={state.transmissionFilter === t}
                                        onClick={() => onTransmissionFilterChange(t)}
                                    />
                                ))}
                            </div>
                        </Section>

                        <Section title="Min seats" icon={I.users}>
                            <div className="grid grid-cols-5 gap-1.5">
                                {SEAT_OPTIONS.map((s) => {
                                    const active = state.minSeats === s.value;
                                    return (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => onMinSeatsChange(s.value)}
                                            className={`relative h-14 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                                                active
                                                    ? 'bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-md shadow-brand-700/30 ring-2 ring-offset-2 ring-offset-white ring-brand-500/40'
                                                    : 'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200 hover:border-surface-300'
                                            }`}
                                        >
                                            {active && (
                                                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-accent-400 text-brand-900 flex items-center justify-center">
                                                    {I.check}
                                                </span>
                                            )}
                                            <span className="text-sm leading-none tabular-nums">{s.label}</span>
                                            <span
                                                className={`text-[8px] font-bold uppercase tracking-wider leading-none ${
                                                    active ? 'text-white/70' : 'text-surface-400'
                                                }`}
                                            >
                                                seats
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>

                        <Section title="Price per day" icon={I.dollar}>
                            <div className="space-y-3">
                                <DualRangeSlider
                                    min={state.priceRangeMin}
                                    max={state.priceRangeMax}
                                    valueMin={state.priceMin}
                                    valueMax={state.priceMax}
                                    onChange={(lo, hi) => {
                                        onPriceMinChange(lo);
                                        onPriceMaxChange(hi);
                                    }}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <PriceInput
                                        label="Min"
                                        value={state.priceMin}
                                        min={state.priceRangeMin}
                                        max={state.priceMax}
                                        onChange={(v) => onPriceMinChange(v)}
                                    />
                                    <PriceInput
                                        label="Max"
                                        value={state.priceMax}
                                        min={state.priceMin}
                                        max={state.priceRangeMax}
                                        onChange={(v) => onPriceMaxChange(v)}
                                    />
                                </div>
                            </div>
                        </Section>
                    </div>

                    <div className="shrink-0 border-t border-surface-100 bg-white/95 backdrop-blur-sm px-5 py-3">
                        <button
                            type="button"
                            onClick={onApply}
                            className="group/cta relative w-full h-12 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-800 text-white font-black text-sm shadow-lg shadow-brand-700/30 hover:shadow-xl hover:shadow-brand-700/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700" />
                            <span className="relative">Show {filteredCount} cars</span>
                            <span className="relative transition-transform duration-300 group-hover/cta:translate-x-1">
                                {I.arrow}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function Section({
    title,
    icon,
    children,
    compact = false,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    compact?: boolean;
}) {
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-brand-600">{icon}</span>
                <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-surface-700">
                    {title}
                </h4>
                <div className="flex-1 h-px bg-gradient-to-r from-surface-200 to-transparent ml-1" />
            </div>
            <div className={compact ? '' : ''}>{children}</div>
        </div>
    );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all duration-200 active:scale-95 ${
                active
                    ? 'bg-gradient-to-r from-brand-700 to-brand-800 text-white shadow-sm'
                    : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
            }`}
        >
            {children}
        </button>
    );
}

type FuelTone = 'neutral' | 'red' | 'amber' | 'emerald' | 'teal';

function fuelToneFor(fuel: string): FuelTone {
    const f = fuel.toLowerCase();
    if (f.includes('electric')) return 'emerald';
    if (f.includes('hybrid')) return 'teal';
    if (f.includes('diesel')) return 'amber';
    if (f.includes('petrol') || f.includes('gasoline')) return 'red';
    return 'neutral';
}

function fuelIconFor(fuel: string): React.ReactNode {
    const f = fuel.toLowerCase();
    if (f.includes('electric')) return I.electric;
    if (f.includes('hybrid')) return I.hybrid;
    if (f.includes('diesel')) return I.diesel;
    if (f.includes('petrol') || f.includes('gasoline')) return I.petrol;
    return I.fuel;
}

const TONE_CLASSES: Record<FuelTone, { activeBg: string; activeText: string; activeRing: string; idleIcon: string }> = {
    neutral: {
        activeBg: 'bg-gradient-to-br from-surface-900 to-brand-900',
        activeText: 'text-white',
        activeRing: 'ring-brand-500/40',
        idleIcon: 'text-surface-400 group-hover/fuel:text-brand-600',
    },
    red: {
        activeBg: 'bg-gradient-to-br from-red-500 to-red-700',
        activeText: 'text-white',
        activeRing: 'ring-red-400/40',
        idleIcon: 'text-red-500 group-hover/fuel:text-red-600',
    },
    amber: {
        activeBg: 'bg-gradient-to-br from-amber-500 to-amber-700',
        activeText: 'text-white',
        activeRing: 'ring-amber-400/40',
        idleIcon: 'text-amber-500 group-hover/fuel:text-amber-600',
    },
    emerald: {
        activeBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
        activeText: 'text-white',
        activeRing: 'ring-emerald-400/40',
        idleIcon: 'text-emerald-500 group-hover/fuel:text-emerald-600',
    },
    teal: {
        activeBg: 'bg-gradient-to-br from-teal-500 to-teal-700',
        activeText: 'text-white',
        activeRing: 'ring-teal-400/40',
        idleIcon: 'text-teal-500 group-hover/fuel:text-teal-600',
    },
};

function FuelCard({
    label,
    icon,
    tone,
    active,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    tone: FuelTone;
    active: boolean;
    onClick: () => void;
}) {
    const t = TONE_CLASSES[tone];
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group/fuel relative h-11 rounded-xl text-[11px] font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-2 ${
                active
                    ? `${t.activeBg} ${t.activeText} shadow-md ring-2 ring-offset-2 ring-offset-white ${t.activeRing}`
                    : 'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200 hover:border-surface-300'
            }`}
        >
            <span className={`shrink-0 transition-colors ${active ? 'text-white' : t.idleIcon}`}>
                {icon}
            </span>
            <span className="truncate">{label}</span>
        </button>
    );
}

function GearCard({
    label,
    icon,
    active,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group/gear relative h-11 rounded-xl text-[11px] font-bold transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-0.5 px-1 ${
                active
                    ? 'bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-md shadow-brand-700/30 ring-2 ring-offset-2 ring-offset-white ring-brand-500/40'
                    : 'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200 hover:border-surface-300'
            }`}
        >
            {active && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-accent-400 text-brand-900 flex items-center justify-center">
                    {I.check}
                </span>
            )}
            <span className={`shrink-0 transition-colors ${active ? 'text-accent-300' : 'text-brand-600'}`}>
                {icon}
            </span>
            <span className="leading-none">{label}</span>
        </button>
    );
}

function VehicleCard({
    label,
    active,
    onClick,
    icon,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 p-1.5 transition-all duration-200 active:scale-95 ${
                active
                    ? 'bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-md shadow-brand-700/30 ring-2 ring-offset-2 ring-offset-white ring-brand-500/40'
                    : 'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200 hover:border-surface-300'
            }`}
        >
            {active && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-accent-400 text-brand-900 flex items-center justify-center">
                    {I.check}
                </span>
            )}
            <span className={active ? 'text-accent-300' : 'text-brand-600'}>{icon}</span>
            <span className="text-[10px] font-black leading-none">{label}</span>
        </button>
    );
}

function PriceInput({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="relative">
            <div className="text-[9px] font-black uppercase tracking-widest text-surface-400 mb-1">
                {label}
            </div>
            <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-surface-400">
                    $
                </span>
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isNaN(v)) return;
                        onChange(Math.max(min, Math.min(max, v)));
                    }}
                    className="w-full h-9 pl-6 pr-2 bg-white border border-surface-200 rounded-lg text-xs font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                />
            </div>
        </div>
    );
}

function DualRangeSlider({
    min,
    max,
    valueMin,
    valueMax,
    onChange,
}: {
    min: number;
    max: number;
    valueMin: number;
    valueMax: number;
    onChange: (lo: number, hi: number) => void;
}) {
    const range = Math.max(max - min, 1);
    const leftPct = ((Math.max(valueMin, min) - min) / range) * 100;
    const rightPct = ((Math.min(valueMax, max) - min) / range) * 100;

    return (
        <div className="relative h-10 select-none">
            <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-surface-200" />
            <div
                className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                style={{ left: `calc(${leftPct}% + 0.25rem - ${(leftPct / 100) * 0.5}rem)`, right: `calc(${100 - rightPct}% + 0.25rem - ${((100 - rightPct) / 100) * 0.5}rem)` }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={valueMin}
                onChange={(e) => {
                    const v = Math.min(Number(e.target.value), valueMax - 1);
                    onChange(v, valueMax);
                }}
                className="dual-range absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-700 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-brand-700/30 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand-700 [&::-moz-range-thumb]:cursor-grab"
                aria-label="Minimum price"
            />
            <input
                type="range"
                min={min}
                max={max}
                value={valueMax}
                onChange={(e) => {
                    const v = Math.max(Number(e.target.value), valueMin + 1);
                    onChange(valueMin, v);
                }}
                className="dual-range absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-700 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-brand-700/30 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand-700 [&::-moz-range-thumb]:cursor-grab"
                aria-label="Maximum price"
            />
        </div>
    );
}
