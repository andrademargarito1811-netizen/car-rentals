import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';
import TaxForm from './TaxForm';

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
    calculation: string;
    category_id: number;
    category: TaxCategory;
    value_in: string;
    add_or_minus: boolean;
    rate: string;
    apply_always: boolean;
    location_id: number | null;
    location: VehicleLocation | null;
    vehicle_classes: VehicleClass[];
    is_active: boolean;
    created_at: string;
}

interface TaxIndexProps {
    taxes: {
        data: Tax[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    categories: TaxCategory[];
    locations: VehicleLocation[];
    vehicleClasses: VehicleClass[];
}

function categoryBadge(category: string) {
    const map: Record<string, string> = {
        Surcharge: 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
        Tax: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
        Discount: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
        Others: 'bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400',
    };
    return map[category] || map.Others;
}

function calculationBadge(calc: string) {
    return calc === 'Per Day'
        ? 'bg-purple-50 dark:bg-purple-900/25 text-purple-700 dark:text-purple-400'
        : 'bg-cyan-50 dark:bg-cyan-900/25 text-cyan-700 dark:text-cyan-400';
}

export default function TaxIndex({ taxes, categories, locations, vehicleClasses }: TaxIndexProps) {
    const route = useRoute();
    const [showPanel, setShowPanel] = useState(false);
    const [editingTax, setEditingTax] = useState<Tax | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTax, setDeletingTax] = useState<Tax | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        tax_desc: '',
        calculation: 'Per Day',
        category_id: '',
        value_in: 'Amount',
        add_or_minus: true,
        rate: '',
        apply_always: false,
        location_id: '',
        vehicle_classes: [] as string[],
        is_active: true,
    });

    function openCreate() {
        setEditingTax(null);
        reset();
        setShowPanel(true);
    }

    function openEdit(tax: Tax) {
        setEditingTax(tax);
        setData({
            tax_desc: tax.tax_desc,
            calculation: tax.calculation,
            category_id: tax.category_id.toString(),
            value_in: tax.value_in,
            add_or_minus: tax.add_or_minus,
            rate: tax.rate,
            apply_always: tax.apply_always,
            location_id: tax.location_id?.toString() ?? '',
            vehicle_classes: tax.vehicle_classes.map((vc) => vc.class_no),
            is_active: tax.is_active,
        });
        setShowPanel(true);
    }

    function handleCopyFrom(taxId: number) {
        const tax = taxes.data.find((t) => t.id === taxId);
        if (!tax) return;
        setData({
            tax_desc: `Copy of ${tax.tax_desc}`,
            calculation: tax.calculation,
            category_id: tax.category_id.toString(),
            value_in: tax.value_in,
            add_or_minus: tax.add_or_minus,
            rate: tax.rate,
            apply_always: tax.apply_always,
            location_id: tax.location_id?.toString() ?? '',
            vehicle_classes: tax.vehicle_classes.map((vc) => vc.class_no),
            is_active: tax.is_active,
        });
        setEditingTax(null);
        setShowPanel(true);
    }

    function closePanel() {
        setShowPanel(false);
        setEditingTax(null);
        reset();
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (editingTax) {
            put(route('admin.tax.update', editingTax.id), {
                onSuccess: () => closePanel(),
            });
        } else {
            post(route('admin.tax.store'), {
                onSuccess: () => closePanel(),
            });
        }
    }

    const activeCount = taxes.data.filter((t) => t.is_active).length;
    const surchargeCount = taxes.data.filter((t) => t.category?.name === 'Surcharge').length;
    const taxCount = taxes.data.filter((t) => t.category?.name === 'Tax').length;
    const discountCount = taxes.data.filter((t) => t.category?.name === 'Discount').length;

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Tax & Surcharges" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Tax & Surcharges' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Fee Management
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Tax & Surcharges
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    Configure taxes, surcharges, and discounts applied to rentals.
                                </p>
                            </div>
                            <button onClick={openCreate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-xl shadow-lg shadow-black/10 hover:bg-brand-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Tax
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        {/* Stats bar */}
                        <div className="grid gap-4 sm:grid-cols-4">
                            {[
                                { label: 'Total', value: taxes.data.length, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' },
                                { label: 'Active', value: activeCount, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M5 13l4 4L19 7' },
                                { label: 'Surcharges', value: surchargeCount, gradient: 'from-amber-500/20 to-amber-600/10', iconGradient: 'from-amber-500 to-amber-600', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
                                { label: 'Discounts', value: discountCount, gradient: 'from-blue-500/20 to-blue-600/10', iconGradient: 'from-blue-500 to-blue-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
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

                        {/* Tax table */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">Tax Rules</span>
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                            </div>

                            {taxes.data.length === 0 ? (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 p-12 sm:p-16 animate-fade-in-up">
                                    <div className="text-center max-w-sm mx-auto">
                                        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-5">
                                            <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">No tax rules found</h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Create your first tax or surcharge rule to get started.</p>
                                        <button onClick={openCreate}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 transition-all duration-200">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Create Tax
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-surface-100 dark:border-surface-700/60 bg-surface-50/70 dark:bg-brand-900/30">
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Description</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Category</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Calculation</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Rate</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Location</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Status</th>
                                                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-100 dark:divide-surface-700/40">
                                                {taxes.data.map((tax, i) => (
                                                    <tr key={tax.id} className={`animate-fade-in-up stagger-${(i % 6) + 1} group hover:bg-surface-50/50 dark:hover:bg-brand-900/20 transition-colors duration-150`}>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tax.is_active ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-600'}`} />
                                                                <div>
                                                                    <p className="font-semibold text-surface-900 dark:text-white">{tax.tax_desc}</p>
                                                                    <div className="flex items-center gap-1.5 mt-1">
                                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded ${tax.add_or_minus ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/25'}`}>
                                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                {tax.add_or_minus
                                                                                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                                                    : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                                                                }
                                                                            </svg>
                                                                            {tax.add_or_minus ? 'Add' : 'Minus'}
                                                                        </span>
                                                                        {tax.apply_always && (
                                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400">
                                                                                Always
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${categoryBadge(tax.category?.name || 'Others')}`}>
                                                                {tax.category?.name || '\u2014'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${calculationBadge(tax.calculation)}`}>
                                                                {tax.calculation}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="font-mono font-semibold text-surface-900 dark:text-white">
                                                                {tax.value_in === 'Percentage' ? `${tax.rate}%` : `$${parseFloat(tax.rate).toFixed(2)}`}
                                                            </span>
                                                            <span className="text-[10px] text-surface-400 dark:text-surface-500 ml-1">
                                                                {tax.value_in === 'Percentage' ? 'Percentage' : 'Amount'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-surface-600 dark:text-surface-400 text-xs">
                                                                {tax.location?.location || (
                                                                    <span className="text-surface-300 dark:text-surface-600 italic">All</span>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${
                                                                tax.is_active
                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                                                    : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400'
                                                            }`}>
                                                                {tax.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity duration-150">
                                                                <button onClick={() => openEdit(tax)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all duration-200"
                                                                    title="Edit tax">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                    </svg>
                                                                </button>
                                                                <button onClick={() => { setDeletingTax(tax); setShowDeleteModal(true); }}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                                                    title="Delete tax">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {taxes.links && taxes.links.length > 3 && (
                                        <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-surface-100 dark:border-surface-700/40">
                                            {taxes.links.map((link) => {
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
                            )}
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingTax && (
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
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">Delete Tax Rule</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                                Are you sure you want to delete
                            </p>
                            <p className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-6">
                                &ldquo;{deletingTax.tax_desc}&rdquo;?
                            </p>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mb-6">
                                This action cannot be undone. The tax rule will be permanently removed.
                            </p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700/60 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-all duration-200">
                                    Cancel
                                </button>
                                <button onClick={() => {
                                    router.delete(route('admin.tax.destroy', deletingTax.id), {
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
                title={editingTax ? 'Edit Tax' : 'Create Tax'}
            >
                <TaxForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    editingTax={editingTax}
                    categories={categories}
                    locations={locations}
                    vehicleClasses={vehicleClasses}
                    onSubmit={submitForm}
                    onCancel={closePanel}
                    taxList={taxes.data.map((t) => ({ id: t.id, tax_desc: t.tax_desc }))}
                    onCopyFrom={handleCopyFrom}
                />
            </SlidePanel>
        </>
    );
}
