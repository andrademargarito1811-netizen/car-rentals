import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface ClientErrors {
    [key: string]: string;
}

const SECTIONS = [
    {
        id: 'details', title: 'Vehicle Details', subtitle: 'Location, VIN, Make, Model, Year, Color, Doors',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
        id: 'specs', title: 'Specifications', subtitle: 'Seats, Baggage, Weight, Class',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
    {
        id: 'pricing', title: 'Pricing & Sale', subtitle: 'Daily Rate, Sale Date, Sale Price',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
        id: 'mechanical', title: 'Mechanical', subtitle: 'Engine, Power Type, Transmission, Fuel, Emissions',
        icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
    },
];

const SECTION_FIELDS: Record<string, string[]> = {
    details: ['location_id', 'stock_number', 'license_plate', 'vin', 'brand', 'model', 'year', 'vehicle_doors', 'color'],
    specs: ['seats', 'baggage_capacity', 'maximum_weight', 'class_id'],
    pricing: ['daily_rate', 'sale_date', 'sale_price', 'sold_to'],
    mechanical: ['engine', 'transmission', 'fuel_type', 'fuel_charges', 'fuel_consumption', 'co2_emission', 'free_km_per_day', 'additional_km_rate', 'fuel_tank_capacity'],
};

const REQUIRED_FIELDS: Record<string, string> = {
    location_id: 'Location',
    stock_number: 'Stock #',
    license_plate: 'Reg. No.',
    vin: 'VIN',
    brand: 'Make',
    model: 'Model',
    year: 'Year',
    vehicle_doors: 'Doors',
    color: 'Color',
    seats: 'People Capacity',
    baggage_capacity: 'Baggage',
    maximum_weight: 'Max Weight',
    class_id: 'Class',
    daily_rate: 'Daily Rate',
    engine: 'Engine',
    transmission: 'Transmission',
    fuel_type: 'Fuel Type',
    availability_id: 'Status',
    description: 'Description',
};

interface AdminCarsEditProps {
    car: {
        id: number;
        brand: string;
        model: string;
        year: number;
        license_plate: string;
        daily_rate: number;
        fuel_type: string;
        seats: number;
        transmission: string;
        description: string | null;
        status: string;
        image_path: string | null;
        location_id: number | null;
        stock_number: string | null;
        vin: string | null;
        color: string | null;
        vehicle_doors: number | null;
        baggage_capacity: number | null;
        maximum_weight: number | null;
        class_id: string | null;
        sale_date: string | null;
        sale_price: number | null;
        sold_to: string | null;
        air_conditioned: boolean | number | null;
        engine: string | null;
        fuel_charges: number | null;
        fuel_consumption: number | null;
        co2_emission: number | null;
        free_km_per_day: number | null;
        additional_km_rate: number | null;
        fuel_tank_capacity: number | null;
        availability_id: number | null;
    };
    locations: { location_id: number; location: string }[];
    classes: { class_no: string; class_desc: string }[];
    availabilities: { available_id: number; available_desc: string }[];
}

export default function AdminCarsEdit({ car, locations = [], classes = [], availabilities = [] }: AdminCarsEditProps) {
    const route = useRoute();
    const [preview, setPreview] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ details: true });
    const [clientErrors, setClientErrors] = useState<ClientErrors>({});

    const form = useForm({
        brand: car.brand,
        model: car.model,
        year: car.year.toString(),
        license_plate: car.license_plate,
        daily_rate: car.daily_rate.toString(),
        fuel_type: car.fuel_type,
        seats: car.seats.toString(),
        transmission: car.transmission,
        description: car.description || '',
        image: null as File | null,
        location_id: car.location_id?.toString() || '',
        stock_number: car.stock_number || '',
        vin: car.vin || '',
        color: car.color || '',
        vehicle_doors: car.vehicle_doors?.toString() || '',
        baggage_capacity: car.baggage_capacity?.toString() || '',
        maximum_weight: car.maximum_weight?.toString() || '',
        class_id: car.class_id || '',
        sale_date: car.sale_date ? car.sale_date.split('T')[0] : '',
        sale_price: car.sale_price?.toString() || '',
        sold_to: car.sold_to || '',
        air_conditioned: car.air_conditioned != null ? (car.air_conditioned ? '1' : '0') : '1',
        engine: car.engine || '',
        fuel_charges: car.fuel_charges?.toString() || '0',
        fuel_consumption: car.fuel_consumption?.toString() || '0',
        co2_emission: car.co2_emission?.toString() || '0',
        free_km_per_day: car.free_km_per_day?.toString() || '',
        additional_km_rate: car.additional_km_rate?.toString() || '',
        fuel_tank_capacity: car.fuel_tank_capacity?.toString() || '',
        availability_id: car.availability_id?.toString() || '',
    });

    const d = form.data;

    const sectionProgress = useMemo(() => {
        const result: Record<string, { filled: number; total: number; percent: number }> = {};
        for (const s of SECTIONS) {
            const fields = SECTION_FIELDS[s.id];
            const filled = fields.filter(f => (d as any)[f] && String((d as any)[f]).trim() !== '').length;
            result[s.id] = { filled, total: fields.length, percent: Math.round((filled / fields.length) * 100) };
        }
        return result;
    }, [d]);

    const totalPercent = useMemo(() => {
        const allFields = Object.values(SECTION_FIELDS).flat();
        const allFilled = allFields.filter(f => (d as any)[f] && String((d as any)[f]).trim() !== '').length;
        return Math.round((allFilled / allFields.length) * 100);
    }, [d]);

    function validate(): boolean {
        const errors: ClientErrors = {};
        for (const [field, label] of Object.entries(REQUIRED_FIELDS)) {
            const val = (d as Record<string, unknown>)[field];
            if (!val || String(val).trim() === '') {
                errors[field] = `${label} is required`;
            }
        }
        setClientErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        const hasFile = d.image !== null || preview !== null;
        form.put(route('admin.cars.update', car.id), { forceFormData: hasFile });
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('image', file);
            setPreview(URL.createObjectURL(file));
        }
    }

    const f = (field: string) => ({
        value: (d as any)[field] || '',
        onChange: (e: any) => {
            form.setData(field as any, e.target.value);
            if (clientErrors[field]) {
                setClientErrors(prev => {
                    const next = { ...prev };
                    delete next[field];
                    return next;
                });
            }
        },
    });

    const err = (field: string) => {
        const serverMsg = form.errors[field as keyof typeof form.errors];
        const clientMsg = clientErrors[field];
        const msg = clientMsg || serverMsg;
        return msg ? (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-fade-in">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {msg}
            </p>
        ) : null;
    };

    const toggleSection = (id: string) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const carName = [d.brand, d.model, d.year].filter(Boolean).join(' ') || 'Edit Vehicle';
    const rate = d.daily_rate ? `$${parseFloat(d.daily_rate).toFixed(2)}` : '—';

    const imageSrc = preview || (car.image_path ? `/storage/${car.image_path}` : null);

    const Label = ({ children, icon, required }: { children: React.ReactNode; icon?: string; required?: boolean }) => (
        <label className="block text-sm font-semibold text-amber-700 dark:text-surface-300 mb-1.5 flex items-center gap-1.5">
            {icon && (
                <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
            )}
            {children}
            {required && <span className="text-red-500 dark:text-red-400 ml-1 text-lg leading-none">*</span>}
        </label>
    );

    return (
        <>
            <Head title="Edit Car" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Cars', href: 'admin.cars.index' }, { label: 'Edit Car' }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-surface-900 dark:from-brand-950 dark:via-brand-900 dark:to-surface-950 p-5 sm:p-6">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-400/10 rounded-full blur-3xl animate-float-orb" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-400/10 rounded-full blur-3xl animate-float-orb-delayed" />
                        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-accent-300/5 rounded-full blur-2xl animate-slow-spin" />

                        <div className="flex items-center gap-2 mb-3 text-xs font-medium text-brand-200/70 animate-fade-in-down">
                            <Link href={route('admin.cars.index')} className="hover:text-accent-300 transition-colors">Vehicles</Link>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-white/60">Edit</span>
                        </div>

                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10 ring-1 ring-white/20 animate-bounce-in">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Edit Car</h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent-400/20 text-accent-300 ring-1 ring-accent-400/30 animate-fade-in">
                                        {car.brand} {car.model} ({car.year})
                                    </span>
                                </div>
                                <p className="text-sm text-brand-200/80 mt-0.5">Update the vehicle details below</p>
                            </div>
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm ring-1 ring-white/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-soft-pulse" />
                                    <span className="text-[11px] font-medium text-brand-200/80">Editing</span>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-brand-300/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span className="text-xs font-medium text-brand-200/60">
                                        {totalPercent}% complete
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="py-6 sm:py-8 page-enter">
                    <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
                        <div className="card overflow-hidden">
                            <form onSubmit={submit} encType="multipart/form-data">
                                <div className="flex flex-col xl:flex-row">

                                    {/* Progress Bar */}
                                    <div className="xl:hidden px-5 sm:px-6 lg:px-8 pt-5 sm:pt-6 lg:pt-8">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Form Completion</span>
                                            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{totalPercent}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-amber-100/60 dark:bg-surface-700/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-brand-500 to-accent-400 rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${totalPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0 p-5 sm:p-6 lg:p-8">

                                        {/* Image + Description + Status */}
                                        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-surface-800/40 dark:to-surface-800/10 border border-amber-200/70 dark:border-surface-700/40 animate-fade-in-up">
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="relative w-20 h-16 shrink-0 rounded-xl border-2 border-dashed border-amber-300 dark:border-surface-600/60 bg-amber-50/70 dark:bg-surface-800/50 group cursor-pointer overflow-hidden transition-all duration-300 hover:border-brand-400 hover:shadow-glow-blue hover:scale-105">
                                                    <input type="file" onChange={onFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                    {imageSrc ? (
                                                        <img src={imageSrc} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                            <svg className="w-6 h-6 text-amber-700 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="sm:hidden">
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Photo</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                                                    </svg>
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Description <span className="text-red-500">*</span></span>
                                                </div>
                                                <textarea {...f('description')} className="input-field resize-none text-sm flex-1" placeholder="Enter vehicle description..." />
                                                {err('description')}
                                            </div>
                                            <div className="shrink-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Status <span className="text-red-500">*</span></span>
                                                </div>
                                                <select {...f('availability_id')} className="input-field text-xs">
                                                    <option value="">Select</option>
                                                    {availabilities.map(a => (
                                                        <option key={a.available_id} value={a.available_id}>{a.available_desc}</option>
                                                    ))}
                                                </select>
                                                <div className="mt-3">
                                                    <div className="flex items-center gap-2 mb-1.5 justify-between">
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Air Conditioned</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <button type="button" onClick={() => form.setData('air_conditioned' as any, d.air_conditioned === '1' ? '0' : '1')}
                                                            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                                                                d.air_conditioned === '1' ? 'bg-brand-600' : 'bg-amber-300 dark:bg-surface-600'
                                                            }`}
                                                        >
                                                            <span className={`inline-block h-6 w-6 transform rounded-full bg-amber-50 shadow-md transition-transform duration-300 ${d.air_conditioned === '1' ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                        <span className="ml-3 text-sm font-medium text-amber-800 dark:text-surface-400">{d.air_conditioned === '1' ? 'Yes' : 'No'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {Object.keys(clientErrors).length > 0 && (
                                            <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 animate-fade-in-down">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">Please complete the following required fields</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {Object.entries(clientErrors).map(([field, msg]) => (
                                                        <li key={field} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            {msg}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Progress Stepper */}
                                        <div className="hidden xl:flex items-center gap-3 mb-6 p-4 rounded-2xl bg-amber-50/80 dark:bg-surface-800/40 border border-amber-200/60 dark:border-surface-700/50 animate-fade-in-up">
                                            {SECTIONS.map((s, i) => {
                                                const sp = sectionProgress[s.id];
                                                const isComplete = sp.percent === 100;
                                                const isActive = openSections[s.id];
                                                return (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => toggleSection(s.id)}
                                                        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-300 group ${
                                                            isActive
                                                                ? 'bg-amber-50 dark:bg-brand-900/30 shadow-sm'
                                                                : 'hover:bg-amber-50 dark:hover:bg-surface-700/30'
                                                        }`}
                                                    >
                                                        <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                                            isComplete
                                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                                : isActive
                                                                    ? 'bg-brand-500 text-white'
                                                                    : 'bg-amber-200 dark:bg-surface-700 text-amber-700 dark:text-surface-400'
                                                        }`}>
                                                            {isComplete ? (
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            ) : (
                                                                i + 1
                                                            )}
                                                        </span>
                                                        <span className="text-xs font-semibold text-amber-700 dark:text-surface-300 hidden lg:block">{s.title}</span>
                                                        <span className={`text-[10px] font-medium ${
                                                            isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700'
                                                        }`}>
                                                            {sp.filled}/{sp.total}
                                                        </span>
                                                        {i < SECTIONS.length - 1 && (
                                                            <svg className="w-4 h-4 text-amber-700 dark:text-surface-600 -mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Accordion Sections */}
                                        <div className="space-y-3">
                                            {SECTIONS.map((s, i) => {
                                                const sp = sectionProgress[s.id];
                                                const isComplete = sp.percent === 100;
                                                const isOpen = openSections[s.id] ?? false;
                                                return (
                                                    <div
                                                        key={s.id}
                                                        className={`rounded-2xl border transition-all duration-300 animate-fade-in-up ${
                                                            isOpen
                                                                ? 'border-brand-200/70 dark:border-brand-700/40 shadow-sm'
                                                                : 'border-amber-200/60 dark:border-surface-700/50 hover:border-amber-300/60 dark:hover:border-surface-600/50'
                                                        } ${isOpen ? 'bg-amber-50 dark:bg-surface-800/50' : 'bg-amber-50/60 dark:bg-surface-800/20'} ${i === 0 ? '' : `stagger-${i + 1}`}`}
                                                        style={{ animationDelay: `${i * 0.1}s` }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSection(s.id)}
                                                            className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors duration-200"
                                                        >
                                                            <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                                                isComplete
                                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                                    : isOpen
                                                                        ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400'
                                                                        : 'bg-amber-100/60 text-amber-800 dark:bg-surface-700/50 dark:text-surface-400'
                                                            }`}>
                                                                {isComplete ? (
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                                                                    </svg>
                                                                )}
                                                            </span>
                                                            <span className="flex-1 min-w-0">
                                                                <span className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-amber-900 dark:text-white">{s.title}</span>
                                                                    {isComplete && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Done</span>
                                                                    )}
                                                                </span>
                                                                <span className="block text-xs text-amber-700 dark:text-surface-400 mt-0.5">{s.subtitle}</span>
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                <div className="hidden sm:block w-16 h-1.5 bg-amber-100/60 dark:bg-surface-700/50 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                                            isComplete ? 'bg-emerald-500' : 'bg-brand-400'
                                                                        }`}
                                                                        style={{ width: `${sp.percent}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`text-xs font-medium ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700'}`}>
                                                                    {sp.filled}/{sp.total}
                                                                </span>
                                                                <svg className={`w-4 h-4 text-amber-700 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </button>
                                                        <div
                                                            className={`transition-all duration-300 overflow-hidden ${
                                                                isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                                            }`}
                                                        >
                                                            <div className="px-5 pb-5 pt-3 border-t border-amber-200/60 dark:border-surface-700/50">
                                                                {s.id === 'details' && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5 pt-1">
                                                                        <div className="animate-fade-in"><Label icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" required>Location</Label>
                                                                            <select {...f('location_id')} className="input-field">
                                                                                <option value="">Select location</option>
                                                                                {locations.map(loc => (
                                                                                    <option key={loc.location_id} value={loc.location_id}>{loc.location}</option>
                                                                                ))}
                                                                            </select></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}><Label icon="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" required>Stock #</Label>
                                                                            <input type="text" {...f('stock_number')} placeholder="e.g. STK-001" className="input-field" />{err('stock_number')}</div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}><Label icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" required>Reg. No.</Label>
                                                                            <input type="text" {...f('license_plate')} placeholder="e.g. ABC 1234" className="input-field" />{err('license_plate')}</div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}><Label icon="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" required>VIN</Label>
                                                                            <input type="text" {...f('vin')} placeholder="e.g. 1HGCM82633..." className="input-field" />{err('vin')}</div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}><Label icon="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" required>Make</Label>
                                                                            <input type="text" {...f('brand')} placeholder="e.g. Toyota" className="input-field" />{err('brand')}</div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}><Label icon="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" required>Model</Label>
                                                                            <input type="text" {...f('model')} placeholder="e.g. Camry" className="input-field" />{err('model')}</div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}><Label icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" required>Year</Label>
                                                                            <input type="number" {...f('year')} placeholder="e.g. 2024" className="input-field" />{err('year')}</div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}><Label icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" required>Doors</Label>
                                                                            <input type="number" {...f('vehicle_doors')} placeholder="e.g. 4" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}><Label icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" required>Color</Label>
                                                                            <input type="text" {...f('color')} placeholder="e.g. White, Black, Red" className="input-field" /></div>
                                                                    </div>
                                                                )}
                                                                {s.id === 'specs' && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5 pt-1">
                                                                        <div className="animate-fade-in"><Label icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" required>People Capacity</Label>
                                                                            <input type="number" {...f('seats')} placeholder="e.g. 5" className="input-field" />{err('seats')}</div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}><Label icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" required>Baggage</Label>
                                                                            <input type="number" {...f('baggage_capacity')} placeholder="e.g. 3" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}><Label icon="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" required>Max Weight (kg)</Label>
                                                                            <input type="number" step="0.01" {...f('maximum_weight')} placeholder="e.g. 500" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}><Label icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" required>Class</Label>
                                                                            <select {...f('class_id')} className="input-field">
                                                                                <option value="">Select class</option>
                                                                                {classes.map(cls => (
                                                                                    <option key={cls.class_no} value={cls.class_no}>{cls.class_desc}</option>
                                                                                ))}
                                                                            </select></div>
                                                                    </div>
                                                                )}
                                                                {s.id === 'pricing' && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5 pt-1">
                                                                        <div className="animate-fade-in"><Label icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" required>Daily Rate ($)</Label>
                                                                            <input type="number" step="0.01" {...f('daily_rate')} placeholder="0.00" className="input-field" />{err('daily_rate')}</div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}><Label icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z">Sale Date</Label>
                                                                            <input type="date" {...f('sale_date')} className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}><Label icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z">Sale Price ($)</Label>
                                                                            <input type="number" step="0.01" {...f('sale_price')} placeholder="0.00" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}><Label icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z">Sold To</Label>
                                                                            <input type="text" {...f('sold_to')} placeholder="Buyer name" className="input-field" /></div>
                                                                    </div>
                                                                )}
                                                                {s.id === 'mechanical' && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5 pt-1">
                                                                        <div className="animate-fade-in"><Label icon="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" required>Engine</Label>
                                                                            <input type="text" {...f('engine')} placeholder="e.g. 2.5L 4-Cylinder" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}><Label icon="M9 17a1 1 0 018 0M8 14a4 4 0 018 0" required>Transmission</Label>
                                                                            <select {...f('transmission')} className="input-field">
                                                                                <option value="automatic">Automatic</option><option value="manual">Manual</option>
                                                                            </select></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}><Label icon="M13 10V3L4 14h7v7l9-11h-7z" required>Fuel Type</Label>
                                                                            <select {...f('fuel_type')} className="input-field">
                                                                                <option value="gasoline">Gasoline</option><option value="diesel">Diesel</option><option value="electric">Electric</option><option value="hybrid">Hybrid</option>
                                                                            </select></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}><Label icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z">Fuel Charges ($)</Label>
                                                                            <input type="number" step="0.01" {...f('fuel_charges')} placeholder="e.g. 45.00" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}><Label icon="M13 10V3L4 14h7v7l9-11h-7z">Consumption (L/100km)</Label>
                                                                            <input type="number" step="0.01" {...f('fuel_consumption')} placeholder="e.g. 7.5" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}><Label icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z">CO₂ Emission (g/km)</Label>
                                                                            <input type="number" {...f('co2_emission')} placeholder="e.g. 120" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}><Label icon="M13 10V3L4 14h7v7l9-11h-7z">Free KM / Day</Label>
                                                                            <input type="number" {...f('free_km_per_day')} placeholder="e.g. 100" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}><Label icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z">Additional KM Rate ($)</Label>
                                                                            <input type="number" step="0.01" {...f('additional_km_rate')} placeholder="e.g. 0.50" className="input-field" /></div>
                                                                        <div className="animate-fade-in" style={{ animationDelay: '0.45s' }}><Label icon="M13 10V3L4 14h7v7l9-11h-7z">Fuel Tank Capacity (L)</Label>
                                                                            <input type="number" step="0.01" {...f('fuel_tank_capacity')} placeholder="e.g. 55" className="input-field" /></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between mt-8 pt-5 border-t border-amber-200/60 dark:border-surface-700/50 animate-fade-in-up">
                                            <Link href={route('admin.cars.index')} className="btn-ghost">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                                Cancel
                                            </Link>
                                            <button type="submit" className="btn-primary group" disabled={form.processing}>
                                                {form.processing ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                        Updating...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        Update Car
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sticky Sidebar: Vehicle Summary */}
                                    <div className="xl:w-80 shrink-0 border-t xl:border-t-0 xl:border-l border-amber-200/60 dark:border-surface-700/50 bg-gradient-to-b from-amber-50 to-white dark:from-surface-900/30 dark:to-surface-900/10">
                                        <div className="xl:sticky xl:top-0 p-5 space-y-5">

                                            {/* Progress */}
                                            <div className="hidden xl:block">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">Completion</span>
                                                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{totalPercent}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-amber-100/60 dark:bg-surface-700/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-brand-500 to-accent-400 rounded-full transition-all duration-700 ease-out"
                                                        style={{ width: `${totalPercent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Preview Card */}
                                            <div className="rounded-2xl bg-white dark:bg-surface-800/80 border border-amber-200/60 dark:border-surface-700/50 shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-brand-300/50 dark:hover:border-brand-700/40">
                                                <div className="aspect-[16/9] bg-gradient-to-br from-amber-100 to-amber-200 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center overflow-hidden">
                                                    {imageSrc ? (
                                                        <img src={imageSrc} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1.5 text-amber-700 dark:text-surface-600">
                                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-[10px] font-medium">No image</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="min-w-0">
                                                            <h4 className="font-semibold text-amber-900 dark:text-white text-sm leading-tight truncate">{carName}</h4>
                                                            {d.license_plate && (
                                                                <p className="text-[11px] text-amber-600 dark:text-surface-400 font-mono mt-0.5">{d.license_plate}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-2 shrink-0">
                                                            {d.color && <span className="text-[10px] text-amber-700 dark:text-surface-400">{d.color}</span>}
                                                            {d.vehicle_doors && (
                                                                <span className="text-[10px] text-amber-700 dark:text-surface-400 ml-1">{d.vehicle_doors}dr</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-baseline gap-1 mb-3">
                                                        <span className="text-2xl font-bold text-amber-900 dark:text-white">{rate}</span>
                                                        {d.daily_rate && <span className="text-[11px] text-amber-600 dark:text-surface-400">/day</span>}
                                                    </div>

                                                    {(d.seats || d.transmission || d.fuel_type) && (
                                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                                            {d.seats && <span className="px-2.5 py-1 rounded-md bg-amber-100/60 dark:bg-surface-700/50 text-[10px] font-medium text-amber-800 dark:text-surface-400">{d.seats} seats</span>}
                                                            {d.transmission && <span className="px-2.5 py-1 rounded-md bg-amber-100/60 dark:bg-surface-700/50 text-[10px] font-medium text-amber-800 dark:text-surface-400 capitalize">{d.transmission}</span>}
                                                            {d.fuel_type && <span className="px-2.5 py-1 rounded-md bg-amber-100/60 dark:bg-surface-700/50 text-[10px] font-medium text-amber-800 dark:text-surface-400 capitalize">{d.fuel_type}</span>}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between pt-3 border-t border-amber-200/60 dark:border-surface-700/50">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-amber-100/70 dark:bg-surface-700/50 text-amber-800 dark:text-surface-400">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                availabilities.find(a => a.available_id === Number(d.availability_id))?.available_desc === 'Available' ? 'bg-emerald-500' :
                                                                availabilities.find(a => a.available_id === Number(d.availability_id))?.available_desc === 'Rented' ? 'bg-blue-500' :
                                                                'bg-amber-400'
                                                            }`} />
                                                            {availabilities.find(a => a.available_id === Number(d.availability_id))?.available_desc || 'Not set'}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-surface-400">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d={totalPercent === 100 ? 'M5 13l4 4L19 7' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'} />
                                                            </svg>
                                                            {totalPercent}% done
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section Progress */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Section Progress</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {SECTIONS.map(s => {
                                                        const sp = sectionProgress[s.id];
                                                        const done = sp.percent === 100;
                                                        const partial = sp.filled > 0 && !done;
                                                        return (
                                                            <div key={s.id} className="group">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300 ${
                                                                            done ? 'bg-emerald-500' : partial ? 'bg-brand-500' : 'bg-amber-200 dark:bg-surface-700'
                                                                        }`}>
                                                                            {done ? (
                                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            ) : partial ? (
                                                                                <span className="text-[8px] font-bold text-white">{sp.filled}</span>
                                                                            ) : (
                                                                                <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                                                                                </svg>
                                                                            )}
                                                                        </span>
                                                                        <span className="text-xs font-medium text-amber-800 dark:text-surface-300 truncate">{s.title}</span>
                                                                    </div>
                                                                    <span className={`text-[10px] font-semibold shrink-0 ml-2 ${
                                                                        done ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-surface-400'
                                                                    }`}>{sp.percent}%</span>
                                                                </div>
                                                                <div className="w-full h-1 bg-amber-100/60 dark:bg-surface-700/50 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                                            done ? 'bg-emerald-500' : 'bg-brand-400'
                                                                        }`}
                                                                        style={{ width: `${sp.percent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Quick Stats */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Vehicle Stats</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { label: 'Year', value: d.year || '—', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                                                        { label: 'Fuel', value: d.fuel_type ? d.fuel_type.charAt(0).toUpperCase() + d.fuel_type.slice(1) : '—', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                                                        { label: 'Engine', value: d.engine || '—', icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z' },
                                                        { label: 'Class', value: classes.find(c => c.class_no === d.class_id)?.class_desc || d.class_id || '—', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                                                    ].map(stat => (
                                                        <div key={stat.label} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white dark:bg-surface-800/60 border border-amber-200/40 dark:border-surface-700/40 transition-all duration-200 hover:border-brand-300/50 dark:hover:border-brand-700/30 hover:shadow-sm">
                                                            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-surface-700/50 flex items-center justify-center shrink-0">
                                                                <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                                                </svg>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-[10px] text-amber-600 dark:text-surface-400 leading-tight">{stat.label}</div>
                                                                <div className="text-xs font-semibold text-amber-900 dark:text-surface-200 leading-tight truncate">{stat.value}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Field Summary Ring */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Field Summary</span>
                                                </div>
                                                {(() => {
                                                    const allFields = Object.values(SECTION_FIELDS).flat();
                                                    const total = allFields.length;
                                                    const filled = allFields.filter(f => (d as any)[f] && String((d as any)[f]).trim() !== '').length;
                                                    const errors = Object.keys(form.errors).length;
                                                    const empty = total - filled;
                                                    return (
                                                        <div className="rounded-xl bg-white dark:bg-surface-800/40 border border-amber-200/40 dark:border-surface-700/40 p-3.5">
                                                            <div className="flex items-center justify-center gap-6">
                                                                <div className="relative w-16 h-16">
                                                                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
                                                                        <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="6" className="text-amber-100 dark:text-surface-700" />
                                                                        <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="6"
                                                                            strokeDasharray={`${(filled / total) * 188.5} 188.5`}
                                                                            className="text-brand-500 transition-all duration-700 ease-out"
                                                                            strokeLinecap="round"
                                                                        />
                                                                    </svg>
                                                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-amber-900 dark:text-white">{totalPercent}%</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                        <span className="text-[11px] text-amber-700 dark:text-surface-400">Filled</span>
                                                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{filled}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full bg-amber-300 dark:bg-surface-600" />
                                                                        <span className="text-[11px] text-amber-700 dark:text-surface-400">Empty</span>
                                                                        <span className="text-xs font-semibold text-amber-700 dark:text-surface-300">{empty}</span>
                                                                    </div>
                                                                    {errors > 0 && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-2 h-2 rounded-full bg-red-500" />
                                                                            <span className="text-[11px] text-red-600 dark:text-red-400">Errors</span>
                                                                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">{errors}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
