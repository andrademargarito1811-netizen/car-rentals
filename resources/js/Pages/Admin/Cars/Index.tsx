import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface CarData {
    id: number;
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    daily_rate: number;
    status?: string;
    color: string | null;
    transmission: string;
    fuel_type: string;
    seats: number;
    vehicle_doors: number | null;
    baggage_capacity: number | null;
    engine: string | null;
    fuel_consumption: number | null;
    co2_emission: number | null;
    air_conditioned: boolean | number;
    image_path: string | null;
    location_id: number | null;
    class_id: string | null;
    availability_id: number | null;
    stock_number: string | null;
    description: string | null;
    location: { location_id: number; location: string } | null;
    vehicle_class: { class_no: string; class_desc: string } | null;
    availability: { available_id: number; available_desc: string } | null;
}

interface AdminCarsIndexProps {
    cars: {
        data: CarData[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    stats?: {
        total: number;
        available: number;
        rented: number;
    };
    filters?: {
        search: string | null;
        sort_field: string;
        sort_direction: string;
    };
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        available: 'badge-active',
        rented: 'badge-pending',
        maintenance: 'badge-cancelled',
    };
    return map[status] || 'badge-completed';
}

function statusIcon(status: string) {
    const map: Record<string, string> = {
        available: 'M5 13l4 4L19 7',
        rented: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
        maintenance: 'M12 9v3.75m-1.5-5.25h1.5m-1.5 3h1.5m-1.5 3h1.5',
    };
    return map[status] || 'M9 12l2 2 4-4';
}

const colorMap: Record<string, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    black: 'bg-gray-900',
    white: 'bg-white ring-1 ring-gray-300',
    silver: 'bg-gray-300',
    gray: 'bg-gray-400',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    orange: 'bg-orange-500',
    brown: 'bg-amber-700',
    navy: 'bg-blue-800',
    beige: 'bg-amber-100 ring-1 ring-amber-200',
    gold: 'bg-yellow-500',
    maroon: 'bg-red-800',
    purple: 'bg-purple-600',
};

function colorDot(color: string | null) {
    const cls = (color && colorMap[color.toLowerCase()]) || 'bg-surface-300 ring-1 ring-surface-400/50';
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls} shrink-0`} title={color || 'unknown'} />;
}

function transIcon(trans: string) {
    const manual = trans === 'manual';
    return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {manual ? (
                <>
                    <circle cx="6" cy="18" r="2" />
                    <circle cx="18" cy="6" r="2" />
                    <path d="M18 6l-4 4" />
                    <path d="M10 14l-4 4" />
                    <path d="M12 12v-2" />
                    <path d="M12 12h-2" />
                </>
            ) : (
                <>
                    <circle cx="12" cy="12" r="2" />
                    <path d="M12 2v4" />
                    <path d="M12 18v4" />
                    <path d="M22 12h-4" />
                    <path d="M6 12H2" />
                    <path d="M4.93 4.93l2.83 2.83" />
                    <path d="M16.24 16.24l2.83 2.83" />
                    <path d="M4.93 19.07l2.83-2.83" />
                    <path d="M16.24 7.76l2.83-2.83" />
                </>
            )}
        </svg>
    );
}

function fuelIcon(type: string) {
    const isElectric = type === 'electric';
    return (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isElectric ? (
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            ) : (
                <>
                    <path d="M4 20h10" />
                    <path d="M9 4v12" />
                    <path d="M3 16h12a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
                    <path d="M17 10h2a2 2 0 012 2v2a1 1 0 01-1 1h-1a1 1 0 01-1-1v-2a2 2 0 00-2-2" />
                </>
            )}
        </svg>
    );
}

export default function AdminCarsIndex({ cars, stats, filters }: AdminCarsIndexProps) {
    const route = useRoute();
    const [search, setSearch] = useState(filters?.search || '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get(route('admin.cars.index'), {
                search,
                sort_field: filters?.sort_field || 'brand',
                sort_direction: filters?.sort_direction || 'asc',
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    function handleSort(field: string) {
        const same = filters?.sort_field === field;
        const dir = same && filters?.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('admin.cars.index'), {
            search: filters?.search || '',
            sort_field: field,
            sort_direction: dir,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function sortArrow(field: string) {
        if (filters?.sort_field !== field) return null;
        return filters.sort_direction === 'asc' ? ' ▲' : ' ▼';
    }

    const statusCounts = {
        total: stats?.total ?? cars.data.length,
        available: stats?.available ?? 0,
        rented: stats?.rented ?? 0,
    };

    return (
        <>
            <Head title="Manage Cars" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Cars' }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Fleet Management
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Cars
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    View, add, edit, and manage your entire vehicle fleet.
                                </p>
                            </div>
                            <Link href={route('admin.cars.create')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-xl shadow-lg shadow-black/10 hover:bg-brand-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Car
                            </Link>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        {/* Stats bar */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Total Cars', value: statusCounts.total, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
                                { label: 'Available', value: statusCounts.available, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M5 13l4 4L19 7' },
                                { label: 'Rented', value: statusCounts.rented, gradient: 'from-accent-400/20 to-accent-500/10', iconGradient: 'from-accent-400 to-accent-500', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
                            ].map((stat, i) => (
                                <div key={stat.label} className={`animate-fade-in-up stagger-${i + 1}`}>
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30 opacity-100`} />
                                        <div className="relative p-4 sm:p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg shadow-black/10 text-white relative z-10`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                                        </svg>
                                                    </div>
                                                    <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${stat.iconGradient} opacity-20 blur-md`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{stat.label}</p>
                                                    <p className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">{stat.value}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cars table */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">Vehicles</span>
                                {search && <span className="text-[11px] text-surface-400 dark:text-surface-500">({cars.data.length} result{cars.data.length !== 1 ? 's' : ''})</span>}
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                                <div className="relative w-72">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search brand, model, plate..."
                                        className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200" />
                                    {search && (
                                        <button onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="animate-fade-in-up rounded-xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full table-fixed">
                                        <colgroup>
                                            <col className="w-[18%]" />
                                            <col className="w-[14%]" />
                                            <col className="w-[8%]" />
                                            <col className="w-[18%]" />
                                            <col className="w-[34%]" />
                                            <col className="w-[8%]" />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th onClick={() => handleSort('brand')}
                                                    className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                                    Vehicle<span className="text-[9px]">{sortArrow('brand')}</span>
                                                </th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Class</th>
                                                <th onClick={() => handleSort('daily_rate')}
                                                    className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                                    Price/Day<span className="text-[9px]">{sortArrow('daily_rate')}</span>
                                                </th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Description</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Features</th>
                                                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cars.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-5 py-20 text-center">
                                                        <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-7 h-7 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-surface-500 dark:text-surface-400 font-medium">No cars found</p>
                                                        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Get started by adding your first vehicle.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                cars.data.map((car, i) => (
                                                    <tr key={car.id}
                                                        className="group relative transition-all duration-200 hover:bg-gradient-to-r hover:from-brand-500/[0.04] hover:to-transparent dark:hover:from-brand-400/[0.06] dark:hover:to-transparent border-b border-surface-100/80 dark:border-surface-700/30 last:border-b-0">

                                                        {/* Hover accent indicator */}
                                                        <td className="px-5 py-4 relative">
                                                            <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-brand-500 dark:bg-brand-400 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-y-0 group-hover:scale-y-100 origin-top" />

                                                            <div className="flex items-start gap-4">
                                                                <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 ring-1 ring-surface-200 dark:ring-surface-700 bg-surface-100 dark:bg-surface-800 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                                                                    {car.image_path ? (
                                                                        <img src={`/storage/${car.image_path}`} alt={`${car.brand} ${car.model}`}
                                                                            className="w-full h-full object-contain" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <svg className="w-6 h-6 text-surface-400/50 dark:text-surface-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <span className="font-semibold text-sm text-surface-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors truncate max-w-[180px]">
                                                                             {car.brand} {car.model}
                                                                        </span>
                                                                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400 rounded-md shrink-0">
                                                                            {car.year}
                                                                        </span>
                                                                    </div>
                                                                    {car.description ? (
                                                                        <p className="text-[12px] text-surface-400 dark:text-surface-500 mt-1.5 leading-relaxed line-clamp-2">
                                                                            {car.description}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-[12px] text-surface-300 dark:text-surface-600 mt-1.5 italic">No description</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Vehicle Class */}
                                                        <td className="px-5 py-4 align-top">
                                                            {car.vehicle_class ? (
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-brand-500/10 to-brand-600/5 dark:from-brand-400/15 dark:to-brand-500/5 text-brand-700 dark:text-brand-400 rounded-lg ring-1 ring-brand-200/50 dark:ring-brand-700/30">
                                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M9 3h6l3 7-6 2-6-2 3-7z" />
                                                                        <path d="M12 12v8" />
                                                                        <path d="M8 19h8" />
                                                                    </svg>
                                                                    {car.vehicle_class.class_desc}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-surface-300 dark:text-surface-600">&mdash;</span>
                                                            )}
                                                        </td>

                                                        {/* Rent Price/Day */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="leading-none">
                                                                <div className="text-base font-bold text-surface-900 dark:text-white tracking-tight">{formatPrice(car.daily_rate)}</div>
                                                                <div className="text-[10px] text-surface-400 dark:text-surface-500 font-medium mt-1">per day</div>
                                                            </div>
                                                        </td>

                                                        {/* Vehicle Description: Color | Stock# | Plate */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-600 dark:text-surface-400">
                                                                    {colorDot(car.color)}
                                                                    {car.color || 'N/A'}
                                                                </span>
                                                                <span className="text-surface-300 dark:text-surface-600 text-[10px]">|</span>
                                                                <span className="text-[11px] font-mono font-medium text-surface-500 dark:text-surface-400">
                                                                    {car.stock_number
                                                                        ? <><span className="text-surface-400 dark:text-surface-500">#</span>{car.stock_number}</>
                                                                        : <span className="text-surface-300 dark:text-surface-600">&mdash;</span>}
                                                                </span>
                                                                <span className="text-surface-300 dark:text-surface-600 text-[10px]">|</span>
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold bg-surface-100 dark:bg-surface-700/40 text-surface-600 dark:text-surface-300 px-2 py-0.5 rounded-md ring-1 ring-surface-200 dark:ring-surface-600/50">
                                                                    <svg className="w-2.5 h-2.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                                                    </svg>
                                                                    {car.license_plate}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Features */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-50 dark:bg-brand-900/25 text-brand-600 dark:text-brand-400 rounded-md ring-1 ring-brand-200/30 dark:ring-brand-700/30">
                                                                    {transIcon(car.transmission)}
                                                                    {car.transmission === 'automatic' ? 'Auto' : 'Manual'}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400 rounded-md ring-1 ring-emerald-200/30 dark:ring-emerald-700/30">
                                                                    {fuelIcon(car.fuel_type)}
                                                                    <span className="capitalize">{car.fuel_type}</span>
                                                                </span>
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400 rounded-md ring-1 ring-amber-200/30 dark:ring-amber-700/30">
                                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <circle cx="12" cy="8" r="4" />
                                                                        <path d="M20 21a8 8 0 10-16 0" />
                                                                    </svg>
                                                                    {car.seats} seats
                                                                </span>
                                                                {car.vehicle_doors ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-50 dark:bg-purple-900/25 text-purple-600 dark:text-purple-400 rounded-md ring-1 ring-purple-200/30 dark:ring-purple-700/30">
                                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                                            <path d="M12 12v4" />
                                                                        </svg>
                                                                        {car.vehicle_doors}dr
                                                                    </span>
                                                                ) : null}
                                                                {car.baggage_capacity ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-900/25 text-rose-600 dark:text-rose-400 rounded-md ring-1 ring-rose-200/30 dark:ring-rose-700/30">
                                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <rect x="6" y="4" width="12" height="16" rx="2" />
                                                                            <path d="M10 4V2h4v2" />
                                                                            <path d="M6 10h12" />
                                                                            <path d="M6 14h12" />
                                                                        </svg>
                                                                        {car.baggage_capacity} bags
                                                                    </span>
                                                                ) : null}
                                                                {car.air_conditioned ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 rounded-md ring-1 ring-blue-200/30 dark:ring-blue-700/30">
                                                                        &#10052; AC
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>

                                                        {/* Action */}
                                                        <td className="px-5 py-4 align-top text-center">
                                                            <Link href={route('admin.cars.edit', car.id)}
                                                                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-surface-400 dark:text-surface-500 bg-transparent hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-400 hover:shadow-sm hover:shadow-brand-500/10 hover:ring-1 hover:ring-brand-200/50 dark:hover:ring-brand-700/30 transition-all duration-200"
                                                                title="Edit car">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                </svg>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {cars.links && cars.links.length > 3 && (
                                    <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-700/50 bg-surface-50/30 dark:bg-surface-800/20">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {cars.links.map((link) => {
                                                const label = link.label
                                                    .replace('&laquo;', '‹')
                                                    .replace('&raquo;', '›')
                                                    .replace('&lsaquo;', '‹')
                                                    .replace('&rsaquo;', '›');
                                                return (
                                                    <Link key={link.label}
                                                        href={link.url || '#'}
                                                        preserveState
                                                        preserveScroll
                                                        className={`inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                            link.active
                                                                ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/20 ring-1 ring-brand-500/30'
                                                                : 'text-surface-600 dark:text-surface-300 bg-white dark:bg-brand-800/60 hover:bg-surface-100 dark:hover:bg-surface-700/60 hover:text-surface-900 dark:hover:text-white hover:shadow-sm ring-1 ring-surface-200 dark:ring-surface-600/30'
                                                        } ${!link.url ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                                                        dangerouslySetInnerHTML={{ __html: label }} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
