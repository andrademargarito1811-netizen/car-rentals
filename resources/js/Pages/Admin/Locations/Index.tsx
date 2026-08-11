import { useState, useRef } from 'react';
import { toast } from 'sonner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { AdminLocation } from '@/types/models';
import Modal from '@/Components/Modal';
import LocationRow from './LocationRow';
import LocationFormPanel from './LocationFormPanel';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    locations: {
        data: AdminLocation[];
        links: PaginationLink[];
        total: number;
    };
    filters?: {
        search?: string;
    };
}

export default function LocationsIndex({ locations, filters }: Props) {
    const route = useRoute();
    const [showPanel, setShowPanel] = useState(false);
    const [editingLocation, setEditingLocation] = useState<AdminLocation | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminLocation | null>(null);
    const [search, setSearch] = useState(filters?.search || '');
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        location: '',
        subtitle: '',
        city: '',
        address: '',
        phone: '',
        hours: '',
        lat: '' as string | number,
        lng: '' as string | number,
        description: '',
        features: [] as string[],
        amenities: [] as string[],
        image: null as File | null,
        is_active: true,
    });

    const locationData = locations.data;
    const totalLocations = locations.total;
    const activeCount = locationData.filter(l => l.is_active).length;
    const inactiveCount = locationData.filter(l => !l.is_active).length;

    function openCreate() {
        setEditingLocation(null);
        reset();
        setImagePreview(null);
        setShowPanel(true);
    }

    function openEdit(loc: AdminLocation) {
        setEditingLocation(loc);
        setData({
            location: loc.location,
            subtitle: loc.subtitle || '',
            city: loc.city || '',
            address: loc.address || '',
            phone: loc.phone || '',
            hours: loc.hours || '',
            lat: loc.lat ?? '',
            lng: loc.lng ?? '',
            description: loc.description || '',
            features: loc.features || [],
            amenities: [],
            image: null,
            is_active: !!loc.is_active,
        });
        setImagePreview(loc.image ? (loc.image.startsWith('http') ? loc.image : '/storage/' + loc.image) : null);
        setShowPanel(true);
    }

    function closePanel() {
        setShowPanel(false);
        setEditingLocation(null);
        reset();
        setImagePreview(null);
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('location', data.location);
        formData.append('subtitle', data.subtitle);
        formData.append('city', data.city);
        formData.append('address', data.address);
        formData.append('phone', data.phone);
        formData.append('hours', data.hours);
        formData.append('lat', String(data.lat));
        formData.append('lng', String(data.lng));
        formData.append('description', data.description);
        formData.append('is_active', data.is_active ? '1' : '0');
        data.features.forEach((f, i) => formData.append(`features[${i}]`, f));
        data.amenities.forEach((a, i) => formData.append(`amenities[${i}]`, a));
        if (data.image) formData.append('image', data.image);

        if (editingLocation) {
            formData.append('_method', 'PUT');
            router.post(route('admin.locations.update', editingLocation.location_id), formData, {
                onSuccess: () => {
                    toast.success('Location updated successfully');
                    closePanel();
                },
                onError: () => {
                    toast.error('Failed to update location');
                },
            });
        } else {
            router.post(route('admin.locations.store'), formData, {
                onSuccess: () => {
                    toast.success('Location created successfully');
                    closePanel();
                },
                onError: () => {
                    toast.error('Failed to create location');
                },
            });
        }
    }

    function confirmDelete(loc: AdminLocation) {
        setDeleteTarget(loc);
    }

    function executeDelete() {
        if (!deleteTarget) return;
        router.delete(route('admin.locations.destroy', deleteTarget.location_id), {
            onSuccess: () => {
                toast.success('Location deleted successfully');
                setDeleteTarget(null);
            },
            onError: () => {
                toast.error('Failed to delete location');
            },
        });
    }

    function handleSearch(value: string) {
        setSearch(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(route('admin.locations.index'), { search: value || undefined }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
    }

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    const stats = [
        { label: 'Total Locations', value: totalLocations, gradient: 'from-blue-500 to-blue-600', iconGradient: 'from-blue-500 to-blue-600', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'Active', value: activeCount, gradient: 'from-emerald-500 to-emerald-600', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Inactive', value: inactiveCount, gradient: 'from-red-500 to-red-600', iconGradient: 'from-red-500 to-red-600', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];

    return (
        <>
            <Head title="Locations Management" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Locations' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Content Management
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Locations Settings</h1>
                                <p className="text-white/60 max-w-xl">Manage office and branch locations.</p>
                            </div>
                            <button onClick={openCreate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-xl shadow-lg shadow-black/10 hover:bg-brand-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                Add Location
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10">
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                {stats.map((stat, i) => (
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

                            {/* Search & Card Grid */}
                            <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700/60">
                                    <div className="relative max-w-sm">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={e => handleSearch(e.target.value)}
                                            placeholder="Search by name, city, address..."
                                            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                                        />
                                        {search && (
                                            <button onClick={() => handleSearch('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-surface-400 hover:text-surface-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {locationData.length > 0 ? (
                                    <>
                                        <div className="p-4 sm:p-5">
                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                {locationData.map(loc => (
                                                    <LocationRow
                                                        key={loc.location_id}
                                                        location={loc}
                                                        onEdit={openEdit}
                                                        onDelete={confirmDelete}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pagination */}
                                        {locations.links && locations.links.length > 3 && (
                                            <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-surface-100 dark:border-surface-700/40">
                                                {locations.links.map((link) => {
                                                    const label = link.label
                                                        .replace('&laquo;', '\u2039')
                                                        .replace('&raquo;', '\u203A')
                                                        .replace('&lsaquo;', '\u2039')
                                                        .replace('&rsaquo;', '\u203A');
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
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 px-4">
                                        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                                            {search ? 'No locations match your search' : 'No locations yet'}
                                        </h3>
                                        <p className="text-sm text-surface-500 mb-6 text-center max-w-sm">
                                            {search
                                                ? 'Try adjusting your search terms or clear the filter.'
                                                : 'Get started by adding your first office or branch location.'}
                                        </p>
                                        {!search && (
                                            <button onClick={openCreate}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold text-sm rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                Add Location
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <LocationFormPanel
                    show={showPanel}
                    editingLocation={editingLocation}
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    imagePreview={imagePreview}
                    setImagePreview={setImagePreview}
                    onClose={closePanel}
                    onSubmit={submitForm}
                />

                <Modal show={deleteTarget !== null} maxWidth="sm" onClose={() => setDeleteTarget(null)}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Delete Location</h3>
                                <p className="text-sm text-surface-500 mt-0.5">
                                    Are you sure you want to delete <strong>{deleteTarget?.location}</strong>? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 text-sm font-semibold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors">
                                Cancel
                            </button>
                            <button onClick={executeDelete}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            </AuthenticatedLayout>
        </>
    );
}
