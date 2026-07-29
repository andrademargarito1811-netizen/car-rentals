import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';

interface Faq {
    id: number;
    question: string;
    answer: string;
    category: string;
    popular: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

interface FaqIndexProps {
    faqs: {
        data: Faq[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

const categories = ['General', 'Requirements', 'Insurance', 'Pickup & Return', 'Policies', 'Reservations'];

export default function FaqIndex({ faqs }: FaqIndexProps) {
    const route = useRoute();
    const [showPanel, setShowPanel] = useState(false);
    const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingFaq, setDeletingFaq] = useState<Faq | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        question: '',
        answer: '',
        category: 'General',
        popular: false,
        is_active: true,
        sort_order: 0,
    });

    function openCreate() {
        setEditingFaq(null);
        reset();
        setShowPanel(true);
    }

    function openEdit(faq: Faq) {
        setEditingFaq(faq);
        setData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            popular: faq.popular,
            is_active: faq.is_active,
            sort_order: faq.sort_order,
        });
        setShowPanel(true);
    }

    function closePanel() {
        setShowPanel(false);
        setEditingFaq(null);
        reset();
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (editingFaq) {
            put(route('admin.faqs.update', editingFaq.id), {
                onSuccess: () => closePanel(),
            });
        } else {
            post(route('admin.faqs.store'), {
                onSuccess: () => closePanel(),
            });
        }
    }

    const activeCount = faqs.data.filter((f) => f.is_active).length;
    const popularCount = faqs.data.filter((f) => f.popular).length;

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="FAQ Management" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'FAQ Management' }]}
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
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    FAQ Management
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    Manage frequently asked questions displayed on the homepage.
                                </p>
                            </div>
                            <button onClick={openCreate}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-xl shadow-lg shadow-black/10 hover:bg-brand-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add FAQ
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        {/* Stats bar */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Total', value: faqs.data.length, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Active', value: activeCount, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M5 13l4 4L19 7' },
                                { label: 'Popular', value: popularCount, gradient: 'from-amber-500/20 to-amber-600/10', iconGradient: 'from-amber-500 to-amber-600', icon: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' },
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

                        {/* FAQ table */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">FAQ Entries</span>
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                            </div>

                            {faqs.data.length === 0 ? (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 p-12 sm:p-16 animate-fade-in-up">
                                    <div className="text-center max-w-sm mx-auto">
                                        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-5">
                                            <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">No FAQs found</h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Create your first FAQ entry to get started.</p>
                                        <button onClick={openCreate}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 transition-all duration-200">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Create FAQ
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-surface-100 dark:border-surface-700/60 bg-surface-50/70 dark:bg-brand-900/30">
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Order</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Question</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Category</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Status</th>
                                                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-100 dark:divide-surface-700/40">
                                                {faqs.data.map((faq, i) => (
                                                    <tr key={faq.id} className={`animate-fade-in-up stagger-${(i % 6) + 1} group hover:bg-surface-50/50 dark:hover:bg-brand-900/20 transition-colors duration-150`}>
                                                        <td className="px-5 py-4">
                                                            <span className="text-surface-500 dark:text-surface-400 text-xs font-mono">{faq.sort_order}</span>
                                                        </td>
                                                        <td className="px-5 py-4 max-w-md">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${faq.is_active ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-600'}`} />
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-surface-900 dark:text-white truncate">{faq.question}</p>
                                                                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-1">{faq.answer}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400">
                                                                {faq.category}
                                                            </span>
                                                            {faq.popular && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400 ml-1">
                                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    Popular
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${
                                                                faq.is_active
                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                                                    : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400'
                                                            }`}>
                                                                {faq.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity duration-150">
                                                                <button onClick={() => openEdit(faq)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all duration-200"
                                                                    title="Edit FAQ">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                    </svg>
                                                                </button>
                                                                <button onClick={() => { setDeletingFaq(faq); setShowDeleteModal(true); }}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                                                    title="Delete FAQ">
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
                                    {faqs.links && faqs.links.length > 3 && (
                                        <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-surface-100 dark:border-surface-700/40">
                                            {faqs.links.map((link) => {
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
            {showDeleteModal && deletingFaq && (
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
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">Delete FAQ</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                                Are you sure you want to delete
                            </p>
                            <p className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-6">
                                &ldquo;{deletingFaq.question}&rdquo;?
                            </p>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mb-6">
                                This action cannot be undone. The FAQ will be permanently removed.
                            </p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700/60 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-all duration-200">
                                    Cancel
                                </button>
                                <button onClick={() => {
                                    router.delete(route('admin.faqs.destroy', deletingFaq.id), {
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
                title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}
            >
                <form onSubmit={submitForm} className="space-y-6">
                    {/* Question */}
                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Question <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.question}
                            onChange={(e) => setData('question', e.target.value)}
                            placeholder="e.g. What do I need to rent a car?"
                            className="w-full h-11 px-4 text-sm bg-white dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors duration-150"
                        />
                        {errors.question && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.question}</p>}
                    </div>

                    {/* Answer */}
                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Answer <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={data.answer}
                            onChange={(e) => setData('answer', e.target.value)}
                            placeholder="Write the answer here..."
                            className="w-full px-4 py-3 text-sm bg-white dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors duration-150 resize-none"
                        />
                        {errors.answer && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.answer}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Category <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                className="w-full h-11 px-4 text-sm bg-white dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors duration-150 appearance-none cursor-pointer pr-10"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </div>
                        {errors.category && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.category}</p>}
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Sort Order
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                            className="w-full h-11 px-4 text-sm bg-white dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors duration-150"
                        />
                        <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">Lower numbers appear first.</p>
                    </div>

                    {/* Toggles */}
                    <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Popular</span>
                                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Mark as a frequently asked question.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={data.popular}
                                onClick={() => setData('popular', !data.popular)}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-brand-800 ${
                                    data.popular ? 'bg-amber-500' : 'bg-surface-200 dark:bg-surface-600'
                                }`}
                            >
                                <span className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${data.popular ? 'translate-x-5' : 'translate-x-0'}`}>
                                    {data.popular ? (
                                        <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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

                        <div className="border-t border-surface-100 dark:border-surface-700/40 pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Status</span>
                                    <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Enable or disable this FAQ entry.</p>
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

                    {/* Submit footer */}
                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-surface-100 dark:border-surface-700/60">
                        <p className="text-[11px] text-surface-400 dark:text-surface-500">
                            Fields marked with <span className="text-red-400">*</span> are required.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={closePanel}
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
                                        {editingFaq ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        {editingFaq ? 'Update FAQ' : 'Create FAQ'}
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
