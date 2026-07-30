import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';
import { cn } from '@/lib/utils';

export interface FaqItem {
    id: number;
    question: string;
    answer: string;
    category: string;
    popular: boolean;
    is_active: boolean;
    sort_order: number;
}

const categories = ['General', 'Requirements', 'Insurance', 'Pickup & Return', 'Policies', 'Reservations'];

export default function FaqSection({ items }: { items: FaqItem[] }) {
    const route = useRoute();
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingFaq, setDeletingFaq] = useState<FaqItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        question: '',
        answer: '',
        category: 'General',
        popular: false,
        is_active: true,
        sort_order: 0,
        _redirect: 'admin.hero-settings',
    });

    function openCreate() {
        setEditingFaq(null);
        reset();
        const maxSort = items.reduce((max, item) => Math.max(max, item.sort_order), 0);
        setData('sort_order', maxSort + 1);
        setPanelOpen(true);
    }

    function openEdit(faq: FaqItem) {
        setEditingFaq(faq);
        setData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            popular: faq.popular,
            is_active: faq.is_active,
            sort_order: faq.sort_order,
            _redirect: 'admin.hero-settings',
        });
        setPanelOpen(true);
    }

    function closePanel() {
        setPanelOpen(false);
        setEditingFaq(null);
        reset();
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (editingFaq) {
            put(route('admin.faqs.update', editingFaq.id), {
                preserveScroll: true,
                onSuccess: () => closePanel(),
            });
        } else {
            post(route('admin.faqs.store'), {
                preserveScroll: true,
                onSuccess: () => closePanel(),
            });
        }
    }

    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const activeCount = items.filter(f => f.is_active).length;
    const popularCount = items.filter(f => f.popular).length;

    function handleMoveUp(index: number) {
        if (index === 0) return;
        const ids = sorted.map(f => f.id);
        [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
        router.post(route('admin.faqs.reorder'), { ids }, { preserveScroll: true });
    }

    function handleMoveDown(index: number) {
        if (index === sorted.length - 1) return;
        const ids = sorted.map(f => f.id);
        [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
        router.post(route('admin.faqs.reorder'), { ids }, { preserveScroll: true });
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left side: CRUD */}
            <div className="flex-1 min-w-0 space-y-6">
                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        { label: 'Total', value: items.length, gradient: 'from-brand-500/20 to-brand-700/10', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { label: 'Active', value: activeCount, gradient: 'from-emerald-500/20 to-emerald-600/10', icon: 'M5 13l4 4L19 7' },
                        { label: 'Popular', value: popularCount, gradient: 'from-amber-500/20 to-amber-600/10', icon: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' },
                    ].map((stat) => (
                        <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/60 shadow-sm p-4">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30`} />
                            <div className="relative flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{stat.label}</p>
                                    <p className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add button */}
                <div className="flex items-center gap-3">
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold text-sm rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add FAQ
                    </button>
                </div>

                {/* FAQ list */}
                {sorted.length === 0 ? (
                    <div className="text-center py-16 text-surface-400">
                        <p className="text-sm font-semibold">No FAQs yet. Click "Add FAQ" to create one.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sorted.map((faq, index) => (
                            <div key={faq.id}
                                className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 group hover:shadow-md transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{faq.category}</span>
                                            {faq.popular && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400">
                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-surface-900 dark:text-white">{faq.question}</h3>
                                        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{faq.answer}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
                                    <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                        faq.is_active
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    )}>
                                        {faq.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {index > 0 && (
                                            <button onClick={() => handleMoveUp(index)}
                                                className="p-1.5 text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                            </button>
                                        )}
                                        {index < sorted.length - 1 && (
                                            <button onClick={() => handleMoveDown(index)}
                                                className="p-1.5 text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        )}
                                        <button onClick={() => openEdit(faq)}
                                            className="p-1.5 text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => { setDeletingFaq(faq); setShowDeleteModal(true); }}
                                            className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right side: Live Preview */}
            <div className="lg:w-80 xl:w-96 shrink-0">
                <div className="lg:sticky lg:top-6 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-sm shrink-0">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Live Preview</h3>
                            <p className="text-[10px] text-surface-500 dark:text-surface-400">FAQ accordion as it appears on the homepage</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden bg-brand-900">
                        <div className="px-3 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">FAQ Preview</span>
                        </div>
                        <div className="p-4 space-y-2">
                            <div className="text-center mb-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-400/10 text-accent-400 text-[9px] font-semibold rounded-full border border-accent-400/20">
                                    FAQ
                                </span>
                                <h4 className="text-sm font-bold text-white mt-1">Frequently Asked Questions</h4>
                            </div>
                            {sorted.filter(f => f.is_active).map((faq, i) => (
                                <div key={faq.id}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
                                    style={{ transitionDelay: `${i * 80}ms` }}
                                >
                                    <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer">
                                        <span className="text-[11px] font-semibold text-white truncate pr-2">{faq.question}</span>
                                        <svg className="w-3 h-3 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    <div className="px-3 pb-2.5">
                                        <p className="text-[10px] text-surface-400 leading-relaxed line-clamp-2">{faq.answer}</p>
                                    </div>
                                </div>
                            ))}
                            {sorted.filter(f => f.is_active).length === 0 && (
                                <p className="text-[10px] text-surface-500 text-center py-6">No active FAQs to preview.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-surface-400 bg-surface-50 dark:bg-surface-800/30 rounded-xl px-3 py-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Changes reflect instantly
                    </div>
                </div>
            </div>

            {/* Slide Panel */}
            <SlidePanel show={panelOpen} onClose={closePanel} title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}>
                <form onSubmit={submitForm} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Question <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.question}
                            onChange={(e) => setData('question', e.target.value)}
                            placeholder="e.g. What do I need to rent a car?"
                            className="w-full h-11 px-4 text-sm bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 transition-colors"
                        />
                        {errors.question && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.question}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Answer <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={data.answer}
                            onChange={(e) => setData('answer', e.target.value)}
                            placeholder="Write the answer here..."
                            className="w-full px-4 py-3 text-sm bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 transition-colors resize-none"
                        />
                        {errors.answer && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.answer}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Category <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                className="w-full h-11 px-4 text-sm bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 appearance-none cursor-pointer pr-10"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-surface-50/70 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Popular</span>
                                <p className="text-[10px] text-surface-400 mt-0.5">Mark as a frequently asked question.</p>
                            </div>
                            <button type="button" role="switch" aria-checked={data.popular}
                                onClick={() => setData('popular', !data.popular)}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${
                                    data.popular ? 'bg-amber-500' : 'bg-surface-200 dark:bg-surface-600'
                                }`}>
                                <span className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${data.popular ? 'translate-x-5' : 'translate-x-0'}`}>
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
                                    <p className="text-[10px] text-surface-400 mt-0.5">Enable or disable this FAQ entry.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button type="button" role="switch" aria-checked={data.is_active}
                                        onClick={() => setData('is_active', !data.is_active)}
                                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${
                                            data.is_active ? 'bg-emerald-500' : 'bg-surface-200 dark:bg-surface-600'
                                        }`}>
                                        <span className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`}>
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
                                    <span className={`text-xs font-semibold min-w-[4ch] ${data.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400'}`}>
                                        {data.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-surface-100 dark:border-surface-700/60">
                        <p className="text-[11px] text-surface-400">
                            Fields marked with <span className="text-red-400">*</span> are required.
                        </p>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={closePanel}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-surface-500 dark:text-surface-400 bg-white/80 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl hover:bg-white hover:text-surface-700 transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold text-sm rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all disabled:opacity-50">
                                {processing ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Create FAQ'}
                            </button>
                        </div>
                    </div>
                </form>
            </SlidePanel>

            {/* Delete Modal */}
            {showDeleteModal && deletingFaq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Delete FAQ</h3>
                        <p className="text-sm text-surface-500 mt-2">Are you sure you want to delete &ldquo;{deletingFaq.question}&rdquo;? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold rounded-xl text-sm hover:bg-surface-200 dark:hover:bg-surface-600 transition-all">
                                Cancel
                            </button>
                            <button onClick={() => {
                                router.delete(route('admin.faqs.destroy', deletingFaq.id), {
                                    data: { _redirect: 'admin.hero-settings' },
                                    onSuccess: () => setShowDeleteModal(false),
                                    preserveScroll: true,
                                });
                            }}
                                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-all">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
