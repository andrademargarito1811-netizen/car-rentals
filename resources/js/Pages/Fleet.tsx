import React, { useEffect, useMemo, useRef, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import FilterSidebar from '@/Components/FilterSidebar';
import { Head, Link, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { cn } from '@/lib/utils';
import { countries as countriesList } from '@/data/countries';

interface BookedDateInfo {
    date: string;
    status: 'full' | 'partial';
    available_before?: string;
    available_after?: string;
}

interface Car {
    id: number;
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    description: string | null;
    daily_rate: number;
    fuel_type: string;
    seats: number;
    transmission: string;
    vehicle_type: string;
    baggage_capacity: number | null;
    image_path: string | null;
    status: string;
    avg_rating: number;
    ratings_count: number;
    booked_dates: BookedDateInfo[];
}

interface HeroSettings {
    id: number;
    badge_text: string;
    headline: string;
    headline_highlight: string;
    tagline: string | null;
    description: string | null;
    image_path: string | null;
    fleet_image_path: string | null;
    is_active: boolean;
    images: { id: number; image_path: string; tagline: string | null; alt_text: string | null; sort_order: number }[];
}

interface FleetPageSetting {
    id: number;
    hero_badge: string;
    hero_title: string;
    hero_highlight: string;
    hero_description: string | null;
    hero_image_path: string | null;
    is_active: boolean;
}

interface FleetProps {
    cars: { data: Car[]; links: { url: string | null; label: string; active: boolean }[] };
    fleetSettings?: FleetPageSetting;
}

type FilterKey = 'all' | 'available' | 'top-rated' | 'value';
type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'rating';
type ViewMode = 'grid' | 'list';

const CAR_IMAGES = [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=1200&h=900&fit=crop',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=900&fit=crop',
];

const LOCATIONS = ['West Plaza Hotel @ Lebuu St.', 'Airport'];

const BRAND_PALETTES: Record<string, { from: string; to: string; text: string; ring: string; solid: string }> = {
    Toyota: { from: 'from-red-400', to: 'to-red-600', text: 'text-red-600', ring: 'ring-red-200', solid: 'bg-red-500' },
    BMW: { from: 'from-blue-400', to: 'to-blue-700', text: 'text-blue-700', ring: 'ring-blue-200', solid: 'bg-blue-600' },
    Mercedes: { from: 'from-slate-400', to: 'to-slate-700', text: 'text-slate-800', ring: 'ring-slate-300', solid: 'bg-slate-700' },
    Audi: { from: 'from-zinc-400', to: 'to-zinc-700', text: 'text-zinc-800', ring: 'ring-zinc-300', solid: 'bg-zinc-700' },
    Tesla: { from: 'from-rose-400', to: 'to-rose-600', text: 'text-rose-700', ring: 'ring-rose-200', solid: 'bg-rose-600' },
    Honda: { from: 'from-red-300', to: 'to-red-500', text: 'text-red-600', ring: 'ring-red-200', solid: 'bg-red-500' },
    Ford: { from: 'from-blue-300', to: 'to-blue-600', text: 'text-blue-700', ring: 'ring-blue-200', solid: 'bg-blue-600' },
    Hyundai: { from: 'from-sky-400', to: 'to-sky-600', text: 'text-sky-700', ring: 'ring-sky-200', solid: 'bg-sky-600' },
    Nissan: { from: 'from-amber-400', to: 'to-amber-600', text: 'text-amber-700', ring: 'ring-amber-200', solid: 'bg-amber-500' },
    Lexus: { from: 'from-emerald-400', to: 'to-emerald-600', text: 'text-emerald-700', ring: 'ring-emerald-200', solid: 'bg-emerald-600' },
    Porsche: { from: 'from-amber-500', to: 'to-orange-600', text: 'text-orange-700', ring: 'ring-orange-200', solid: 'bg-orange-500' },
    Volvo: { from: 'from-sky-500', to: 'to-indigo-600', text: 'text-indigo-700', ring: 'ring-indigo-200', solid: 'bg-indigo-600' },
};

function brandPalette(brand: string) {
    return (
        BRAND_PALETTES[brand] || {
            from: 'from-brand-400',
            to: 'to-brand-700',
            text: 'text-brand-700',
            ring: 'ring-brand-200',
            solid: 'bg-brand-700',
        }
    );
}

const FUEL_OPTIONS = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSION_OPTIONS = ['Automatic', 'Manual'];

const FUEL_LABELS: Record<string, string> = {
    Petrol: 'Gasoline',
    gasoline: 'Gasoline',
    Gasoline: 'Gasoline',
    Diesel: 'Diesel',
    diesel: 'Diesel',
    Electric: 'Electric',
    electric: 'Electric',
    Hybrid: 'Hybrid',
    hybrid: 'Hybrid',
};

const TRANSMISSION_LABELS: Record<string, string> = {
    Automatic: 'Automatic',
    automatic: 'Automatic',
    Manual: 'Manual',
    manual: 'Manual',
};

function displayLabel(value: string, labelMap?: Record<string, string>): string {
    if (!value) return value;
    if (labelMap?.[value]) return labelMap[value];
    return value.charAt(0).toUpperCase() + value.slice(1);
}

const LOCATION_DETAILS: Record<string, { address: string; zone: string }> = {
    'West Plaza Hotel @ Lebuu St.': { address: 'Lebuu Street, Downtown', zone: 'Downtown' },
    'Airport': { address: 'Roman Tmetuchl International Airport', zone: 'Airport' },
};

const ZONE_COLORS: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
    Airport: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', ring: 'ring-sky-200' },
    Downtown: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', ring: 'ring-violet-200' },
    Westside: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
    Eastside: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', ring: 'ring-amber-200' },
};

function zoneStyle(zone: string) {
    return ZONE_COLORS[zone] || { bg: 'bg-surface-50', text: 'text-surface-600', dot: 'bg-surface-500', ring: 'ring-surface-200' };
}

function LocationSelect({
    value,
    onChange,
    label,
    isOpen: controlledIsOpen,
    onOpenChange,
}: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledIsOpen ?? internalOpen;
    const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
        const resolved = typeof next === 'function' ? next(open) : next;
        onOpenChange?.(resolved);
        if (controlledIsOpen === undefined) setInternalOpen(resolved);
    };
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const ref = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const details = LOCATION_DETAILS[value] || { address: '', zone: '' };
    const zs = zoneStyle(details.zone);

    const filtered = useMemo(() => {
        if (!query.trim()) return LOCATIONS;
        const q = query.toLowerCase();
        return LOCATIONS.filter((loc) => {
            const det = LOCATION_DETAILS[loc];
            return (
                loc.toLowerCase().includes(q) ||
                (det?.address?.toLowerCase().includes(q)) ||
                (det?.zone?.toLowerCase().includes(q))
            );
        });
    }, [query]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    useEffect(() => {
        if (open && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open]);

    useEffect(() => {
        setActiveIndex(-1);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filtered.length) {
            e.preventDefault();
            onChange(filtered[activeIndex]);
            setOpen(false);
            setQuery('');
        }
    };

    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const el = listRef.current.children[activeIndex] as HTMLElement;
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    return (
        <div className="group/field" ref={ref}>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                    <span className="text-brand-600">{FIELD_ICONS.location}</span>
                    {label}
                </div>
            </div>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className={`inline-flex items-center gap-2.5 w-full h-10 px-3 rounded-xl border text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${
                        open
                            ? 'bg-surface-950 text-white border-surface-950'
                            : 'bg-white border-surface-200/70 hover:border-surface-300 text-surface-700 hover:text-surface-900'
                    }`}
                >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        open ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-600'
                    }`}>
                        {FIELD_ICONS.location}
                    </span>
                    <div className="flex-1 text-left min-w-0">
                        <div className="truncate leading-tight">{value}</div>
                        {details.zone && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-white/60' : zs.dot}`} />
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${open ? 'text-white/60' : zs.text}`}>{details.zone}</span>
                            </div>
                        )}
                    </div>
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180 text-white/60' : 'text-surface-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {open && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-full min-w-[320px] animate-fade-in-up origin-top" style={{ animationDuration: '200ms' }}>
                        <LocationDropdown
                            key={`${label}-${value}`}
                            query={query}
                            setQuery={setQuery}
                            filtered={filtered}
                            activeIndex={activeIndex}
                            setActiveIndex={setActiveIndex}
                            searchRef={searchRef}
                            listRef={listRef}
                            selectedValue={value}
                            onSelect={(loc) => {
                                onChange(loc);
                                setOpen(false);
                                setQuery('');
                            }}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function LocationDropdown({
    query,
    setQuery,
    filtered,
    activeIndex,
    setActiveIndex,
    searchRef,
    listRef,
    selectedValue,
    onSelect,
    onKeyDown,
}: {
    query: string;
    setQuery: (v: string) => void;
    filtered: string[];
    activeIndex: number;
    setActiveIndex: (v: number) => void;
    searchRef: React.RefObject<HTMLInputElement | null>;
    listRef: React.RefObject<HTMLDivElement | null>;
    selectedValue: string;
    onSelect: (loc: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}) {
    return (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-elevated overflow-hidden">
            <div className="sticky top-0 z-10 bg-white px-4 py-3 border-b border-surface-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-surface-950 uppercase tracking-wider flex items-center gap-2">
                        {FIELD_ICONS.location}
                        Select location
                    </h3>
                    <button
                        onClick={() => {
                            setQuery('');
                            setActiveIndex(-1);
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50 transition"
                    >
                        Clear
                    </button>
                </div>
                <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        ref={searchRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search locations..."
                        className="w-full h-9 pl-8 pr-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium text-surface-900 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-200 hover:bg-surface-300 flex items-center justify-center text-surface-500 transition-colors"
                        >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2 space-y-0.5" role="listbox">
                {filtered.length === 0 ? (
                    <div className="py-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-surface-600">No locations found</p>
                        <p className="text-xs text-surface-600 mt-1">Try a different search term</p>
                    </div>
                ) : (
                    filtered.map((loc, idx) => {
                        const det = LOCATION_DETAILS[loc];
                        const isSelected = loc === selectedValue;
                        const isHighlighted = idx === activeIndex;
                        const z = det ? zoneStyle(det.zone) : null;
                        return (
                            <button
                                key={loc}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => onSelect(loc)}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 text-left ${
                                    isSelected
                                        ? 'bg-brand-50 ring-1 ring-brand-200'
                                        : isHighlighted
                                            ? 'bg-surface-50'
                                            : 'hover:bg-surface-50'
                                }`}
                            >
                                <span
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                                            : z
                                                ? `${z.bg} ${z.text}`
                                                : 'bg-surface-100 text-surface-500'
                                    }`}
                                >
                                    {FIELD_ICONS.location}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-brand-700' : 'text-surface-900'}`}>
                                            {loc}
                                        </span>
                                        {z && (
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${z.bg} ${z.text} ring-1 ${z.ring} shrink-0`}>
                                                <span className={`w-1 h-1 rounded-full ${z.dot}`} />
                                                {det?.zone}
                                            </span>
                                        )}
                                    </div>
                                    {det && (
                                        <div className="text-[10px] font-medium text-surface-500 truncate mt-0.5">
                                            {det.address}
                                        </div>
                                    )}
                                </div>
                                {isSelected && (
                                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 animate-scale-in">
                                        {FIELD_ICONS.check}
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {filtered.length > 0 && (
                <div className="sticky bottom-0 bg-white border-t border-surface-100 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-surface-600">
                        {filtered.length} location{filtered.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] text-surface-500">
                        <kbd className="px-1 py-0.5 bg-surface-100 rounded text-[8px] font-mono">↑↓</kbd>
                        <span>navigate</span>
                        <kbd className="px-1 py-0.5 bg-surface-100 rounded text-[8px] font-mono ml-1">↵</kbd>
                        <span>select</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function CountryField({
    value,
    onChange,
    label,
    dense = false,
}: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    dense?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selected = useMemo(() => countriesList.find((c) => c.name === value), [value]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return countriesList;
        return countriesList.filter(
            (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
        );
    }, [search]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        searchRef.current?.focus();
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    useEffect(() => {
        setHighlighted(0);
    }, [search]);

    useEffect(() => {
        if (highlighted >= 0 && listRef.current) {
            const el = listRef.current.children[highlighted] as HTMLElement;
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlighted]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter' && highlighted >= 0 && highlighted < filtered.length) {
            e.preventDefault();
            onChange(filtered[highlighted].name);
            setOpen(false);
            setSearch('');
        } else if (e.key === 'Escape') {
            setOpen(false);
            setSearch('');
        }
    };

    const fieldHeight = dense ? 'h-9' : 'h-10';

    return (
        <div className="group/field" ref={ref}>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                    <span className="text-brand-600">{FIELD_ICONS.globe}</span>
                    {label}
                </div>
            </div>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className={`w-full text-left ${fieldHeight} px-3 bg-surface-50/80 hover:bg-brand-50/60 border border-surface-200 hover:border-brand-200 rounded-xl text-sm font-semibold text-surface-900 transition-all flex items-center gap-2 ${
                        open ? 'border-brand-300 bg-brand-50/60' : ''
                    }`}
                >
                    {selected ? (
                        <>
                            <span className="text-base leading-none shrink-0">{selected.flag}</span>
                            <span className="flex-1 truncate">{selected.name}</span>
                        </>
                    ) : (
                        <span className="text-surface-600 font-normal">Select country</span>
                    )}
                    <svg
                        className={`w-4 h-4 text-surface-500 transition-transform duration-300 ${open ? 'rotate-180 text-brand-600' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {open && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-full animate-fade-in-up origin-top" style={{ animationDuration: '200ms' }}>
                        <div className="bg-white rounded-2xl border border-surface-200 shadow-elevated overflow-hidden">
                            <div className="sticky top-0 z-10 bg-white px-4 py-3 border-b border-surface-100">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-black text-surface-950 uppercase tracking-wider flex items-center gap-2">
                                        {FIELD_ICONS.globe}
                                        Select country
                                    </h3>
                                    <button
                                        onClick={() => { setSearch(''); setHighlighted(0); }}
                                        className="text-[10px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50 transition"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </span>
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search countries..."
                                        className="w-full h-9 pl-8 pr-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium text-surface-900 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-200 hover:bg-surface-300 flex items-center justify-center text-surface-500 transition-colors"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2 space-y-0.5" role="listbox">
                                {filtered.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-semibold text-surface-600">No countries found</p>
                                        <p className="text-xs text-surface-600 mt-1">Try a different search term</p>
                                    </div>
                                ) : (
                                    filtered.map((c, i) => {
                                        const isSelected = c.name === value;
                                        const isHighlighted = i === highlighted;
                                        return (
                                            <button
                                                key={c.code}
                                                type="button"
                                                role="option"
                                                aria-selected={isSelected}
                                                onClick={() => {
                                                    onChange(c.name);
                                                    setOpen(false);
                                                    setSearch('');
                                                }}
                                                onMouseEnter={() => setHighlighted(i)}
                                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 text-left ${
                                                    isSelected
                                                        ? 'bg-brand-50 ring-1 ring-brand-200'
                                                        : isHighlighted
                                                            ? 'bg-surface-50'
                                                            : 'hover:bg-surface-50'
                                                }`}
                                            >
                                                <span
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg transition-all duration-200 ${
                                                        isSelected
                                                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                                                            : 'bg-surface-100 text-surface-500'
                                                    }`}
                                                >
                                                    {c.flag}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-sm font-bold truncate ${isSelected ? 'text-brand-700' : 'text-surface-900'}`}>
                                                        {c.name}
                                                    </span>
                                                    <div className="text-[10px] font-medium text-surface-500 truncate mt-0.5">
                                                        {c.code}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 animate-scale-in">
                                                        {FIELD_ICONS.check}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {filtered.length > 0 && (
                                <div className="sticky bottom-0 bg-white border-t border-surface-100 px-4 py-2.5 flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-surface-600">
                                        {filtered.length} countr{filtered.length !== 1 ? 'ies' : 'y'}
                                    </span>
                                    <div className="flex items-center gap-1 text-[9px] text-surface-500">
                                        <kbd className="px-1 py-0.5 bg-surface-100 rounded text-[8px] font-mono">↑↓</kbd>
                                        <span>navigate</span>
                                        <kbd className="px-1 py-0.5 bg-surface-100 rounded text-[8px] font-mono ml-1">↵</kbd>
                                        <span>select</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const FIELD_ICONS = {
    location: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    calendar: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    clock: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    globe: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    car: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
    ),
    check: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
    ),
    edit: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
    ),
    spark: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    ),
    arrow: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
    ),
    x: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    sliders: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
    ),
    plus: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
    ),
    swap: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    ),
    users: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
    dollar: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

function getCarImage(car: Car): string {
    if (car.image_path) return `/storage/${car.image_path}`;
    return CAR_IMAGES[car.id % CAR_IMAGES.length];
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

function formatDateLong(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime12h(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function diffDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const a = new Date(start + 'T00:00:00').getTime();
    const b = new Date(end + 'T00:00:00').getTime();
    return Math.max(0, Math.round((b - a) / 86400000));
}

function nextAvailableLabel(bookedDates: BookedDateInfo[]): { label: string; tone: 'now' | 'soon' | 'later' } {
    const fullSet = new Set(bookedDates.filter((b) => b.status === 'full').map((b) => b.date));
    const partialMap = new Map(bookedDates.filter((b) => b.status === 'partial').map((b) => [b.date, b]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let cursor = new Date(today);
    for (let i = 0; i < 90; i++) {
        const iso = cursor.toISOString().slice(0, 10);
        if (!fullSet.has(iso)) {
            const partial = partialMap.get(iso);
            if (partial?.available_after) {
                const timeStr = formatTime12h(partial.available_after);
                if (i === 0) return { label: `Open after ${timeStr}`, tone: 'now' };
                const formatted = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return { label: `Next ${formatted} (after ${timeStr})`, tone: i <= 3 ? 'soon' : 'later' };
            }
            if (i === 0) return { label: 'Open now', tone: 'now' };
            const formatted = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return { label: `Next ${formatted}`, tone: i <= 3 ? 'soon' : 'later' };
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return { label: 'Check calendar', tone: 'later' };
}

function useCountUp(target: number, duration = 1500) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const startTime = performance.now();
                    const animate = (now: number) => {
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setCount(Math.floor(eased * target));
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration]);

    return { count, ref };
}

function useBookedMap(booked: BookedDateInfo[]): Map<string, BookedDateInfo> {
    return useMemo(() => {
        const map = new Map<string, BookedDateInfo>();
        for (const entry of booked) map.set(entry.date, entry);
        return map;
    }, [booked]);
}

function getDayStatus(
    dateStr: string,
    bookedMap: Map<string, BookedDateInfo>,
): { status: 'full' | 'partial' | 'available'; tooltip: string; variant: 'full' | 'available' | 'end-partial' | 'start-partial' | 'both-partial' } {
    const info = bookedMap.get(dateStr);
    if (!info) return { status: 'available', tooltip: 'Fully available', variant: 'available' };
    if (info.status === 'full') return { status: 'full', tooltip: 'Fully booked', variant: 'full' };
    const hasBefore = !!info.available_before;
    const hasAfter = !!info.available_after;
    if (hasBefore && hasAfter) {
        return { status: 'partial', tooltip: `Available ${formatTime12h(info.available_after!)} – ${formatTime12h(info.available_before!)}`, variant: 'both-partial' };
    }
    if (hasBefore) {
        return { status: 'partial', tooltip: `Available until ${formatTime12h(info.available_before!)}`, variant: 'start-partial' };
    }
    return { status: 'partial', tooltip: `Available from ${formatTime12h(info.available_after!)}`, variant: 'end-partial' };
}

function fuelStyle(fuel: string): { bg: string; text: string; ring: string } {
    const f = fuel.toLowerCase();
    if (f.includes('electric')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' };
    if (f.includes('hybrid')) return { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200' };
    if (f.includes('diesel')) return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' };
    return { bg: 'bg-brand-50', text: 'text-brand-700', ring: 'ring-brand-200' };
}

function HeroStat({
    value,
    label,
    prefix,
    suffix,
    tone = 'default',
}: {
    value: number;
    label: string;
    prefix?: string;
    suffix?: string;
    tone?: 'default' | 'emerald' | 'accent';
}) {
    const { count, ref } = useCountUp(value, 1500);
    const color =
        tone === 'emerald' ? 'text-emerald-400' : tone === 'accent' ? 'text-accent-400' : 'text-white';
    return (
        <div
            ref={ref}
            className="group p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300"
        >
            <div className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${color}`}>
                {prefix}
                {count}
                {suffix}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-1.5">
                {label}
            </div>
        </div>
    );
}

function RatingBadge({ value, count, light = false }: { value: number; count: number; light?: boolean }) {
    if (count === 0 || value <= 0) {
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
                    light ? 'bg-white/15 text-white border border-white/20' : 'bg-white text-surface-700 shadow-md'
                }`}
            >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                New
            </span>
        );
    }
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
                light ? 'bg-white/15 text-white border border-white/20' : 'bg-white text-surface-900 shadow-md'
            }`}
        >
            <svg className="w-3 h-3 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {value.toFixed(1)}
            <span className={light ? 'text-white/60' : 'text-surface-500'}>({count})</span>
        </span>
    );
}

function CalendarStrip({ bookedDates, days = 14 }: { bookedDates: BookedDateInfo[]; days?: number }) {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    const bookedMap = useBookedMap(bookedDates);

    const cells = useMemo(() => {
        const arr: { iso: string; variant: string; tooltip: string }[] = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const iso = d.toISOString().slice(0, 10);
            const info = getDayStatus(iso, bookedMap);
            arr.push({
                iso,
                variant: info.variant,
                tooltip: `${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${info.tooltip}`,
            });
        }
        return arr;
    }, [today, days, bookedMap]);

    const openCount = cells.filter((c) => c.variant !== 'full').length;

    function stripColor(variant: string): string {
        if (variant === 'end-partial') return 'bg-emerald-400/90';
        if (variant === 'start-partial' || variant === 'both-partial') return 'bg-amber-400/80';
        if (variant === 'full') return 'bg-red-300/80';
        return 'bg-emerald-400/90';
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-[3px] flex-1">
                {cells.map((c) => (
                    <div
                        key={c.iso}
                        title={c.tooltip}
                        className={`h-1.5 flex-1 rounded-full ${stripColor(c.variant)}`}
                    />
                ))}
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-bold tabular-nums">
                {openCount}d open
            </span>
        </div>
    );
}

function WishlistButton({ id, light = false }: { id: number; light?: boolean }) {
    const [active, setActive] = useState(false);
    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActive((v) => !v);
            }}
            aria-label={active ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 active:scale-90 ${
                light
                    ? `border ${active ? 'bg-red-500/90 border-red-400 text-white' : 'bg-white/15 border-white/20 text-white hover:bg-white/25'}`
                    : `${active ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-white/90 border border-white/40 text-surface-600 hover:bg-white shadow-md hover:text-red-500'}`
            }`}
        >
            <svg
                className="w-4 h-4"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        </button>
    );
}

const SpecIcons = {
    fuel: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    transmission: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    seats: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
        </svg>
    ),
    baggage: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    ),
};

const FilterIcons = {
    all: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h6M4 12h10M4 18h6M16 6h4M14 12h6M16 18h4" />
        </svg>
    ),
    available: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4M12 2l2.09 4.26L18.82 7l-1.18 4.73L21 14l-3.36 2.27L18.82 21l-4.73-1.18L12 22l-2.09-2.18L5.18 21l1.18-4.73L3 14l3.36-2.27L5.18 7l4.73-1.18L12 2z" />
        </svg>
    ),
    topRated: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    ),
    value: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    sort: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
    ),
    grid: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    list: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    sliders: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
    ),
};

function EditableField({
    icon,
    label,
    value,
    onChange,
    type = 'text',
    options = [],
    min,
    max,
    placeholder = 'Not set',
    dense = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: 'text' | 'date' | 'time' | 'select';
    options?: { value: string; label: string }[];
    min?: string;
    max?: string;
    placeholder?: string;
    dense?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [temp, setTemp] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

    useEffect(() => {
        setTemp(value);
    }, [value]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current instanceof HTMLInputElement) {
                inputRef.current.select?.();
            }
        }
    }, [editing]);

    const save = () => {
        if (temp !== value) onChange(temp);
        setEditing(false);
    };

    const cancel = () => {
        setTemp(value);
        setEditing(false);
    };

    const displayValue = useMemo(() => {
        if (type === 'select') {
            const opt = options.find((o) => o.value === value);
            return opt ? opt.label : value;
        }
        if (type === 'date' && value) {
            return formatDateLong(value);
        }
        if (type === 'time' && value) {
            return formatTime12h(value);
        }
        return value || placeholder;
    }, [value, options, type, placeholder]);

    const fieldHeight = dense ? 'h-9' : 'h-10';

    return (
        <div className="group/field">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                    <span className="text-brand-600">{icon}</span>
                    {label}
                </div>
                {!editing && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="opacity-0 group-hover/field:opacity-100 transition-opacity duration-200 text-[10px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                    >
                        {FIELD_ICONS.edit}
                        Edit
                    </button>
                )}
            </div>
            {editing ? (
                <div className="flex items-center gap-1.5 animate-fade-in">
                    {type === 'select' ? (
                        <select
                            ref={inputRef as React.RefObject<HTMLSelectElement>}
                            value={temp}
                            onChange={(e) => setTemp(e.target.value)}
                            onBlur={save}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') cancel();
                            }}
                            className={`flex-1 ${fieldHeight} px-3 bg-white border-2 border-brand-500 rounded-xl text-sm font-semibold text-surface-900 focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all`}
                        >
                            {options.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            type={type}
                            value={temp}
                            onChange={(e) => setTemp(e.target.value)}
                            onBlur={save}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') save();
                                if (e.key === 'Escape') cancel();
                            }}
                            min={min}
                            max={max}
                            className={`flex-1 ${fieldHeight} px-3 bg-white border-2 border-brand-500 rounded-xl text-sm font-semibold text-surface-900 focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all`}
                        />
                    )}
                    <button
                        type="button"
                        onClick={save}
                        className={`${fieldHeight} w-${fieldHeight === 'h-9' ? '9' : '10'} rounded-xl bg-brand-700 text-white flex items-center justify-center hover:bg-brand-600 transition-colors active:scale-95`}
                    >
                        {FIELD_ICONS.check}
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className={`w-full text-left ${fieldHeight} px-3 bg-surface-50/80 hover:bg-brand-50/60 border border-surface-200 hover:border-brand-200 rounded-xl text-sm font-semibold text-surface-900 transition-all flex items-center group/btn`}
                >
                    <span className={`truncate flex-1 ${!value ? 'text-surface-500 font-normal' : ''}`}>{displayValue}</span>
                    <span className="ml-2 text-surface-500 group-hover/btn:text-brand-600 transition-colors">
                        {FIELD_ICONS.edit}
                    </span>
                </button>
            )}
        </div>
    );
}

function AnimatedPrice({ value, className = '' }: { value: number; className?: string }) {
    const [display, setDisplay] = useState(value);
    const previous = useRef(value);

    useEffect(() => {
        const start = previous.current;
        const end = value;
        if (start === end) return;
        const duration = 600;
        const startTime = performance.now();
        const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
            else previous.current = end;
        };
        requestAnimationFrame(animate);
    }, [value]);

    return <span className={className}>{formatPrice(display)}</span>;
}

function BookingStepBar({
    currentStep,
    selectedCar,
}: {
    currentStep: number;
    selectedCar: Car | null;
}) {
    const [hoveredStep, setHoveredStep] = useState<number | null>(null);
    const [animatingStep, setAnimatingStep] = useState<number | null>(null);
    const prevStep = useRef(currentStep);

    useEffect(() => {
        if (prevStep.current !== currentStep) {
            setAnimatingStep(currentStep);
            const t = setTimeout(() => setAnimatingStep(null), 500);
            prevStep.current = currentStep;
            return () => clearTimeout(t);
        }
    }, [currentStep]);

    const steps = [
        { num: 1, label: 'Browse Fleet', desc: 'Explore our collection', tooltip: 'View all available vehicles in our fleet' },
        { num: 2, label: 'Pick a Car', desc: 'Choose your ride', tooltip: 'Select the perfect car for your journey' },
        { num: 3, label: 'Set Details', desc: 'Configure booking', tooltip: 'Set pickup dates, times, and locations' },
        { num: 4, label: 'Book Now', desc: 'Confirm & pay', tooltip: 'Review and complete your reservation' },
    ];

    const progressPercent = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

    return (
        <div className="relative">
            {/* Glassmorphism Container */}
            <div
                className="relative bg-white/70 backdrop-blur-xl rounded-xl border border-white/60 shadow-md shadow-black/[0.03] px-3 sm:px-6 py-2.5 sm:py-3 overflow-hidden"
            >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-50/30 via-transparent to-accent-50/20 pointer-events-none" />

                {/* Progress bar at top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-surface-100/50">
                    <div
                        className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500 transition-all duration-700 ease-out rounded-full"
                        style={{
                            width: `${progressPercent}%`,
                            backgroundSize: '200% 100%',
                            animation: 'lineShimmer 2s linear infinite',
                        }}
                    />
                </div>

                <div className="relative flex items-center justify-between gap-0 max-w-lg mx-auto">
                    {steps.map((step, i) => {
                        const isCompleted = step.num < currentStep;
                        const isCurrent = step.num === currentStep;
                        const isLast = i === steps.length - 1;
                        const isAnimating = animatingStep === step.num;
                        const isHovered = hoveredStep === step.num;

                        return (
                            <React.Fragment key={step.num}>
                                {/* Step Item */}
                                <div
                                    className="relative flex items-center gap-1.5 sm:flex-col sm:items-center sm:gap-0.5 shrink-0"
                                    onMouseEnter={() => setHoveredStep(step.num)}
                                    onMouseLeave={() => setHoveredStep(null)}
                                >
                                    {/* Tooltip */}
                                    {isHovered && (
                                        <div
                                            className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-surface-900 text-white text-[9px] font-medium rounded-md whitespace-nowrap z-50 pointer-events-none"
                                            style={{ animation: 'tooltipFade 0.2s ease-out' }}
                                        >
                                            {step.tooltip}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-surface-900" />
                                        </div>
                                    )}

                                    {/* Step Circle */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isCompleted) {
                                                // Navigate back logic could be added here
                                            }
                                        }}
                                        disabled={!isCompleted}
                                        className={`relative w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all duration-300 ${
                                            isCompleted
                                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/25 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-110 active:scale-95'
                                                : isCurrent
                                                    ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-700/30 ring-2 sm:ring-3 ring-brand-200/50'
                                                    : 'bg-surface-100/80 text-surface-500 hover:bg-surface-200/80'
                                        } ${isAnimating ? 'scale-110' : ''}`}
                                        style={{
                                            animation: isAnimating ? 'stepBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : undefined,
                                        }}
                                    >
                                        {/* Pulsing ring for current step */}
                                        {isCurrent && (
                                            <span
                                                className="absolute inset-0 rounded-full border-2 border-brand-400 pointer-events-none"
                                                style={{ animation: 'pulseRing 2s ease-out infinite' }}
                                            />
                                        )}

                                        {/* Confetti particles for final step */}
                                        {isCurrent && currentStep === 4 && (
                                            <>
                                                <span className="absolute -top-0.5 left-1/2 w-1 h-1 bg-accent-400 rounded-full" style={{ animation: 'confettiBurst 1s ease-out infinite' }} />
                                                <span className="absolute -top-0.5 left-1/3 w-0.5 h-0.5 bg-emerald-400 rounded-full" style={{ animation: 'confettiBurst 1s ease-out infinite 0.2s' }} />
                                                <span className="absolute -top-0.5 right-1/3 w-0.5 h-0.5 bg-brand-400 rounded-full" style={{ animation: 'confettiBurst 1s ease-out infinite 0.4s' }} />
                                            </>
                                        )}

                                        {/* Number or Checkmark */}
                                        {isCompleted ? (
                                            <svg
                                                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                style={{ animation: 'checkMorph 0.5s ease-out' }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span>{step.num}</span>
                                        )}
                                    </button>

                                    {/* Labels - inline on mobile, stacked on desktop */}
                                    <div className="flex flex-col sm:items-center sm:gap-0">
                                        <span
                                            className={`text-[9px] sm:text-[10px] font-bold transition-colors duration-300 leading-tight ${
                                                isCompleted
                                                    ? 'text-emerald-600'
                                                    : isCurrent
                                                        ? 'text-surface-900'
                                                        : 'text-surface-500'
                                            }`}
                                        >
                                            {step.label}
                                        </span>
                                        <span
                                            className={`hidden sm:block text-[7px] sm:text-[8px] font-medium transition-colors duration-300 leading-tight ${
                                                isCompleted
                                                    ? 'text-emerald-400'
                                                    : isCurrent
                                                        ? 'text-surface-500'
                                                        : 'text-surface-300'
                                            }`}
                                        >
                                            {step.desc}
                                        </span>
                                    </div>
                                </div>

                                {/* Connecting Line */}
                                {!isLast && (
                                    <div className="flex-1 mx-1.5 sm:mx-2 mb-4 sm:mb-5">
                                        <div className="relative h-0.5 rounded-full bg-surface-200/50 overflow-hidden">
                                            <div
                                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                                                    isCompleted
                                                        ? 'w-full'
                                                        : isCurrent
                                                            ? 'w-1/2'
                                                            : 'w-0'
                                                }`}
                                                style={{
                                                    background: isCompleted
                                                        ? 'linear-gradient(90deg, #34d399, #10b981, #059669)'
                                                        : isCurrent
                                                            ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                                                            : 'transparent',
                                                    backgroundSize: '200% 100%',
                                                    animation: isCompleted ? 'lineShimmer 2s linear infinite' : undefined,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Progress indicator - mobile */}
                <div className="sm:hidden flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-surface-200/30">
                    <span className="text-[8px] font-bold text-surface-500 uppercase tracking-wider">
                        {currentStep}/{steps.length}
                    </span>
                    <div className="flex gap-0.5">
                        {steps.map((step) => (
                            <div
                                key={step.num}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    step.num < currentStep
                                        ? 'bg-emerald-500 w-1.5'
                                        : step.num === currentStep
                                            ? 'bg-brand-600 w-2.5'
                                            : 'bg-surface-300 w-1.5'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function BrandChip({
    brand,
    count,
    isActive,
    onClick,
}: {
    brand: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}) {
    const palette = brandPalette(brand);
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group/brand relative shrink-0 inline-flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-2xl text-xs font-bold transition-all duration-300 active:scale-95 ${
                isActive
                    ? `bg-gradient-to-r ${palette.from} ${palette.to} text-white shadow-lg ring-2 ring-offset-2 ring-offset-white ${palette.ring} z-10`
                    : 'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200/80 hover:border-surface-300 shadow-sm'
            }`}
        >
            <span
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                    isActive
                        ? 'bg-white/25 text-white'
                        : `bg-gradient-to-br ${palette.from} ${palette.to} text-white shadow-sm group-hover/brand:scale-110`
                }`}
            >
                {brand === 'all' ? '∗' : brand[0]}
            </span>
            <span className="capitalize tracking-wide">{brand === 'all' ? 'All brands' : brand}</span>
            <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                    isActive ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500'
                }`}
            >
                {count}
            </span>
        </button>
    );
}

function FilterPill({
    label,
    count,
    Icon,
    isActive,
    onClick,
}: {
    label: string;
    count: number;
    Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group/pill relative shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-2xl text-xs font-bold transition-all duration-300 active:scale-95 ${
                isActive
                    ? 'bg-gradient-to-r from-surface-900 to-brand-900 text-white shadow-lg shadow-brand-900/20 ring-2 ring-offset-2 ring-offset-white ring-surface-900/20 z-10'
                    : 'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200/80 hover:border-surface-300 shadow-sm'
            }`}
        >
            <Icon
                className={`w-3.5 h-3.5 transition-colors ${
                    isActive ? 'text-accent-400' : 'text-surface-500 group-hover/pill:text-brand-600'
                }`}
            />
            <span>{label}</span>
            <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'bg-surface-100 text-surface-500'
                }`}
            >
                {count}
            </span>
        </button>
    );
}

function CarCard({
    car,
    view = 'grid',
    isSelected = false,
    onSelectToggle,
    index = 0,
    pickupDate,
    pickupTime,
    pickupLocation,
    returnDate,
    returnTime,
    returnLocation,
}: {
    car: Car;
    view?: ViewMode;
    isSelected?: boolean;
    onSelectToggle?: (car: Car) => void;
    index?: number;
    pickupDate?: string;
    pickupTime?: string;
    pickupLocation?: string;
    returnDate?: string;
    returnTime?: string;
    returnLocation?: string;
}) {
    const route = useRoute();
    const availability = nextAvailableLabel(car.booked_dates);
    const isTop = car.avg_rating >= 4.7 && car.ratings_count >= 5;
    const f = fuelStyle(car.fuel_type);

    const handleSelect = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectToggle?.(car);
    };

    if (view === 'list') {
        const listStagger = `${0.05 + index * 0.05}s`;
        return (
            <div
                className={`group relative bg-white rounded-xl border transition-all duration-500 overflow-hidden ${
                    isSelected
                        ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-elevated'
                        : 'border-surface-200/60 hover:border-surface-300 hover:shadow-xl hover:-translate-y-0.5'
                }`}
                style={{ animationDelay: listStagger, animationFillMode: 'forwards' }}
            >
                {isSelected && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/30">
                        {FIELD_ICONS.check}
                        Selected
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr_200px]">
                    <Link
                        href={route('cars.show', car.id)}
                        className="relative h-48 sm:h-auto sm:min-h-[200px] bg-surface-100 overflow-hidden block"
                    >
                        <img
                            src={getCarImage(car)}
                            alt={`${car.brand} ${car.model}`}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform [transition-duration:1000ms]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-surface-900 shadow-sm">
                                {car.year}
                            </span>
                        </div>
                        <div className="absolute top-3 right-3">
                            <WishlistButton id={car.id} light />
                        </div>
                        <div className="absolute bottom-3 left-3">
                            <RatingBadge value={car.avg_rating} count={car.ratings_count} light />
                        </div>
                    </Link>
                    <div className="p-5 flex flex-col gap-3">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-surface-400">
                                {car.brand}
                                <span className="ml-2 normal-case text-[10px] font-bold text-surface-500 bg-surface-100 px-1.5 py-0.5 rounded-md">
                                    {car.vehicle_type}
                                </span>
                            </span>
                            <Link
                                href={route('cars.show', car.id)}
                                className="text-xl font-bold text-surface-900 leading-tight mt-0.5 block hover:text-brand-700 transition-colors"
                            >
                                {car.model}
                            </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-surface-600">
<span className="flex items-center gap-1">{SpecIcons.fuel} {displayLabel(car.fuel_type, FUEL_LABELS)}</span>
                    <span className="text-surface-300">·</span>
                    <span className="flex items-center gap-1">{SpecIcons.transmission} {displayLabel(car.transmission, TRANSMISSION_LABELS)}</span>
                    <span className="text-surface-300">·</span>
                    <span className="flex items-center gap-1">{SpecIcons.seats} {car.seats} seats</span>
                    <span className="text-surface-300">·</span>
                    <span className="flex items-center gap-1">{SpecIcons.baggage} {car.baggage_capacity ?? '—'} bags</span>
                </div>
                <div className="flex items-center gap-3 mt-auto">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border text-[11px] font-bold shadow-sm ${
                                availability.tone === 'now' ? 'text-emerald-700 border-emerald-200' : availability.tone === 'soon' ? 'text-amber-700 border-amber-200' : 'text-surface-600 border-surface-200'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                    availability.tone === 'now' ? 'bg-emerald-500 animate-pulse' : availability.tone === 'soon' ? 'bg-amber-500' : 'bg-surface-400'
                                }`} />
                                {availability.label}
                            </span>
                        </div>
                    </div>
                    <div className="p-5 sm:border-l border-surface-100 flex sm:flex-col sm:justify-center items-center sm:items-end gap-3 bg-surface-50/40">
                        <div className="text-center sm:text-right">
                            <div className="flex items-baseline justify-center sm:justify-end gap-1.5">
                                <span className="text-2xl font-bold text-surface-900 tracking-tight">{formatPrice(car.daily_rate)}</span>
                                <span className="text-xs text-surface-400 font-medium">/day</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                            <Link
                                href={route('book.now', { carId: car.id, pickup_date: pickupDate, pickup_time: pickupTime, pickup_location: pickupLocation, return_date: returnDate, return_time: returnTime, return_location: returnLocation })}
                                className="inline-flex items-center justify-center gap-1.5 px-5 h-10 rounded-full bg-surface-900 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm active:scale-95"
                            >
                                Book Now
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <button
                                type="button"
                                onClick={handleSelect}
                                className={`text-xs font-semibold transition-all duration-200 ${
                                    isSelected ? 'text-emerald-600' : 'text-surface-400 hover:text-surface-700'
                                }`}
                            >
                                {isSelected ? 'Selected' : 'Select'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const staggerDelay = `${0.05 + index * 0.06}s`;

    return (
        <div
            className={`group relative h-full bg-white rounded-xl overflow-hidden border transition-all duration-500 flex flex-col ${
                isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-elevated'
                    : 'border-surface-200/60 hover:border-surface-300 hover:shadow-xl hover:-translate-y-1'
            }`}
            style={{ animationDelay: staggerDelay, animationFillMode: 'forwards' }}
        >
            {isSelected && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/30 animate-bounce-in">
                    {FIELD_ICONS.check}
                    Selected
                </div>
            )}

            {/* Image */}
            <div className="relative h-56 sm:h-64 overflow-hidden bg-surface-100">
                <Link href={route('cars.show', car.id)} className="block w-full h-full">
                    <img
                        src={getCarImage(car)}
                        alt={`${car.brand} ${car.model}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform [transition-duration:1000ms]"
                    />
                </Link>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <RatingBadge value={car.avg_rating} count={car.ratings_count} light />
                    {isTop && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-accent-400 to-amber-400 text-brand-900 shadow-lg">
                            Top Rated
                        </span>
                    )}
                </div>
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-surface-900 shadow-sm">
                        {car.year}
                    </span>
                    <WishlistButton id={car.id} light />
                </div>

                {/* Availability badge on image */}
                <div className="absolute bottom-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-bold shadow-sm ${
                        availability.tone === 'now' ? 'text-emerald-700' : availability.tone === 'soon' ? 'text-amber-700' : 'text-surface-700'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${
                            availability.tone === 'now' ? 'bg-emerald-500 animate-pulse' : availability.tone === 'soon' ? 'bg-amber-500' : 'bg-surface-500'
                        }`} />
                        {availability.label}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Brand + Model */}
                <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-surface-400">
                        {car.brand}
                        <span className="ml-2 normal-case text-[10px] font-bold text-surface-500 bg-surface-100 px-1.5 py-0.5 rounded-md">
                            {car.vehicle_type}
                        </span>
                    </span>
                    <h3 className="text-lg font-bold text-surface-900 leading-tight mt-0.5">{car.model}</h3>
                </div>

                {/* Specs inline */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-surface-600">
                    <span className="flex items-center gap-1">{SpecIcons.fuel} {displayLabel(car.fuel_type, FUEL_LABELS)}</span>
                    <span className="text-surface-300">·</span>
                    <span className="flex items-center gap-1">{SpecIcons.transmission} {displayLabel(car.transmission, TRANSMISSION_LABELS)}</span>
                    <span className="text-surface-300">·</span>
                    <span className="flex items-center gap-1">{SpecIcons.seats} {car.seats} seats</span>
                    <span className="text-surface-300">·</span>
                    <span className="flex items-center gap-1">{SpecIcons.baggage} {car.baggage_capacity ?? '—'} bags</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-surface-900 tracking-tight">{formatPrice(car.daily_rate)}</span>
                            <span className="text-xs text-surface-400 font-medium">/day</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSelect}
                            className={`text-xs font-semibold transition-all duration-200 ${
                                isSelected ? 'text-emerald-600' : 'text-surface-400 hover:text-surface-700'
                            }`}
                        >
                            {isSelected ? 'Selected' : 'Select'}
                        </button>
                        <Link
                            href={route('book.now', { carId: car.id, pickup_date: pickupDate, pickup_time: pickupTime, pickup_location: pickupLocation, return_date: returnDate, return_time: returnTime, return_location: returnLocation })}
                            className="inline-flex items-center justify-center gap-1.5 px-5 h-10 rounded-full bg-surface-900 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm active:scale-95"
                        >
                            Book Now
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HeroFeaturedCard({ car, isSelected, onSelect }: { car: Car; isSelected: boolean; onSelect: (car: Car) => void }) {
    const route = useRoute();
    const isTop = car.avg_rating >= 4.7 && car.ratings_count >= 5;

    return (
        <div
            className={`group relative block h-full min-h-[420px] sm:min-h-[560px] rounded-3xl overflow-hidden isolate transition-all duration-500 ${
                isSelected ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-surface-50' : ''
            }`}
        >
            <Link
                href={route('cars.show', car.id)}
                className="absolute inset-0 z-0"
            >
                <img
                    src={getCarImage(car)}
                    alt={`${car.brand} ${car.model}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all [transition-duration:1500ms] ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent" />
            </Link>

            <div className="relative z-10 h-full flex flex-col p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between gap-4 mb-auto">
                    <div className="flex flex-col items-start gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent-400 to-amber-400 text-brand-900 text-[10px] font-black uppercase tracking-widest shadow-lg">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Editor's pick
                        </span>
                        {isTop && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/15 backdrop-blur-md text-white border border-white/20">
                                Top rated
                            </span>
                        )}
                    </div>
                    <RatingBadge value={car.avg_rating} count={car.ratings_count} light />
                </div>

                <div className="mt-auto">
                    <div className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-accent-300 mb-2 sm:mb-3">
                        {car.brand} · {car.year}
                        <span className="ml-2 normal-case text-[10px] font-bold text-accent-300 bg-white/10 px-1.5 py-0.5 rounded-md ring-1 ring-white/20">
                            {car.vehicle_type}
                        </span>
                    </div>
                    <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-[-0.03em] leading-[0.95] mb-4 sm:mb-6">
                        {car.model}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ring-1 ring-white/20 backdrop-blur-md bg-white/10 text-white">
                            {SpecIcons.fuel}
                            {displayLabel(car.fuel_type, FUEL_LABELS)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ring-1 ring-white/20 backdrop-blur-md bg-white/10 text-white">
                            {SpecIcons.transmission}
                            {displayLabel(car.transmission, TRANSMISSION_LABELS)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ring-1 ring-white/20 backdrop-blur-md bg-white/10 text-white">
                            {SpecIcons.seats}
                            {car.seats} seats
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ring-1 ring-white/20 backdrop-blur-md bg-white/10 text-white">
                            {SpecIcons.baggage}
                            {car.baggage_capacity ?? '—'} bags
                        </span>
                    </div>

                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
                                Starting from
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                    {formatPrice(car.daily_rate)}
                                </div>
                                <span className="text-sm font-semibold text-white/60">/day</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('cars.show', car.id)}
                                className="inline-flex items-center gap-2 px-5 sm:px-6 h-12 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 font-bold text-sm hover:bg-white/25 transition-all duration-300"
                            >
                                Explore
                            </Link>
                            <button
                                type="button"
                                onClick={() => onSelect(car)}
                                className={`inline-flex items-center gap-2 px-5 sm:px-6 h-12 rounded-full font-bold text-sm transition-all duration-300 shadow-xl shadow-black/20 ${
                                    isSelected
                                        ? 'bg-emerald-400 text-brand-900 hover:bg-emerald-300'
                                        : 'bg-white text-surface-950 hover:bg-accent-400 hover:text-brand-900'
                                }`}
                            >
                                {isSelected ? (
                                    <>
                                        {FIELD_ICONS.check}
                                        In booking
                                    </>
                                ) : (
                                    <>
                                        Add to booking
                                        {FIELD_ICONS.arrow}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniFeaturedCard({ car, isSelected, onSelect }: { car: Car; isSelected: boolean; onSelect: (car: Car) => void }) {
    const route = useRoute();

    return (
        <div
            className={`group relative block h-full bg-white rounded-2xl overflow-hidden border transition-all duration-500 hover:shadow-card-hover hover:-translate-y-0.5 ${
                isSelected ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-surface-200/60 hover:border-surface-300'
            }`}
        >
            <div className="relative h-40 sm:h-48 overflow-hidden bg-surface-100">
                <Link href={route('cars.show', car.id)} className="block w-full h-full">
                    <img
                        src={getCarImage(car)}
                        alt={`${car.brand} ${car.model}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform [transition-duration:1200ms] ease-out"
                    />
                </Link>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-surface-900 shadow-sm">
                        {car.year}
                    </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                    <RatingBadge value={car.avg_rating} count={car.ratings_count} light />
                </div>
                {isSelected && (
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                        {FIELD_ICONS.check}
                        In booking
                    </div>
                )}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80 mb-0.5">
                        {car.brand}
                    </div>
                    <div className="text-base sm:text-lg font-black text-white tracking-tight leading-none truncate">
                        {car.model}
                    </div>
                </div>
            </div>
            <div className="p-4 flex items-end justify-between gap-2">
                <div>
                    <div className="text-[9px] font-bold text-surface-500 uppercase tracking-widest mb-0.5">
                        From
                    </div>
                    <div className="flex items-baseline gap-1">
                        <div className="text-xl font-black text-surface-950 tracking-tight">
                            {formatPrice(car.daily_rate)}
                        </div>
                        <span className="text-[10px] font-semibold text-surface-500">/day</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onSelect(car)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSelected
                            ? 'bg-emerald-500 text-white rotate-0'
                            : 'bg-surface-100 group-hover:bg-brand-700 group-hover:text-white group-hover:rotate-[-45deg] text-surface-600'
                    }`}
                >
                    {isSelected ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

function FeaturedSpotlight({
    cars,
    selectedCarId,
    onSelect,
}: {
    cars: Car[];
    selectedCarId: number | null;
    onSelect: (car: Car) => void;
}) {
    if (cars.length === 0) return null;
    const [hero, ...rest] = cars;
    const sidecars = rest.slice(0, 4);

    return (
        <section className="relative mb-12">
            <div className="flex items-end justify-between mb-6 sm:mb-8 flex-wrap gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent-100 to-amber-100 text-accent-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-accent-200/50">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-500" />
                        </span>
                        Editor's selection
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-surface-950 tracking-[-0.03em] leading-tight">
                        Top picks{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-500 to-amber-500">
                            curated for you
                        </span>
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4 sm:gap-5">
                <div className="lg:col-span-2 lg:row-span-2">
                    <HeroFeaturedCard
                        car={hero}
                        isSelected={selectedCarId === hero.id}
                        onSelect={onSelect}
                    />
                </div>
                {sidecars.map((car) => (
                    <div key={car.id} className="lg:row-span-1">
                        <MiniFeaturedCard
                            car={car}
                            isSelected={selectedCarId === car.id}
                            onSelect={onSelect}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

const pulseKeyframes = `
@keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes breathe { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
@keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
@keyframes stepBounce { 0% { transform: scale(0.8); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
@keyframes checkMorph { 0% { transform: scale(0) rotate(-45deg); opacity: 0; } 50% { transform: scale(1.2) rotate(0deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
@keyframes lineShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes confettiBurst { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-30px) rotate(180deg); opacity: 0; } }
@keyframes tooltipFade { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
`;

const EXTRAS_CATALOG: {
    key: string;
    label: string;
    desc: string;
    pricePerDay: number;
    from: string;
    to: string;
    bg: string;
    text: string;
    ring: string;
    dot: string;
    icon: React.ReactElement;
}[] = [
    {
        key: 'insurance',
        label: 'Premium insurance',
        desc: 'Full coverage',
        pricePerDay: 15,
        from: 'from-sky-400',
        to: 'to-blue-600',
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        ring: 'ring-sky-200',
        dot: 'bg-sky-500',
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },
    {
        key: 'childSeat',
        label: 'Child seat',
        desc: 'Toddler safe',
        pricePerDay: 5,
        from: 'from-pink-400',
        to: 'to-rose-600',
        bg: 'bg-pink-50',
        text: 'text-pink-700',
        ring: 'ring-pink-200',
        dot: 'bg-pink-500',
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        key: 'gps',
        label: 'GPS navigation',
        desc: 'Offline maps',
        pricePerDay: 3,
        from: 'from-emerald-400',
        to: 'to-teal-600',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        ring: 'ring-emerald-200',
        dot: 'bg-emerald-500',
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        key: 'driver',
        label: 'Extra driver',
        desc: 'Share the drive',
        pricePerDay: 8,
        from: 'from-violet-400',
        to: 'to-purple-600',
        bg: 'bg-violet-50',
        text: 'text-violet-700',
        ring: 'ring-violet-200',
        dot: 'bg-violet-500',
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
];

const PROMO_CODES: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
    WELCOME10: { type: 'percent', value: 10, label: '10% welcome offer' },
    SAVE20: { type: 'fixed', value: 20, label: '$20 off your ride' },
    FLEET15: { type: 'percent', value: 15, label: '15% off the fleet' },
    SUMMER25: { type: 'fixed', value: 25, label: '$25 summer deal' },
};

function BookingSummaryPanel({
    selectedCar,
    pickupLocation,
    setPickupLocation,
    returnLocation,
    setReturnLocation,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pickupTime,
    setPickupTime,
    returnTime,
    setReturnTime,
    country,
    setCountry,
    onRemoveCar,
    isAuthenticated,
    route,
    onClose,
}: {
    selectedCar: Car | null;
    pickupLocation: string;
    setPickupLocation: (v: string) => void;
    returnLocation: string;
    setReturnLocation: (v: string) => void;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    pickupTime: string;
    setPickupTime: (v: string) => void;
    returnTime: string;
    setReturnTime: (v: string) => void;
    country: string;
    setCountry: (v: string) => void;
    onRemoveCar: () => void;
    isAuthenticated: boolean;
    route: (name: string, params?: any) => string;
    onClose?: () => void;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const days = diffDays(startDate, endDate);
    const billableDays = Math.max(days, 1);
    const subtotal = selectedCar ? selectedCar.daily_rate * billableDays : 0;

    const [extras, setExtras] = useState<Record<string, boolean>>({});
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: 'percent' | 'fixed'; value: number; label: string } | null>(null);
    const [promoStatus, setPromoStatus] = useState<'idle' | 'applying' | 'success' | 'error'>('idle');
    const [breakdownOpen, setBreakdownOpen] = useState(true);
    const [priceFlash, setPriceFlash] = useState(false);
    const prevTotalRef = useRef(0);
    const [taxItems, setTaxItems] = useState<{ id: number; tax_desc: string; category: string; amount: number; add_or_minus: boolean; value_in: string; rate: number }[]>([]);

    const toggleExtra = (key: string) => {
        setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const extrasDailyTotal = EXTRAS_CATALOG.reduce((sum, e) => sum + (extras[e.key] ? e.pricePerDay : 0), 0);
    const extrasTotal = extrasDailyTotal * billableDays;
    const extrasCount = Object.values(extras).filter(Boolean).length;

    const netTax = taxItems.reduce((sum, t) => sum + (t.add_or_minus ? t.amount : -t.amount), 0);
    const preDiscountTotal = subtotal + extrasTotal + netTax;

    useEffect(() => {
        if (!selectedCar?.id || !billableDays) return;
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(route('taxes.calculate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
            body: JSON.stringify({
                car_id: selectedCar.id,
                pickup_location: pickupLocation || null,
                billing_days: billableDays,
                daily_rate: selectedCar.daily_rate,
                subtotal,
            }),
        })
            .then(r => r.json())
            .then(data => setTaxItems(data.taxes || []))
            .catch(() => setTaxItems([]));
    }, [selectedCar?.id, billableDays, selectedCar?.daily_rate, pickupLocation, subtotal]);
    const discount =
        appliedPromo && selectedCar
            ? appliedPromo.type === 'percent'
                ? preDiscountTotal * (appliedPromo.value / 100)
                : Math.min(appliedPromo.value, preDiscountTotal)
            : 0;
    const total = Math.max(0, preDiscountTotal - discount);
    const hasValidRange = days > 0 && startDate && endDate;

    useEffect(() => {
        if (prevTotalRef.current !== total) {
            setPriceFlash(true);
            const t = setTimeout(() => setPriceFlash(false), 700);
            prevTotalRef.current = total;
            return () => clearTimeout(t);
        }
    }, [total]);

    const applyPromo = () => {
        const code = promoCode.trim().toUpperCase();
        if (!code) return;
        setPromoStatus('applying');
        setTimeout(() => {
            if (PROMO_CODES[code]) {
                setAppliedPromo({ code, ...PROMO_CODES[code] });
                setPromoStatus('success');
            } else {
                setAppliedPromo(null);
                setPromoStatus('error');
            }
        }, 350);
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
        setPromoStatus('idle');
    };

    const timelineCells = useMemo(() => {
        if (!startDate || !endDate) return [];
        const cells: { iso: string; day: number; weekday: string }[] = [];
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const cursor = new Date(start);
        let i = 0;
        while (cursor < end && i < 14) {
            cells.push({
                iso: cursor.toISOString().slice(0, 10),
                day: cursor.getDate(),
                weekday: cursor.toLocaleDateString('en-US', { weekday: 'narrow' }),
            });
            cursor.setDate(cursor.getDate() + 1);
            i++;
        }
        return cells;
    }, [startDate, endDate]);

    const steps = [
        { num: 1, label: 'Car' },
        { num: 2, label: 'Details' },
        { num: 3, label: 'Pay' },
    ];
    const currentStep = !selectedCar ? 1 : 2;

    return (
        <>
            <style>{pulseKeyframes}</style>
            <div className="relative group/panel max-h-[85vh] sm:max-h-[80vh] flex flex-col">
                <div
                    className="absolute -inset-1 rounded-3xl opacity-60 group-hover/panel:opacity-90 transition-opacity duration-700"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(251,191,36,0.25), rgba(99,102,241,0.3))',
                        filter: 'blur(24px)',
                        animation: 'shimmer 6s ease-in-out infinite',
                        backgroundSize: '200% 200%',
                    }}
                />
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl border border-surface-200/80 shadow-elevated overflow-hidden transition-all duration-500 group-hover/panel:border-surface-300/80">
                    <div className="relative h-32 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-surface-900" />
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-accent-400/15 rounded-full blur-3xl" style={{ animation: 'breathe 4s ease-in-out infinite' }} />
                        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-brand-400/15 rounded-full blur-3xl" style={{ animation: 'breathe 4s ease-in-out infinite reverse' }} />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="relative h-full px-5 py-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="transform-gpu transition-all duration-500">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-accent-300 mb-1 flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-400" />
                                        </span>
                                        Your booking
                                    </div>
                                    <div className="text-white font-black text-lg flex items-center gap-2">
                                        <span className="text-accent-300">{FIELD_ICONS.spark}</span>
                                        <span>Live summary</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {onClose && (
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            aria-label="Close summary"
                                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                                        >
                                            <svg
                                                className="w-4 h-4 transition-transform duration-300"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {steps.map((step, i) => {
                                    const isCompleted = step.num < currentStep;
                                    const isCurrent = step.num === currentStep;
                                    return (
                                        <React.Fragment key={step.num}>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <div
                                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                                                        isCompleted
                                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                            : isCurrent
                                                                ? 'bg-accent-400 text-brand-900 shadow-md shadow-accent-400/40'
                                                                : 'bg-white/15 text-white/40 backdrop-blur-md'
                                                    }`}
                                                >
                                                    {isCompleted ? (
                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        step.num
                                                    )}
                                                </div>
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
                                                        isCompleted || isCurrent ? 'text-white' : 'text-white/40'
                                                    }`}
                                                >
                                                    {step.label}
                                                </span>
                                            </div>
                                            {i < steps.length - 1 && (
                                                <div
                                                    className={`flex-1 h-px transition-colors duration-500 ${
                                                        isCompleted ? 'bg-emerald-500/60' : 'bg-white/15'
                                                    }`}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 space-y-4 overflow-y-auto flex-1">
                        <div className={`relative rounded-2xl border-2 transition-all duration-500 ${selectedCar ? 'border-brand-300/70 bg-gradient-to-br from-brand-50/80 to-brand-100/30 shadow-sm' : 'border-dashed border-surface-200 bg-surface-50 hover:bg-surface-100/60'}`}>
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/[0.02] pointer-events-none" />
                            {selectedCar ? (
                                <div className="p-3 flex items-center gap-3 animate-fade-in" style={{ animationDuration: '400ms' }}>
                                    <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-surface-100 shrink-0 ring-2 ring-brand-200/50 transition-all duration-500 group-hover/panel:ring-brand-300/70">
                                        <img src={getCarImage(selectedCar)} alt={selectedCar.model} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-brand-600 mb-0.5">
                                            {selectedCar.brand} · {selectedCar.year}
                                        </div>
                                        <div className="text-sm font-black text-surface-950 truncate">
                                            {selectedCar.model}
                                        </div>
                                        <div className="text-xs font-bold text-surface-600 tabular-nums">
                                            {formatPrice(selectedCar.daily_rate)}<span className="text-surface-500">/day</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onRemoveCar}
                                        className="w-8 h-8 rounded-full bg-white/80 hover:bg-red-50 text-surface-500 hover:text-red-500 border border-surface-200 hover:border-red-200 flex items-center justify-center transition-all duration-300 active:scale-90 shadow-sm"
                                        aria-label="Remove car"
                                    >
                                        {FIELD_ICONS.x}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-5 flex items-center gap-3 text-surface-500 transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-surface-200/70 flex items-center justify-center text-surface-500 shrink-0 transition-transform duration-300 group-hover/panel:scale-110">
                                        {FIELD_ICONS.car}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-surface-700">No car selected</div>
                                        <div className="text-xs text-surface-500">Pick a vehicle from the list</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedCar && (
                            <div className="space-y-2 animate-fade-in-up" style={{ animationDuration: '400ms' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                                        <span className="text-brand-600">{FIELD_ICONS.plus}</span>
                                        Add extras
                                    </div>
                                    {extrasCount > 0 && (
                                        <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-md ring-1 ring-brand-200/60">
                                            {extrasCount} selected
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {EXTRAS_CATALOG.map((extra) => {
                                        const isSelected = !!extras[extra.key];
                                        return (
                                            <button
                                                key={extra.key}
                                                type="button"
                                                onClick={() => toggleExtra(extra.key)}
                                                className={`group/extra relative p-2.5 rounded-xl border-2 text-left transition-all duration-300 active:scale-[0.97] ${
                                                    isSelected
                                                        ? `border-transparent bg-gradient-to-br ${extra.from} ${extra.to} text-white shadow-md`
                                                        : 'border-surface-200/70 bg-white hover:border-surface-300 hover:shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                                                            isSelected
                                                                ? 'bg-white/20 text-white'
                                                                : `bg-gradient-to-br ${extra.from} ${extra.to} text-white shadow-sm`
                                                        }`}
                                                    >
                                                        {extra.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            className={`text-[11px] font-black leading-tight truncate ${
                                                                isSelected ? 'text-white' : 'text-surface-900'
                                                            }`}
                                                        >
                                                            {extra.label}
                                                        </div>
                                                        <div
                                                            className={`text-[9px] font-bold mt-0.5 tabular-nums ${
                                                                isSelected ? 'text-white/80' : 'text-surface-500'
                                                            }`}
                                                        >
                                                            +{formatPrice(extra.pricePerDay)}/day
                                                        </div>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-md animate-scale-in">
                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2.5">
                            <div className="relative z-10 transition-transform duration-300 hover:translate-x-0.5">
                                <LocationSelect
                                    value={pickupLocation}
                                    onChange={setPickupLocation}
                                    label="Pickup location"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '30ms' }}>
                                    <EditableField
                                        icon={FIELD_ICONS.calendar}
                                        label="Pickup date"
                                        value={startDate}
                                        onChange={setStartDate}
                                        type="date"
                                        min={today}
                                        max={endDate}
                                        dense
                                    />
                                </div>
                                <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '60ms' }}>
                                    <EditableField
                                        icon={FIELD_ICONS.clock}
                                        label="Pickup time"
                                        value={pickupTime}
                                        onChange={setPickupTime}
                                        type="time"
                                        dense
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-1">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-surface-200 to-surface-300" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPickupLocation(returnLocation);
                                        setReturnLocation(pickupLocation);
                                    }}
                                    className="group/swap relative w-9 h-9 rounded-xl bg-gradient-to-br from-surface-50 to-surface-100 hover:from-brand-50 hover:to-brand-100 text-surface-500 hover:text-brand-600 border border-surface-200 hover:border-brand-300 flex items-center justify-center transition-all duration-300 active:scale-90 hover:shadow-md hover:shadow-brand-500/10"
                                    title="Swap pickup and return locations"
                                >
                                    <svg className="w-4 h-4 transition-transform duration-500 group-hover/swap:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </button>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-surface-200 to-surface-300" />
                            </div>

                            <div className="relative z-10 transition-transform duration-300 hover:translate-x-0.5" style={{ transitionDelay: '30ms' }}>
                                <LocationSelect
                                    value={returnLocation}
                                    onChange={setReturnLocation}
                                    label="Return location"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '60ms' }}>
                                    <EditableField
                                        icon={FIELD_ICONS.calendar}
                                        label="Return date"
                                        value={endDate}
                                        onChange={setEndDate}
                                        type="date"
                                        min={startDate || today}
                                        dense
                                    />
                                </div>
                                <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '90ms' }}>
                                    <EditableField
                                        icon={FIELD_ICONS.clock}
                                        label="Return time"
                                        value={returnTime}
                                        onChange={setReturnTime}
                                        type="time"
                                        dense
                                    />
                                </div>
                            </div>
                            <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '60ms' }}>
                                <CountryField
                                    label="Country"
                                    value={country}
                                    onChange={setCountry}
                                    dense
                                />
                            </div>
                        </div>

                        {timelineCells.length > 0 && (
                            <div className="space-y-1.5 animate-fade-in">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-surface-600">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-brand-600">{FIELD_ICONS.calendar}</span>
                                        Rental period
                                    </div>
                                    <span className="text-[9px] font-black text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-md ring-1 ring-brand-200/60 tabular-nums tracking-wider">
                                        {billableDays} day{billableDays !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                                    {timelineCells.map((cell, i) => (
                                        <div key={cell.iso} className="flex flex-col items-center min-w-[34px] shrink-0">
                                            <div className="text-[8px] font-black text-surface-500 uppercase tracking-wider mb-1">
                                                {cell.weekday}
                                            </div>
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-300 ${
                                                    i === 0
                                                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                                        : i === timelineCells.length - 1
                                                            ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md shadow-brand-700/30'
                                                            : 'bg-surface-100 text-surface-700'
                                                }`}
                                            >
                                                {cell.day}
                                            </div>
                                        </div>
                                    ))}
                                    {billableDays > 14 && (
                                        <div className="flex flex-col items-center justify-center min-w-[40px] shrink-0 text-[10px] font-black text-surface-500">
                                            +{billableDays - 14}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedCar && (
                            <div className="space-y-1.5 animate-fade-in">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                                    <span className="text-brand-600">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </span>
                                    Promo code
                                </div>
                                {appliedPromo ? (
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200/60 animate-fade-in">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-black text-emerald-700 truncate tracking-wider">
                                                    {appliedPromo.code}
                                                </div>
                                                <div className="text-[9px] text-emerald-600 font-medium">
                                                    {appliedPromo.label}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removePromo}
                                            className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-emerald-700 hover:text-emerald-900 border border-emerald-200/60 flex items-center justify-center transition-all active:scale-90"
                                            aria-label="Remove promo"
                                        >
                                            {FIELD_ICONS.x}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-stretch gap-1.5">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => {
                                                setPromoCode(e.target.value.toUpperCase());
                                                if (promoStatus !== 'idle') setPromoStatus('idle');
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') applyPromo();
                                            }}
                                            placeholder="Enter code"
                                            className={`flex-1 h-10 px-3 bg-white border-2 rounded-xl text-sm font-bold uppercase tracking-wider placeholder:text-surface-300 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-4 transition-all ${
                                                promoStatus === 'error'
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-surface-200 focus:border-brand-500 focus:ring-brand-500/20'
                                            }`}
                                            style={promoStatus === 'error' ? { animation: 'shake 0.4s ease-in-out' } : undefined}
                                        />
                                        <button
                                            type="button"
                                            onClick={applyPromo}
                                            disabled={!promoCode.trim() || promoStatus === 'applying'}
                                            className="h-10 px-4 rounded-xl bg-gradient-to-br from-surface-900 to-brand-900 text-white text-xs font-black uppercase tracking-wider hover:from-surface-800 hover:to-brand-800 disabled:from-surface-200 disabled:to-surface-200 disabled:text-surface-500 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm inline-flex items-center justify-center min-w-[64px]"
                                        >
                                            {promoStatus === 'applying' ? (
                                                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                'Apply'
                                            )}
                                        </button>
                                    </div>
                                )}
                                {promoStatus === 'error' && (
                                    <div className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-fade-in">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Invalid code · try WELCOME10
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="rounded-2xl bg-gradient-to-br from-brand-50/60 to-white ring-1 ring-brand-200/50 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDuration: '400ms' }}>
                            <div className="px-4 py-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                                    <span className="text-brand-600">{FIELD_ICONS.calendar}</span>
                                    Booking summary
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[8px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 mb-1">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                            Pickup
                                        </div>
                                        <div className="text-[10px] font-bold text-surface-800 truncate">{pickupLocation}</div>
                                        <div className="text-[9px] font-medium text-surface-500 truncate">
                                            {formatDateLong(startDate)} · {formatTime12h(pickupTime)}
                                        </div>
                                    </div>
                                    <div className="min-w-0 text-right">
                                        <div className="text-[8px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-1 justify-end mb-1">
                                            Return
                                            <span className="w-1 h-1 rounded-full bg-brand-500" />
                                        </div>
                                        <div className="text-[10px] font-bold text-surface-800 truncate">{returnLocation}</div>
                                        <div className="text-[9px] font-medium text-surface-500 truncate">
                                            {formatDateLong(endDate)} · {formatTime12h(returnTime)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedCar && (
                            <div className="rounded-2xl bg-gradient-to-br from-surface-50 via-white to-surface-50 ring-1 ring-surface-200/60 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDuration: '500ms' }}>
                                <button
                                    type="button"
                                    onClick={() => setBreakdownOpen(!breakdownOpen)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-white/60 transition-colors group/breakdown"
                                    aria-expanded={breakdownOpen}
                                >
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-surface-700 flex items-center gap-1.5">
                                            <span className="text-brand-600">{FIELD_ICONS.dollar}</span>
                                            Total computation
                                        </div>
                                        {extrasCount > 0 && (
                                            <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-md ring-1 ring-brand-200/50">
                                                +{extrasCount} extra{extrasCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {appliedPromo && (
                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md ring-1 ring-emerald-200/50">
                                                {appliedPromo.code}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`transition-all duration-500 ${priceFlash ? 'scale-110' : 'scale-100'}`}>
                                            <AnimatedPrice
                                                value={total}
                                                className={`text-2xl font-black tabular-nums tracking-tight transition-colors duration-500 ${
                                                    priceFlash ? 'text-emerald-600' : 'text-surface-950'
                                                }`}
                                            />
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-surface-500 transition-transform duration-300 group-hover/breakdown:text-surface-600 ${
                                                breakdownOpen ? 'rotate-180' : ''
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                <div className="px-4 pb-4 pt-1 border-t border-surface-100">
                                    {breakdownOpen ? (
                                        <div className="animate-fade-in space-y-1.5">
                                            <div className="flex items-center justify-between py-2.5 border-b border-dashed border-surface-200/70">
                                                <span className="text-[11px] font-bold text-surface-700 flex items-center gap-1.5">
                                                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shrink-0">
                                                        {FIELD_ICONS.car}
                                                    </span>
                                                    {formatPrice(selectedCar.daily_rate)} × {billableDays} {billableDays === 1 ? 'day' : 'days'}
                                                </span>
                                                <span className="font-black text-surface-900 tabular-nums">{formatPrice(subtotal)}</span>
                                            </div>

                                            {extrasCount > 0 && (
                                                <div className="py-1.5 border-b border-dashed border-surface-200/70 space-y-1.5">
                                                    {EXTRAS_CATALOG.filter((e) => extras[e.key]).map((extra) => (
                                                        <div key={extra.key} className="flex items-center justify-between text-[11px]">
                                                            <span className="text-surface-600 flex items-center gap-1.5 min-w-0">
                                                                <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${extra.from} ${extra.to} text-white flex items-center justify-center shrink-0`}>
                                                                    {extra.icon}
                                                                </span>
                                                                <span className="truncate">
                                                                    {extra.label} <span className="text-surface-500">× {billableDays}d</span>
                                                                </span>
                                                            </span>
                                                            <span className="font-bold text-surface-900 tabular-nums shrink-0">
                                                                {formatPrice(extra.pricePerDay * billableDays)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {taxItems.filter(t => t.add_or_minus).map((t) => (
                                                <div key={t.id} className="flex items-center justify-between py-2 text-[11px]">
                                                    <span className="text-surface-600 flex items-center gap-1.5">
                                                        <span className="w-5 h-5 rounded-md bg-surface-200 text-surface-600 flex items-center justify-center shrink-0">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </span>
                                                        <span className="truncate">{t.tax_desc}</span>
                                                        <span className="text-[9px] font-bold text-surface-500 bg-surface-100/80 px-1 py-0.5 rounded shrink-0">
                                                            {t.value_in === 'Percentage' ? `${t.rate}%` : formatPrice(t.rate)}
                                                        </span>
                                                    </span>
                                                    <span className="font-bold text-surface-900 tabular-nums">+{formatPrice(t.amount)}</span>
                                                </div>
                                            ))}
                                            {taxItems.filter(t => !t.add_or_minus).map((t) => (
                                                <div key={t.id} className="flex items-center justify-between py-2 text-[11px] border-b border-dashed border-surface-200/70">
                                                    <span className="text-emerald-600 flex items-center gap-1.5">
                                                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shrink-0">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </span>
                                                        <span className="truncate">{t.tax_desc}</span>
                                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded shrink-0">
                                                            {t.value_in === 'Percentage' ? `${t.rate}%` : formatPrice(t.rate)}
                                                        </span>
                                                    </span>
                                                    <span className="font-bold text-emerald-600 tabular-nums">-{formatPrice(t.amount)}</span>
                                                </div>
                                            ))}

                                            {appliedPromo && discount > 0 && (
                                                <div className="flex items-center justify-between py-2 text-[11px] border-b border-dashed border-surface-200/70">
                                                    <span className="text-emerald-600 flex items-center gap-1.5">
                                                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shrink-0">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </span>
                                                        {appliedPromo.code} discount
                                                    </span>
                                                    <span className="font-bold text-emerald-600 tabular-nums">-{formatPrice(discount)}</span>
                                                </div>
                                            )}

                                            <div className="mt-3 space-y-3 animate-fade-in-up" style={{ animationDuration: '300ms' }}>
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-surface-600">
                                                    <span>Cost split</span>
                                                    <span>{billableDays} {billableDays === 1 ? 'day' : 'days'} rental</span>
                                                </div>
                                                <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-surface-100 ring-1 ring-inset ring-surface-200/60">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
                                                        style={{ width: `${preDiscountTotal ? (subtotal / preDiscountTotal) * 100 : 0}%` }}
                                                        title={`Base: ${formatPrice(subtotal)}`}
                                                    />
                                                    <div
                                                        className="h-full bg-gradient-to-r from-accent-400 to-amber-400 transition-all duration-500"
                                                        style={{ width: `${preDiscountTotal ? (extrasTotal / preDiscountTotal) * 100 : 0}%` }}
                                                        title={`Extras: ${formatPrice(extrasTotal)}`}
                                                    />
                                                    <div
                                                        className="h-full bg-surface-700 transition-all duration-500"
                                                        style={{ width: `${preDiscountTotal ? (netTax / preDiscountTotal) * 100 : 0}%` }}
                                                        title={`Taxes & fees: ${formatPrice(netTax)}`}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                                    <div className="rounded-lg bg-brand-50 py-1.5">
                                                        <div className="text-[8px] font-black uppercase tracking-wider text-brand-700">Base</div>
                                                        <div className="text-[10px] font-bold text-brand-900 tabular-nums">{formatPrice(subtotal)}</div>
                                                    </div>
                                                    <div className="rounded-lg bg-amber-50 py-1.5">
                                                        <div className="text-[8px] font-black uppercase tracking-wider text-amber-700">Extras</div>
                                                        <div className="text-[10px] font-bold text-amber-900 tabular-nums">{formatPrice(extrasTotal)}</div>
                                                    </div>
                                                    <div className="rounded-lg bg-surface-200 py-1.5">
                                                        <div className="text-[8px] font-black uppercase tracking-wider text-surface-600">Taxes & fees</div>
                                                        <div className="text-[10px] font-bold text-surface-900 tabular-nums">{formatPrice(netTax)}</div>
                                                    </div>
                                                </div>
                                                <div className="rounded-xl bg-surface-950 text-white px-3 py-2.5 flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Grand total</span>
                                                    <div className={`text-xl font-black tabular-nums transition-colors duration-500 ${priceFlash ? 'text-emerald-400' : 'text-white'}`}>
                                                        {formatPrice(total)}
                                                    </div>
                                                </div>
                                                {appliedPromo && discount > 0 && (
                                                    <div className="text-center text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-lg py-1.5 ring-1 ring-emerald-200/60">
                                                        You saved {formatPrice(discount)} with {appliedPromo.code}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setBreakdownOpen(true)}
                                            className="w-full py-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-brand-600 hover:text-brand-700 transition-colors"
                                        >
                                            <span>{FIELD_ICONS.dollar}</span>
                                            View detailed computation
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {!selectedCar && hasValidRange && (
                            <div className="rounded-2xl bg-gradient-to-br from-surface-50 to-white p-4 text-center ring-1 ring-surface-200/60">
                                <div className="text-[10px] font-black uppercase tracking-widest text-surface-600 mb-1">
                                    Estimated ({billableDays} {billableDays === 1 ? 'day' : 'days'})
                                </div>
                                <div className="text-sm text-surface-500">Select a car to see total</div>
                            </div>
                        )}

                        {selectedCar ? (
                            <Link
                                href={
                                    isAuthenticated
                                        ? route('bookings.create', { car: selectedCar.id, start: startDate, end: endDate, location: pickupLocation })
                                        : route('login')
                                }
                                className="group/cta relative w-full h-12 rounded-2xl bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-black text-sm shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40 transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700" />
                                {isAuthenticated ? 'Continue to booking' : 'Sign in to book'}
                                <span className="transition-all duration-300 group-hover/cta:translate-x-1 group-hover/cta:scale-110">
                                    {FIELD_ICONS.arrow}
                                </span>
                            </Link>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="w-full h-12 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 text-surface-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Select a car to continue
                            </button>
                        )}

                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <div className="group/badge flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-50/60 hover:bg-surface-50 border border-surface-200/40 transition-all duration-300 cursor-default">
                                <svg className="w-3.5 h-3.5 text-emerald-500 transition-transform duration-300 group-hover/badge:scale-110" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div className="text-[9px] font-black text-surface-600 text-center leading-tight">
                                    Free<br />cancellation
                                </div>
                            </div>
                            <div className="group/badge flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-50/60 hover:bg-surface-50 border border-surface-200/40 transition-all duration-300 cursor-default">
                                <svg className="w-3.5 h-3.5 text-brand-600 transition-transform duration-300 group-hover/badge:scale-110" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <div className="text-[9px] font-black text-surface-600 text-center leading-tight">
                                    Secure<br />payment
                                </div>
                            </div>
                            <div className="group/badge flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-50/60 hover:bg-surface-50 border border-surface-200/40 transition-all duration-300 cursor-default">
                                <svg className="w-3.5 h-3.5 text-accent-500 transition-transform duration-300 group-hover/badge:scale-110" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <div className="text-[9px] font-black text-surface-600 text-center leading-tight">
                                    Best price<br />guarantee
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function BookingPopover({
    open,
    activeTab,
    onTabChange,
    selectedCar,
    pickupLocation,
    setPickupLocation,
    returnLocation,
    setReturnLocation,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pickupTime,
    setPickupTime,
    returnTime,
    setReturnTime,
    country,
    setCountry,
    onClose,
}: {
    open: boolean;
    activeTab: 'edit' | 'total';
    onTabChange: (tab: 'edit' | 'total') => void;
    selectedCar: Car | null;
    pickupLocation: string;
    setPickupLocation: (v: string) => void;
    returnLocation: string;
    setReturnLocation: (v: string) => void;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    pickupTime: string;
    setPickupTime: (v: string) => void;
    returnTime: string;
    setReturnTime: (v: string) => void;
    country: string;
    setCountry: (v: string) => void;
    onClose: () => void;
}) {
    const [openDropdown, setOpenDropdown] = useState<'pickup' | 'return' | null>(null);
    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        if (!open) setOpenDropdown(null);
    }, [open]);

    const days = diffDays(startDate, endDate);
    const billableDays = Math.max(days, 1);
    const baseRate = selectedCar?.daily_rate ?? 0;
    const baseSubtotal = baseRate * billableDays;
    const [taxItems, setTaxItems] = useState<{ id: number; tax_desc: string; category: string; amount: number; add_or_minus: boolean; value_in: string; rate: number }[]>([]);
    const netTax = taxItems.reduce((sum, t) => sum + (t.add_or_minus ? t.amount : -t.amount), 0);
    const grandTotal = baseSubtotal + netTax;
    const hasValidRange = days > 0 && startDate && endDate;
    const hasCar = !!selectedCar;
    const pickupInfo = hasValidRange ? `${formatDateLong(startDate)} · ${formatTime12h(pickupTime)}` : '';
    const returnInfo = hasValidRange ? `${formatDateLong(endDate)} · ${formatTime12h(returnTime)}` : '';
    const popRoute = useRoute();

    useEffect(() => {
        if (!selectedCar?.id || !billableDays) return;
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(popRoute('taxes.calculate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
            body: JSON.stringify({
                car_id: selectedCar.id,
                pickup_location: pickupLocation || null,
                billing_days: billableDays,
                daily_rate: selectedCar.daily_rate,
                subtotal: baseSubtotal,
            }),
        })
            .then(r => r.json())
            .then(data => setTaxItems(data.taxes || []))
            .catch(() => setTaxItems([]));
    }, [selectedCar?.id, billableDays, selectedCar?.daily_rate, pickupLocation, baseSubtotal]);

    return (
        <div
            className={`absolute top-full right-0 mt-2 z-40 w-[min(440px,calc(100vw-2rem))] transition-all duration-300 ease-out ${
                open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
            }`}
            style={{
                transformOrigin: 'top right',
                transitionTimingFunction: open ? 'cubic-bezier(0.34, 1.4, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            aria-hidden={!open}
        >
            <div
                className="bg-white/95 backdrop-blur-md rounded-2xl border border-surface-200 shadow-2xl shadow-brand-900/15 ring-1 ring-surface-200/60"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-3 border-b border-surface-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl flex-1" role="tablist">
                        <button
                            type="button"
                            onClick={() => onTabChange('edit')}
                            role="tab"
                            aria-selected={activeTab === 'edit'}
                            className={`flex-1 h-8 px-2 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-all duration-200 ${
                                activeTab === 'edit'
                                    ? 'bg-white text-surface-950 shadow-sm'
                                    : 'text-surface-500 hover:text-surface-700'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit details
                        </button>
                        <button
                            type="button"
                            onClick={() => onTabChange('total')}
                            role="tab"
                            aria-selected={activeTab === 'total'}
                            className={`flex-1 h-8 px-2 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-all duration-200 ${
                                activeTab === 'total'
                                    ? 'bg-white text-surface-950 shadow-sm'
                                    : 'text-surface-500 hover:text-surface-700'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 7h6m-6 4h6m-6 4h4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Total
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-8 h-8 rounded-full bg-surface-100 hover:bg-surface-200 text-surface-500 hover:text-surface-700 flex items-center justify-center transition-all duration-300 active:scale-90 shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {activeTab === 'edit' ? (
                    <div className="p-4 space-y-3" role="tabpanel">
                        <div className={`transition-transform duration-300 hover:translate-x-0.5 ${openDropdown === 'pickup' ? 'relative z-50' : 'relative'}`}>
                            <LocationSelect value={pickupLocation} onChange={setPickupLocation} label="Pickup location" isOpen={openDropdown === 'pickup'} onOpenChange={(o) => setOpenDropdown(o ? 'pickup' : null)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '30ms' }}>
                                <EditableField icon={FIELD_ICONS.calendar} label="Pickup date" value={startDate} onChange={setStartDate} type="date" min={today} max={endDate} dense />
                            </div>
                            <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '60ms' }}>
                                <EditableField icon={FIELD_ICONS.clock} label="Pickup time" value={pickupTime} onChange={setPickupTime} type="time" dense />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-1">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-surface-200 to-surface-300" />
                            <button
                                type="button"
                                onClick={() => {
                                    setPickupLocation(returnLocation);
                                    setReturnLocation(pickupLocation);
                                }}
                                className="group/swap relative w-8 h-8 rounded-xl bg-gradient-to-br from-surface-50 to-surface-100 hover:from-brand-50 hover:to-brand-100 text-surface-500 hover:text-brand-600 border border-surface-200 hover:border-brand-300 flex items-center justify-center transition-all duration-300 active:scale-90"
                                title="Swap pickup and return locations"
                            >
                                <svg className="w-3.5 h-3.5 transition-transform duration-500 group-hover/swap:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                            </button>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-surface-200 to-surface-300" />
                        </div>

                        <div className={`transition-transform duration-300 hover:translate-x-0.5 ${openDropdown === 'return' ? 'relative z-50' : 'relative'}`} style={{ transitionDelay: '30ms' }}>
                            <LocationSelect value={returnLocation} onChange={setReturnLocation} label="Return location" isOpen={openDropdown === 'return'} onOpenChange={(o) => setOpenDropdown(o ? 'return' : null)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '60ms' }}>
                                <EditableField icon={FIELD_ICONS.calendar} label="Return date" value={endDate} onChange={setEndDate} type="date" min={startDate || today} dense />
                            </div>
                            <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '90ms' }}>
                                <EditableField icon={FIELD_ICONS.clock} label="Return time" value={returnTime} onChange={setReturnTime} type="time" dense />
                            </div>
                        </div>
                        <div className="transition-all duration-300 hover:translate-x-0.5" style={{ transitionDelay: '60ms' }}>
                            <CountryField label="Country" value={country} onChange={setCountry} dense />
                        </div>
                    </div>
                ) : (
                    <div role="tabpanel">
                        {hasCar && selectedCar ? (
                            <div className="px-4 py-3 bg-gradient-to-r from-brand-50/70 to-white border-b border-surface-100 flex items-center gap-3">
                                <div className="w-14 h-11 rounded-lg overflow-hidden bg-surface-100 shrink-0 ring-1 ring-black/5">
                                    <img src={getCarImage(selectedCar)} alt={selectedCar.model} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-brand-600">
                                        {selectedCar.brand} · {selectedCar.year}
                                    </div>
                                    <div className="text-sm font-black text-surface-950 truncate">
                                        {selectedCar.model}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-[9px] font-bold text-surface-500 uppercase tracking-wider">Rate</div>
                                    <div className="text-sm font-black text-surface-950 tabular-nums">
                                        {formatPrice(baseRate)}<span className="text-[10px] text-surface-500 font-bold">/day</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-5 bg-surface-50 border-b border-surface-100 text-center">
                                <div className="w-10 h-10 rounded-xl bg-surface-200/70 text-surface-500 flex items-center justify-center mx-auto mb-2">
                                    {FIELD_ICONS.car}
                                </div>
                                <div className="text-xs font-bold text-surface-600">No car selected</div>
                                <div className="text-[10px] text-surface-500 mt-0.5">Pick a vehicle to see the total</div>
                            </div>
                        )}

                        {hasValidRange && (
                            <div className="px-4 py-2.5 bg-surface-50/40 border-b border-surface-100 grid grid-cols-2 gap-2">
                                <div className="min-w-0">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                        Pickup
                                    </div>
                                    <div className="text-[10px] font-bold text-surface-700 truncate mt-0.5">{pickupLocation}</div>
                                    <div className="text-[9px] font-medium text-surface-500 truncate">{pickupInfo}</div>
                                </div>
                                <div className="min-w-0 text-right">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-1 justify-end">
                                        Return
                                        <span className="w-1 h-1 rounded-full bg-brand-500" />
                                    </div>
                                    <div className="text-[10px] font-bold text-surface-700 truncate mt-0.5">{returnLocation}</div>
                                    <div className="text-[9px] font-medium text-surface-500 truncate">{returnInfo}</div>
                                </div>
                            </div>
                        )}

                        <div className="p-4 space-y-1.5">
                            {hasValidRange && (
                                <div className="flex items-center justify-between text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-brand-600">{FIELD_ICONS.calendar}</span>
                                        Rental period
                                    </span>
                                    <span className="text-brand-700 tabular-nums bg-brand-50 px-1.5 py-0.5 rounded-md ring-1 ring-brand-200/50">
                                        {billableDays} day{billableDays !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-xs text-surface-600">Daily rate</span>
                                <span className="text-xs font-bold text-surface-900 tabular-nums">{formatPrice(baseRate)}</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-xs text-surface-600 flex items-center gap-1.5">
                                    <span className="text-surface-500">×</span> Duration
                                </span>
                                <span className="text-xs font-bold text-surface-900 tabular-nums">
                                    {billableDays} {billableDays === 1 ? 'day' : 'days'}
                                </span>
                            </div>

                            <div className="my-2 border-t border-dashed border-surface-200" />

                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-xs font-semibold text-surface-700">Base subtotal</span>
                                <span className="text-sm font-black text-surface-900 tabular-nums">{formatPrice(baseSubtotal)}</span>
                            </div>

                            {taxItems.filter(t => t.add_or_minus).map((t) => (
                                <div key={t.id} className="flex items-center justify-between py-1.5">
                                    <span className="text-xs text-surface-600 flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded bg-surface-100 text-surface-500 flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                        <span className="truncate">{t.tax_desc}</span>
                                        <span className="text-[9px] font-bold text-surface-500 bg-surface-100/80 px-1 py-0.5 rounded shrink-0">
                                            {t.value_in === 'Percentage' ? `${t.rate}%` : formatPrice(t.rate)}
                                        </span>
                                    </span>
                                    <span className="text-xs font-bold text-surface-900 tabular-nums">+{formatPrice(t.amount)}</span>
                                </div>
                            ))}
                            {taxItems.filter(t => !t.add_or_minus).map((t) => (
                                <div key={t.id} className="flex items-center justify-between py-1.5">
                                    <span className="text-xs text-emerald-600 flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded bg-surface-100 text-surface-500 flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        <span className="truncate">{t.tax_desc}</span>
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded shrink-0">
                                            {t.value_in === 'Percentage' ? `${t.rate}%` : formatPrice(t.rate)}
                                        </span>
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 tabular-nums">-{formatPrice(t.amount)}</span>
                                </div>
                            ))}

                            {hasValidRange && billableDays > 1 && (
                                <div className="flex items-center justify-between py-1.5">
                                    <span className="text-xs text-surface-600 flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded bg-surface-100 text-surface-500 flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                        Average per day
                                    </span>
                                    <span className="text-xs font-bold text-surface-900 tabular-nums">
                                        {formatPrice(Math.round(grandTotal / billableDays))}
                                    </span>
                                </div>
                            )}

                            <div className="mt-3 relative rounded-xl bg-gradient-to-br from-surface-950 via-brand-900 to-surface-950 text-white p-3 overflow-hidden">
                                <div
                                    className="absolute inset-0 opacity-20 pointer-events-none"
                                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '12px 12px' }}
                                />
                                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-accent-400/20 rounded-full blur-2xl pointer-events-none" />
                                <div className="relative flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-accent-300">Grand total</div>
                                        <div className="text-[10px] text-white/60 mt-0.5">All-in, no hidden fees</div>
                                    </div>
                                    <div className="text-xl font-black tabular-nums tracking-tight shrink-0">
                                        {formatPrice(grandTotal)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-4 py-2.5 bg-surface-50/60 border-t border-surface-100 flex items-center justify-between">
                    {activeTab === 'edit' ? (
                        <>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-surface-500 uppercase tracking-wider">
                                <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Live pricing
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-8 px-3 rounded-lg bg-gradient-to-r from-brand-700 to-brand-800 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-brand-700/20 hover:from-brand-600 hover:to-brand-700 transition-all duration-300 active:scale-95 inline-flex items-center gap-1.5"
                            >
                                Done
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-surface-500 uppercase tracking-wider">
                                <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Free cancellation
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-surface-500 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Fleet({ cars, fleetSettings }: FleetProps) {
    const route = useRoute();
    const page = usePage();
    const heroSettings: HeroSettings | null = (page.props as any)?.heroSettings ?? null;
    const isAuthenticated = !!(page.props as any)?.auth?.user;

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const threeDays = useMemo(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), []);

    const [filter, setFilter] = useState<FilterKey>('all');
    const [sort, setSort] = useState<SortKey>('recommended');
    const [view, setView] = useState<ViewMode>('grid');
    const [query, setQuery] = useState('');
    const [brand, setBrand] = useState<string>('all');
    const [vehicleType, setVehicleType] = useState<string>('any');
    const [fuelFilter, setFuelFilter] = useState<string>('any');
    const [transmissionFilter, setTransmissionFilter] = useState<string>('any');
    const [minSeats, setMinSeats] = useState<number>(0);
    const [priceMin, setPriceMin] = useState<number>(0);
    const [priceMax, setPriceMax] = useState<number>(500);

    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [pickupLocation, setPickupLocation] = useState<string>(LOCATIONS[0]);
    const [returnLocation, setReturnLocation] = useState<string>(LOCATIONS[0]);
    const [startDate, setStartDate] = useState<string>(today);
    const [endDate, setEndDate] = useState<string>(threeDays);
    const [pickupTime, setPickupTime] = useState<string>('09:00');
    const [returnTime, setReturnTime] = useState<string>('09:00');
    const [country, setCountry] = useState<string>('Palau');
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [popoverTab, setPopoverTab] = useState<'edit' | 'total'>('edit');
    const [panelVisible, setPanelVisible] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const pickLoc = params.get('pickup_location');
        const retLoc = params.get('return_location');
        const pickDate = params.get('pickup_date');
        const retDate = params.get('return_date');
        const pickTime = params.get('pickup_time');
        const retTime = params.get('return_time');
        const c = params.get('country');
        if (pickLoc && LOCATIONS.includes(pickLoc)) setPickupLocation(pickLoc);
        if (retLoc && LOCATIONS.includes(retLoc)) setReturnLocation(retLoc);
        if (pickDate) setStartDate(pickDate);
        if (retDate) setEndDate(retDate);
        if (pickTime) setPickupTime(pickTime);
        if (retTime) setReturnTime(retTime);
        if (c) setCountry(c);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setPanelVisible(true), 200);
        return () => clearTimeout(t);
    }, []);

    const brands = useMemo(() => {
        const set = new Set(cars.data.map((c) => c.brand));
        return ['all', ...Array.from(set).sort()];
    }, [cars.data]);

    const featured = useMemo(() => {
        return [...cars.data]
            .filter((c) => c.avg_rating >= 4 && c.ratings_count >= 1)
            .sort((a, b) => {
                const scoreA = a.avg_rating * Math.log10((a.ratings_count || 1) + 1);
                const scoreB = b.avg_rating * Math.log10((b.ratings_count || 1) + 1);
                return scoreB - scoreA;
            })
            .slice(0, 6);
    }, [cars.data]);

    const priceRange = useMemo(() => {
        if (cars.data.length === 0) return { min: 0, max: 500 };
        const rates = cars.data.map((c) => Number(c.daily_rate));
        return { min: Math.floor(Math.min(...rates)), max: Math.ceil(Math.max(...rates)) };
    }, [cars.data]);

    useEffect(() => {
        setPriceMin(priceRange.min);
        setPriceMax(priceRange.max);
    }, [priceRange.min, priceRange.max]);

    const filteredCars = useMemo(() => {
        let list = [...cars.data];
        if (brand !== 'all') list = list.filter((c) => c.brand === brand);
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(
                (c) => c.brand.toLowerCase().includes(q) || c.model.toLowerCase().includes(q),
            );
        }
        switch (filter) {
            case 'available':
                list = list.filter((c) => c.booked_dates.filter((b) => b.status === 'full').length === 0);
                break;
            case 'top-rated':
                list = list.filter((c) => c.avg_rating >= 4.5 && c.ratings_count >= 3);
                break;
            case 'value':
                list = list.filter((c) => c.daily_rate <= 80);
                break;
        }
        if (vehicleType !== 'any') {
            list = list.filter((c) => c.vehicle_type === vehicleType);
        }
        if (fuelFilter !== 'any') {
            list = list.filter((c) => {
                const ft = c.fuel_type.toLowerCase();
                const ff = fuelFilter.toLowerCase();
                return ft === ff || (ft === 'gasoline' && ff === 'petrol') || (ft === 'petrol' && ff === 'gasoline');
            });
        }
        if (transmissionFilter !== 'any') {
            list = list.filter((c) => c.transmission.toLowerCase() === transmissionFilter.toLowerCase());
        }
        if (minSeats > 0) {
            list = list.filter((c) => c.seats >= minSeats);
        }
        list = list.filter((c) => Number(c.daily_rate) >= priceMin && Number(c.daily_rate) <= priceMax);
        switch (sort) {
            case 'price-asc':
                return list.sort((a, b) => a.daily_rate - b.daily_rate);
            case 'price-desc':
                return list.sort((a, b) => b.daily_rate - a.daily_rate);
            case 'rating':
                return list.sort((a, b) => b.avg_rating - a.avg_rating);
            default:
                return list.sort((a, b) => {
                    const aConflict = a.booked_dates.some(
                        (bd) => bd.status === 'full' && bd.date >= startDate && bd.date <= endDate,
                    );
                    const bConflict = b.booked_dates.some(
                        (bd) => bd.status === 'full' && bd.date >= startDate && bd.date <= endDate,
                    );
                    if (aConflict !== bConflict) return aConflict ? 1 : -1;
                    const scoreA = a.avg_rating * Math.log10((a.ratings_count || 1) + 1);
                    const scoreB = b.avg_rating * Math.log10((b.ratings_count || 1) + 1);
                    return scoreB - scoreA;
                });
        }
    }, [cars.data, filter, sort, query, brand, vehicleType, fuelFilter, transmissionFilter, minSeats, priceMin, priceMax, startDate, endDate]);

    const stats = useMemo(() => {
        const total = cars.data.length;
        const available = cars.data.filter((c) => c.booked_dates.filter((b) => b.status === 'full').length === 0).length;
        const topRated = cars.data.filter((c) => c.avg_rating >= 4.5).length;
        const avgPrice =
            total > 0 ? cars.data.reduce((sum, c) => sum + Number(c.daily_rate), 0) / total : 0;
        return { total, available, topRated, avgPrice };
    }, [cars.data]);

    const brandCounts = useMemo(() => {
        const counts: Record<string, number> = { all: cars.data.length };
        cars.data.forEach((c) => {
            counts[c.brand] = (counts[c.brand] || 0) + 1;
        });
        return counts;
    }, [cars.data]);

    const cheapCount = useMemo(() => cars.data.filter((c) => c.daily_rate <= 80).length, [cars.data]);

    const activeFilterCount = [
        filter !== 'all',
        brand !== 'all',
        query.trim().length > 0,
        vehicleType !== 'any',
        fuelFilter !== 'any',
        transmissionFilter !== 'any',
        minSeats > 0,
        priceMin > priceRange.min || priceMax < priceRange.max,
    ].filter(Boolean).length;

    const activeFilters = useMemo(() => {
        const chips: { key: string; label: string; icon: React.ReactNode; onRemove: () => void }[] = [];
        if (filter !== 'all') {
            const map: Record<string, { label: string; icon: React.ReactNode }> = {
                available: { label: 'Available now', icon: <FilterIcons.available /> },
                'top-rated': { label: 'Top Rated', icon: <FilterIcons.topRated /> },
                value: { label: 'Best Value', icon: <FilterIcons.value /> },
            };
            const m = map[filter];
            if (m) {
                chips.push({
                    key: `filter-${filter}`,
                    label: m.label,
                    icon: m.icon,
                    onRemove: () => setFilter('all'),
                });
            }
        }
        if (brand !== 'all') {
            const palette = brandPalette(brand);
            chips.push({
                key: 'brand',
                label: brand,
                icon: (
                    <span className={`w-4 h-4 rounded-md bg-gradient-to-br ${palette.from} ${palette.to} text-white text-[9px] font-black flex items-center justify-center`}>
                        {brand[0]}
                    </span>
                ),
                onRemove: () => setBrand('all'),
            });
        }
        if (query.trim()) {
            chips.push({
                key: 'query',
                label: `"${query.trim()}"`,
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                ),
                onRemove: () => setQuery(''),
            });
        }
        if (vehicleType !== 'any') {
            chips.push({
                key: 'vehicleType',
                label: vehicleType,
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                ),
                onRemove: () => setVehicleType('any'),
            });
        }
        if (fuelFilter !== 'any') {
            chips.push({
                key: 'fuel',
                label: fuelFilter,
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                ),
                onRemove: () => setFuelFilter('any'),
            });
        }
        if (transmissionFilter !== 'any') {
            chips.push({
                key: 'transmission',
                label: transmissionFilter,
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                ),
                onRemove: () => setTransmissionFilter('any'),
            });
        }
        if (minSeats > 0) {
            chips.push({
                key: 'seats',
                label: `${minSeats}+ seats`,
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                ),
                onRemove: () => setMinSeats(0),
            });
        }
        if (priceMin > priceRange.min || priceMax < priceRange.max) {
            chips.push({
                key: 'price',
                label: `$${priceMin}–$${priceMax}`,
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                onRemove: () => {
                    setPriceMin(priceRange.min);
                    setPriceMax(priceRange.max);
                },
            });
        }
        return chips;
    }, [filter, brand, query, vehicleType, fuelFilter, transmissionFilter, minSeats, priceMin, priceMax, priceRange.min, priceRange.max]);
    const showFeatured = filter === 'all' && sort === 'recommended' && !query && brand === 'all' && vehicleType === 'any' && fuelFilter === 'any' && transmissionFilter === 'any' && minSeats === 0;

    const resetFilters = () => {
        setFilter('all');
        setBrand('all');
        setQuery('');
        setVehicleType('any');
        setFuelFilter('any');
        setTransmissionFilter('any');
        setMinSeats(0);
        setPriceMin(priceRange.min);
        setPriceMax(priceRange.max);
    };

    const handleSelectToggle = (car: Car) => {
        setSelectedCar((prev) => (prev?.id === car.id ? null : car));
    };

    const handleRemoveCar = () => {
        setSelectedCar(null);
    };

    const bookingDays = diffDays(startDate, endDate);
    const bookingBillable = Math.max(bookingDays, 1);
    const bookingSubtotal = selectedCar ? selectedCar.daily_rate * bookingBillable : 0;
    const [bookingTaxItems, setBookingTaxItems] = useState<{ id: number; amount: number; add_or_minus: boolean }[]>([]);
    const bookingNetTax = bookingTaxItems.reduce((sum, t) => sum + (t.add_or_minus ? t.amount : -t.amount), 0);
    const bookingTotal = bookingSubtotal + bookingNetTax;

    useEffect(() => {
        if (!selectedCar?.id || !bookingBillable) return;
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        fetch(route('taxes.calculate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
            body: JSON.stringify({
                car_id: selectedCar.id,
                pickup_location: pickupLocation || null,
                billing_days: bookingBillable,
                daily_rate: selectedCar.daily_rate,
                subtotal: bookingSubtotal,
            }),
        })
            .then(r => r.json())
            .then(data => setBookingTaxItems(data.taxes || []))
            .catch(() => setBookingTaxItems([]));
    }, [selectedCar?.id, bookingBillable, selectedCar?.daily_rate, pickupLocation, bookingSubtotal]);

    const currentStep = useMemo(() => {
        if (!selectedCar) return 1;
        if (selectedCar && !popoverOpen && bookingDays > 0) return 4;
        if (selectedCar) return popoverOpen ? 3 : 2;
        return 1;
    }, [selectedCar, popoverOpen, bookingDays]);

    return (
        <GuestLayout>
            <Head title="Our Fleet" />

            {/* Hero Header with Booking Summary Card */}
            <section className={cn('relative', fleetSettings?.is_active !== false ? 'min-h-[220px] sm:min-h-[300px]' : '')}>
                {fleetSettings?.is_active !== false ? (
                    <>
                        <img
                            src={fleetSettings?.hero_image_path ? `/storage/${fleetSettings.hero_image_path}` : heroSettings?.fleet_image_path ? `/storage/${heroSettings.fleet_image_path}` : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=800&fit=crop'}
                            alt={fleetSettings?.hero_badge || heroSettings?.badge_text || 'Car on road'}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-900/50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <div className="absolute inset-0 flex items-center">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                                {fleetSettings?.hero_badge && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border bg-accent-400/15 text-accent-300 border-accent-400/25 mb-3 w-fit backdrop-blur-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                                        {fleetSettings.hero_badge}
                                    </span>
                                )}
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">
                                    {fleetSettings?.hero_title || 'Browse'}{' '}
                                    {fleetSettings?.hero_highlight ? (
                                        <span className="gradient-text">{fleetSettings.hero_highlight}</span>
                                    ) : (
                                        <span className="gradient-text">Our Fleet</span>
                                    )}
                                </h1>
                                {fleetSettings?.hero_description && (
                                    <p className="text-white/70 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                                        {fleetSettings.hero_description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-4 sm:h-6" />
                )}

                {/* Booking Summary Card */}
                <div className={cn(
                    'z-40',
                    fleetSettings?.is_active !== false
                        ? 'absolute inset-x-0 bottom-0 translate-y-1/2'
                        : 'px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-7xl mx-auto'
                )}>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl shadow-brand-900/20 border border-surface-200/80 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 -mx-2 sm:-mx-3 bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500 pointer-events-none" />
                            <div className="flex items-stretch divide-x divide-surface-200/70">

                                {/* Car */}
                                <div className="flex items-center gap-3 px-4 py-3.5 shrink-0 min-w-0 max-w-[200px] sm:max-w-[240px]">
                                    {selectedCar ? (
                                        <>
                                            <div className="w-14 h-11 rounded-xl overflow-hidden bg-surface-100 shrink-0 ring-1 ring-black/5">
                                                <img src={getCarImage(selectedCar)} alt={selectedCar.model} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-black uppercase tracking-wider text-brand-600 leading-none mb-1 truncate">
                                                    {selectedCar.brand} · {selectedCar.year}
                                                </div>
                                                <div className="text-[15px] font-black text-surface-950 truncate leading-tight">
                                                    {selectedCar.model}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-11 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 shrink-0">
                                                {FIELD_ICONS.car}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-black uppercase tracking-wider text-surface-500 leading-none mb-1">No car</div>
                                                <div className="text-[15px] font-bold text-surface-600 truncate leading-tight">Select vehicle</div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Dates */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPopoverTab('edit');
                                        setPopoverOpen(true);
                                    }}
                                    className="hidden sm:flex items-center gap-2.5 px-4 py-3.5 hover:bg-surface-50/80 transition-colors duration-200 group/dates shrink-0"
                                    aria-label="Edit dates and times"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-brand-50 group-hover/dates:bg-brand-100 flex items-center justify-center shrink-0 transition-colors">
                                        <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-left">
                                            <div className="text-[9px] font-black uppercase tracking-wider text-surface-600 leading-none mb-0.5">From</div>
                                            <div className="text-sm font-bold text-surface-900 leading-tight tabular-nums">
                                                {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pick'}
                                            </div>
                                            <div className="text-[10px] font-medium text-surface-500 leading-tight">
                                                {pickupTime ? formatTime12h(pickupTime) : ''}
                                            </div>
                                        </div>
                                        <svg className="w-3 h-3 text-surface-300 group-hover/dates:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        <div className="text-left">
                                            <div className="text-[9px] font-black uppercase tracking-wider text-surface-600 leading-none mb-0.5">Until</div>
                                            <div className="text-sm font-bold text-surface-900 leading-tight tabular-nums">
                                                {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pick'}
                                            </div>
                                            <div className="text-[10px] font-medium text-surface-500 leading-tight">
                                                {returnTime ? formatTime12h(returnTime) : ''}
                                            </div>
                                        </div>
                                        {bookingDays > 0 && (
                                            <span className="ml-1 text-[10px] font-black text-brand-700 bg-brand-50 ring-1 ring-brand-200/60 px-1.5 py-0.5 rounded-md tabular-nums">
                                                {bookingDays}d
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* Locations */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPopoverTab('edit');
                                        setPopoverOpen(true);
                                    }}
                                    className="flex items-center gap-2.5 px-4 py-3.5 hover:bg-surface-50/80 transition-colors duration-200 group/locs flex-1 min-w-0"
                                    aria-label="Edit pickup and return locations"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-brand-50 group-hover/locs:bg-brand-100 flex items-center justify-center shrink-0 transition-colors">
                                        {FIELD_ICONS.location}
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="min-w-0">
                                            <div className="text-[9px] font-black uppercase tracking-wider text-surface-600 leading-none mb-0.5">Pickup</div>
                                            <div className="text-sm font-bold text-surface-900 leading-tight truncate">
                                                {pickupLocation}
                                            </div>
                                        </div>
                                        <svg className="w-3 h-3 text-surface-300 group-hover/locs:text-brand-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[9px] font-black uppercase tracking-wider text-surface-600 leading-none mb-0.5">Return</div>
                                            <div className="text-sm font-bold text-surface-900 leading-tight truncate">
                                                {returnLocation}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Price + CTA */}
                                <div className="flex items-center gap-3 px-4 py-3.5 shrink-0 bg-gradient-to-r from-surface-50/60 to-transparent">
                                    {selectedCar && bookingDays > 0 ? (
                                        <div className="text-right">
                                            <p className="text-[9px] text-surface-500 font-black uppercase tracking-wider leading-none mb-0.5">Total</p>
                                            <AnimatedPrice value={bookingTotal} className="text-lg font-black text-surface-950 tracking-tight tabular-nums leading-tight" />
                                        </div>
                                    ) : selectedCar ? (
                                        <div className="text-right">
                                            <p className="text-[9px] text-surface-500 font-black uppercase tracking-wider leading-none mb-0.5">From</p>
                                            <div className="text-lg font-black text-surface-950 tracking-tight tabular-nums leading-tight">
                                                {formatPrice(selectedCar.daily_rate)}
                                            </div>
                                        </div>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!popoverOpen) setPopoverTab('total');
                                            setPopoverOpen((v) => !v);
                                        }}
                                        className={`h-10 w-10 rounded-xl text-white flex items-center justify-center shadow-md transition-all duration-300 active:scale-95 shrink-0 ${
                                            popoverOpen
                                                ? 'bg-gradient-to-br from-surface-900 to-brand-900'
                                                : 'bg-gradient-to-br from-brand-700 to-brand-800 hover:from-brand-600 hover:to-brand-700 shadow-brand-700/20'
                                        }`}
                                        aria-label={popoverOpen ? 'Hide details' : 'View details'}
                                        title={popoverOpen ? 'Hide details' : 'View details'}
                                    >
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-500 ease-out ${popoverOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                            </div>
                        </div>

                        <BookingPopover
                            open={popoverOpen}
                            activeTab={popoverTab}
                            onTabChange={setPopoverTab}
                            selectedCar={selectedCar}
                            pickupLocation={pickupLocation}
                            setPickupLocation={setPickupLocation}
                            returnLocation={returnLocation}
                            setReturnLocation={setReturnLocation}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            pickupTime={pickupTime}
                            setPickupTime={setPickupTime}
                            returnTime={returnTime}
                            setReturnTime={setReturnTime}
                            country={country}
                            setCountry={setCountry}
                            onClose={() => setPopoverOpen(false)}
                        />
                    </div>
                </div>
            </section>

            {/* Main Content: Left Filter + Right Listings */}
            <section id="fleet-grid" className="pt-14 sm:pt-18 pb-8 sm:pb-10 bg-surface-50 min-h-screen relative">
                <div
                    className="absolute inset-0 opacity-[0.02] pointer-events-none"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgb(15,23,42) 1px, transparent 0)',
                        backgroundSize: '32px 32px',
                    }}
                />
                <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                    <div className="mb-4 sm:mb-5">
                        <BookingStepBar
                            currentStep={currentStep}
                            selectedCar={selectedCar}
                        />
                    </div>

                    <div className="relative z-20 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-6 sm:mb-8">
                        {/* Right: Active filter chips + Sort + View */}
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            {activeFilters.length > 0 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 max-w-full">
                                    <span className="text-xs font-black uppercase tracking-widest text-surface-500 shrink-0 pl-1 inline-flex items-center gap-1.5">
                                        <svg className="w-3 h-3 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        Active
                                    </span>
                                    {activeFilters.map((f) => (
                                        <button
                                            key={f.key}
                                            type="button"
                                            onClick={f.onRemove}
                                            className="group/chip relative shrink-0 inline-flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 bg-gradient-to-r from-brand-700 to-brand-800 text-white shadow-sm shadow-brand-700/20 hover:shadow-md hover:shadow-brand-700/30 hover:from-brand-600 hover:to-brand-700"
                                        >
                                            <span className="text-accent-300 shrink-0">{f.icon}</span>
                                            <span className="whitespace-nowrap">{f.label}</span>
                                            <span className="w-4 h-4 rounded-full bg-white/15 group-hover/chip:bg-white/25 flex items-center justify-center transition-colors">
                                                {FIELD_ICONS.x}
                                            </span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={resetFilters}
                                        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-100 hover:bg-red-50 text-surface-600 hover:text-red-600 border border-surface-200 hover:border-red-200 transition-all duration-200 active:scale-95"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                <div className="relative">
                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none">
                                        <FilterIcons.sort className="w-3.5 h-3.5" />
                                    </div>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value as SortKey)}
                                        className="appearance-none h-10 pl-8 pr-8 bg-white hover:bg-surface-50 border border-surface-200/70 hover:border-surface-300 rounded-xl text-sm font-semibold text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 cursor-pointer transition-all shadow-sm"
                                    >
                                        <option value="recommended">Recommended</option>
                                        <option value="price-asc">Price: Low → High</option>
                                        <option value="price-desc">Price: High → Low</option>
                                        <option value="rating">Highest Rated</option>
                                    </select>
                                    <svg
                                        className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                <div className="hidden sm:flex items-center bg-white border border-surface-200/70 rounded-xl p-0.5 gap-0.5 shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setView('grid')}
                                        aria-label="Grid view"
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                            view === 'grid'
                                                ? 'bg-surface-950 text-white shadow-sm'
                                                : 'text-surface-500 hover:text-surface-700'
                                        }`}
                                    >
                                        <FilterIcons.grid className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setView('list')}
                                        aria-label="List view"
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                            view === 'list'
                                                ? 'bg-surface-950 text-white shadow-sm'
                                                : 'text-surface-500 hover:text-surface-700'
                                        }`}
                                    >
                                        <FilterIcons.list className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">

                        {/* Left: Filter Section */}
                        <aside className="min-w-0 lg:order-first">
                            <div className="lg:sticky lg:top-24 space-y-3">
                                <div className={`transition-all duration-700 -mt-16 ${panelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                    <FilterSidebar
                                        state={{
                                            vehicleType,
                                            fuelFilter,
                                            transmissionFilter,
                                            minSeats,
                                            priceMin,
                                            priceMax,
                                            priceRangeMin: priceRange.min,
                                            priceRangeMax: priceRange.max,
                                        }}
                                        filteredCount={filteredCars.length}
                                        onVehicleTypeChange={setVehicleType}
                                        onFuelFilterChange={setFuelFilter}
                                        onTransmissionFilterChange={setTransmissionFilter}
                                        onMinSeatsChange={setMinSeats}
                                        onPriceMinChange={setPriceMin}
                                        onPriceMaxChange={setPriceMax}
                                        onReset={resetFilters}
                                        onApply={() => {
                                            const grid = document.getElementById('fleet-grid');
                                            grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                    />
                                </div>
                            </div>
                        </aside>

                        {/* Right: Car Listings */}
                        <div className="min-w-0">
                            {showFeatured && (
                                <FeaturedSpotlight
                                    cars={featured}
                                    selectedCarId={selectedCar?.id ?? null}
                                    onSelect={handleSelectToggle}
                                />
                            )}

                            {filteredCars.length > 0 ? (
                                view === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                                        {filteredCars.map((car, i) => (
                                            <CarCard
                                                key={car.id}
                                                car={car}
                                                view="grid"
                                                index={i}
                                                isSelected={selectedCar?.id === car.id}
                                                onSelectToggle={handleSelectToggle}
                                                pickupDate={startDate}
                                                pickupTime={pickupTime}
                                                pickupLocation={pickupLocation}
                                                returnDate={endDate}
                                                returnTime={returnTime}
                                                returnLocation={returnLocation}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {filteredCars.map((car, i) => (
                                            <CarCard
                                                key={car.id}
                                                car={car}
                                                view="list"
                                                index={i}
                                                isSelected={selectedCar?.id === car.id}
                                                onSelectToggle={handleSelectToggle}
                                                pickupDate={startDate}
                                                pickupTime={pickupTime}
                                                pickupLocation={pickupLocation}
                                                returnDate={endDate}
                                                returnTime={returnTime}
                                                returnLocation={returnLocation}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-20 px-4">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <svg
                                            className="w-10 h-10 text-surface-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.5"
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-black text-surface-900 mb-2">No vehicles found</h3>
                                    <p className="text-base text-surface-500 mb-6 max-w-md mx-auto leading-relaxed">
                                        We couldn't find any cars matching your current filters. Try widening
                                        your search criteria or resetting all filters.
                                    </p>
                                    <button
                                        onClick={resetFilters}
                                        className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-surface-950 text-white font-bold text-sm hover:bg-brand-700 transition-colors shadow-md"
                                    >
                                        Reset all filters
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2.5"
                                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {cars.links && cars.links.length > 3 && (
                                <div className="mt-12 flex justify-center">
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        {cars.links.map((link) => (
                                            <Link
                                                key={link.label}
                                                href={link.url || '#'}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`min-w-[2.75rem] h-11 px-4 inline-flex items-center justify-center text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm ${
                                                    link.active
                                                        ? 'bg-surface-950 text-white shadow-lg'
                                                        : 'bg-white text-surface-600 hover:bg-surface-100 hover:text-surface-900 border border-surface-200 hover:border-surface-300'
                                                } ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                preserveState
                                                preserveScroll
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div
                className={`fixed inset-0 z-30 transition-opacity duration-300 ${
                    popoverOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setPopoverOpen(false)}
                aria-hidden={!popoverOpen}
            />
        </GuestLayout>
    );
}

function MoreFiltersBar({
    fuelFilter,
    setFuelFilter,
    transmissionFilter,
    setTransmissionFilter,
    minSeats,
    setMinSeats,
    priceMin,
    priceMax,
    setPriceMin,
    setPriceMax,
    priceBounds,
}: {
    fuelFilter: string;
    setFuelFilter: (v: string) => void;
    transmissionFilter: string;
    setTransmissionFilter: (v: string) => void;
    minSeats: number;
    setMinSeats: (n: number) => void;
    priceMin: number;
    priceMax: number;
    setPriceMin: (n: number) => void;
    setPriceMax: (n: number) => void;
    priceBounds: { min: number; max: number };
}) {
    const [open, setOpen] = useState(false);
    const activeCount = [
        fuelFilter !== 'any',
        transmissionFilter !== 'any',
        minSeats > 0,
        priceMin > priceBounds.min || priceMax < priceBounds.max,
    ].filter(Boolean).length;

    return (
        <div className="mt-3 pt-3 border-t border-surface-100">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">More</span>
                <ChipToggle
                    icon={FIELD_ICONS.fuel}
                    label="Fuel"
                    isActive={fuelFilter !== 'any'}
                    onClear={() => setFuelFilter('any')}
                />
                <ChipToggle
                    icon={FIELD_ICONS.gear}
                    label="Transmission"
                    isActive={transmissionFilter !== 'any'}
                    onClear={() => setTransmissionFilter('any')}
                />
                <ChipToggle
                    icon={FIELD_ICONS.users}
                    label="Seats"
                    isActive={minSeats > 0}
                    onClear={() => setMinSeats(0)}
                />
                <ChipToggle
                    icon={FIELD_ICONS.dollar}
                    label="Price"
                    isActive={priceMin > priceBounds.min || priceMax < priceBounds.max}
                    onClear={() => {
                        setPriceMin(priceBounds.min);
                        setPriceMax(priceBounds.max);
                    }}
                />
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className={`ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        open
                            ? 'bg-brand-700 text-white shadow-sm'
                            : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                    }`}
                >
                    {FIELD_ICONS.sliders}
                    {open ? 'Hide' : 'Customize'}
                    {activeCount > 0 && (
                        <span className="ml-0.5 w-4 h-4 rounded-full bg-accent-400 text-brand-900 text-[9px] font-black flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}
                </button>
            </div>

            {open && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
                    <FilterGroup label="Fuel type" icon={FIELD_ICONS.fuel}>
                        <div className="flex flex-wrap gap-1.5">
                            <PillButton active={fuelFilter === 'any'} onClick={() => setFuelFilter('any')}>Any</PillButton>
                            {FUEL_OPTIONS.map((f) => (
                                <PillButton
                                    key={f}
                                    active={fuelFilter === f}
                                    onClick={() => setFuelFilter(f)}
                                >
                                    {f}
                                </PillButton>
                            ))}
                        </div>
                    </FilterGroup>

                    <FilterGroup label="Transmission" icon={FIELD_ICONS.gear}>
                        <div className="flex flex-wrap gap-1.5">
                            <PillButton active={transmissionFilter === 'any'} onClick={() => setTransmissionFilter('any')}>Any</PillButton>
                            {TRANSMISSION_OPTIONS.map((t) => (
                                <PillButton
                                    key={t}
                                    active={transmissionFilter === t}
                                    onClick={() => setTransmissionFilter(t)}
                                >
                                    {t}
                                </PillButton>
                            ))}
                        </div>
                    </FilterGroup>

                    <FilterGroup label="Min seats" icon={FIELD_ICONS.users}>
                        <div className="flex flex-wrap gap-1.5">
                            <PillButton active={minSeats === 0} onClick={() => setMinSeats(0)}>Any</PillButton>
                            {[2, 4, 5, 7].map((n) => (
                                <PillButton
                                    key={n}
                                    active={minSeats === n}
                                    onClick={() => setMinSeats(n)}
                                >
                                    {n}+
                                </PillButton>
                            ))}
                        </div>
                    </FilterGroup>

                    <FilterGroup label="Price / day" icon={FIELD_ICONS.dollar}>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <div className="text-[9px] font-bold text-surface-500 uppercase tracking-wider mb-1">Min</div>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-surface-500">$</span>
                                    <input
                                        type="number"
                                        min={priceBounds.min}
                                        max={priceMax}
                                        value={priceMin}
                                        onChange={(e) => setPriceMin(Math.max(priceBounds.min, Math.min(priceMax, Number(e.target.value))))}
                                        className="w-full h-9 pl-6 pr-2 bg-white border border-surface-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                    />
                                </div>
                            </div>
                            <div className="text-surface-300 mt-4">—</div>
                            <div className="flex-1">
                                <div className="text-[9px] font-bold text-surface-500 uppercase tracking-wider mb-1">Max</div>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-surface-500">$</span>
                                    <input
                                        type="number"
                                        min={priceMin}
                                        max={priceBounds.max}
                                        value={priceMax}
                                        onChange={(e) => setPriceMax(Math.min(priceBounds.max, Math.max(priceMin, Number(e.target.value))))}
                                        className="w-full h-9 pl-6 pr-2 bg-white border border-surface-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </FilterGroup>
                </div>
            )}
        </div>
    );
}

function ChipToggle({
    icon,
    label,
    isActive,
    onClear,
}: {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClear: () => void;
}) {
    if (!isActive) {
        return (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-surface-50 text-surface-500 border border-surface-200/80">
                <span className="text-surface-500">{icon}</span>
                {label}
            </span>
        );
    }
    return (
        <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 pr-3 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-brand-700 text-white hover:bg-brand-600 transition-colors active:scale-95"
        >
            <span className="text-accent-400">{icon}</span>
            {label}
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                {FIELD_ICONS.x}
            </span>
        </button>
    );
}

function FilterGroup({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-surface-50/70 border border-surface-200/60 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-surface-600 mb-2">
                <span className="text-brand-600">{icon}</span>
                {label}
            </div>
            {children}
        </div>
    );
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center h-8 px-3 rounded-lg text-[11px] font-bold transition-all duration-200 active:scale-95 ${
                active
                    ? 'bg-gradient-to-r from-brand-700 to-brand-800 text-white shadow-sm'
                    : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
            }`}
        >
            {children}
        </button>
    );
}
