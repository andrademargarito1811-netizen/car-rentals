import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';

interface VehicleClass {
    class_no: string;
    class_desc: string;
    grace_minutes: number;
    is_active: boolean;
}

interface ClassesIndexProps {
    classes: {
        data: VehicleClass[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

export default function VehicleClassesIndex({ classes }: ClassesIndexProps) {
    const route = useRoute();
    const [showPanel, setShowPanel] = useState(false);
    const [editingClass, setEditingClass] = useState<VehicleClass | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingClass, setDeletingClass] = useState<VehicleClass | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        class_no: '',
        class_desc: '',
        grace_minutes: 30,
        is_active: true,
    });

    function openCreate() {
        setEditingClass(null);
        reset();
        setShowPanel(true);
    }

    function openEdit(vc: VehicleClass) {
        setEditingClass(vc);
        setData({
            class_no: vc.class_no,
            class_desc: vc.class_desc,
            grace_minutes: vc.grace_minutes,
            is_active: vc.is_active,
        });
        setShowPanel(true);
    }

    function closePanel() {
        setShowPanel(false);
        setEditingClass(null);
        reset();
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (editingClass) {
            put(route('admin.vehicle-classes.update', editingClass.class_no), {
                onSuccess: () => closePanel(),
            });
        } else {
            post(route('admin.vehicle-classes.store'), {
                onSuccess: () => closePanel(),
            });
        }
    }

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Vehicle Classes" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Vehicle Classes' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Configuration
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Vehicle Classes
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    Manage vehicle classes and their grace period (turnaround time) between bookings.
                                </p>
                            </div>
                            <button onClick={openCreate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-xl shadow-lg shadow-black/10 hover:bg-brand-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Class
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-surface-100 dark:border-surface-700/60 bg-surface-50/70 dark:bg-brand-900/30">
                                            <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Description</th>
                                            <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Grace Period</th>
                                            <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Status</th>
                                            <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-100 dark:divide-surface-700/40">
                                        {classes.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-12 text-center">
                                                    <div className="max-w-sm mx-auto">
                                                        <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-3">
                                                            <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-semibold text-surface-900 dark:text-white mb-1">No vehicle classes</p>
                                                        <p className="text-xs text-surface-500 dark:text-surface-400">Create your first vehicle class to get started.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            classes.data.map((vc) => (
                                                <tr key={vc.class_no} className="group hover:bg-surface-50/50 dark:hover:bg-brand-900/20 transition-colors duration-150">
                                                    <td className="px-5 py-4">
                                                        <span className="text-surface-900 dark:text-white font-medium">{vc.class_desc}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {vc.grace_minutes} min
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${
                                                            vc.is_active
                                                                ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                                                : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400'
                                                        }`}>
                                                            {vc.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => openEdit(vc)}
                                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all duration-200"
                                                                title="Edit">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                </svg>
                                                            </button>
                                                            <button onClick={() => { setDeletingClass(vc); setShowDeleteModal(true); }}
                                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                                                title="Delete">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {classes.links && classes.links.length > 3 && (
                                <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-surface-100 dark:border-surface-700/40">
                                    {classes.links.map((link) => {
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
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            {showDeleteModal && deletingClass && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-white dark:bg-brand-800 rounded-2xl shadow-2xl shadow-black/20 border border-surface-100 dark:border-surface-700/60 animate-fade-in-up overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="relative p-6 sm:p-7 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">Delete Class</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                                Are you sure you want to delete
                            </p>
                            <p className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-6">
                                &ldquo;{deletingClass.class_desc}&rdquo;?
                            </p>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mb-6">
                                This action cannot be undone.
                            </p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700/60 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-all duration-200">
                                    Cancel
                                </button>
                                <button onClick={() => {
                                    router.delete(route('admin.vehicle-classes.destroy', deletingClass.class_no), {
                                        onSuccess: () => setShowDeleteModal(false),
                                        preserveScroll: true,
                                    });
                                }}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SlidePanel
                show={showPanel}
                onClose={closePanel}
                title={editingClass ? 'Edit Class' : 'Create Class'}
            >
                <form onSubmit={submitForm} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.class_desc}
                            onChange={(e) => setData('class_desc', e.target.value)}
                            placeholder="e.g. Economy"
                            className="w-full h-11 px-4 text-sm bg-white dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors duration-150"
                        />
                        {errors.class_desc && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.class_desc}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Grace Period (minutes) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="5"
                                value={data.grace_minutes}
                                onChange={(e) => setData('grace_minutes', parseInt(e.target.value) || 0)}
                                className="w-full h-11 px-4 pr-16 text-sm bg-white dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors duration-150"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-surface-400 dark:text-surface-500 pointer-events-none">
                                min
                            </span>
                        </div>
                        <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">
                            Turnaround time between bookings for this vehicle class.
                        </p>
                        {errors.grace_minutes && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.grace_minutes}</p>}
                    </div>

                    <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Status</span>
                                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Enable or disable this vehicle class.</p>
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

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-surface-100 dark:border-surface-700/60">
                        <p className="text-[11px] text-surface-400 dark:text-surface-500">
                            Fields marked with <span className="text-red-400">*</span> are required.
                        </p>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={closePanel}
                                className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-surface-500 dark:text-surface-400 bg-white/80 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-xl hover:bg-white dark:hover:bg-brand-900/80 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600 active:scale-[0.97] transition-all duration-150 shrink-0 overflow-hidden">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </button>
                            <button type="submit" disabled={processing}
                                className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 shrink-0 overflow-hidden">
                                {processing ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {editingClass ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        {editingClass ? 'Update Class' : 'Create Class'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </SlidePanel>
        </>
    );
}
