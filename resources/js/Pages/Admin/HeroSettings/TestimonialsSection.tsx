import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';

export interface TestimonialItem {
    id: number;
    name: string;
    role: string | null;
    content: string;
    avatar_url: string | null;
    rating: number;
    is_active: boolean;
    sort_order: number;
}

export default function TestimonialsSection({ items }: { items: TestimonialItem[] }) {
    const route = useRoute();
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<TestimonialItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        role: '',
        content: '',
        avatar_url: '',
        rating: 5,
        is_active: true,
        sort_order: 0,
    });

    function openCreate() {
        setEditingItem(null);
        reset();
        const maxSort = items.reduce((max, item) => Math.max(max, item.sort_order), 0);
        setData('sort_order', maxSort + 1);
        setPanelOpen(true);
    }

    function openEdit(item: TestimonialItem) {
        setEditingItem(item);
        setData({
            name: item.name,
            role: item.role || '',
            content: item.content,
            avatar_url: item.avatar_url || '',
            rating: item.rating,
            is_active: item.is_active,
            sort_order: item.sort_order,
        });
        setPanelOpen(true);
    }

    function closePanel() {
        setPanelOpen(false);
        setEditingItem(null);
        reset();
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (editingItem) {
            put(route('admin.testimonials.update', editingItem.id), {
                preserveScroll: true,
                onSuccess: () => closePanel(),
            });
        } else {
            post(route('admin.testimonials.store'), {
                preserveScroll: true,
                onSuccess: () => closePanel(),
            });
        }
    }

    function handleMoveUp(index: number) {
        if (index === 0) return;
        const ids = sorted.map(f => f.id);
        [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
        router.post(route('admin.testimonials.reorder'), { ids }, { preserveScroll: true });
    }

    function handleMoveDown(index: number) {
        if (index === sorted.length - 1) return;
        const ids = sorted.map(f => f.id);
        [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
        router.post(route('admin.testimonials.reorder'), { ids }, { preserveScroll: true });
    }

    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const activeCount = items.filter(t => t.is_active).length;
    const avgRating = items.length > 0 ? (items.reduce((s, t) => s + t.rating, 0) / items.length).toFixed(1) : '0.0';

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left side: CRUD */}
            <div className="flex-1 min-w-0 space-y-6">
                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        { label: 'Total', value: items.length, gradient: 'from-brand-500/20 to-brand-700/10', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { label: 'Active', value: activeCount, gradient: 'from-emerald-500/20 to-emerald-600/10', icon: 'M5 13l4 4L19 7' },
                        { label: 'Avg Rating', value: avgRating, gradient: 'from-amber-500/20 to-amber-600/10', icon: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' },
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
                        Add Testimonial
                    </button>
                </div>

                {/* Testimonial list */}
                {sorted.length === 0 ? (
                    <div className="text-center py-16 text-surface-400">
                        <p className="text-sm font-semibold">No testimonials yet. Click "Add Testimonial" to create one.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sorted.map((item, index) => (
                            <div key={item.id}
                                className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 group hover:shadow-md transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                        {item.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-surface-900 dark:text-white">{item.name}</span>
                                            {item.role && (
                                                <span className="text-xs text-surface-500 dark:text-surface-400">{item.role}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-0.5 mb-1">
                                            {[...Array(item.rating)].map((_, j) => (
                                                <svg key={j} className="w-3 h-3 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">&ldquo;{item.content}&rdquo;</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
                                    <span className={(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ' +
                                        (item.is_active
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400')
                                    )}>
                                        {item.is_active ? 'Active' : 'Inactive'}
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
                                        <button onClick={() => openEdit(item)}
                                            className="p-1.5 text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => { setDeletingItem(item); setShowDeleteModal(true); }}
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
                            <p className="text-[10px] text-surface-500 dark:text-surface-400">Testimonials as they appear on the site</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden bg-brand-900">
                        <div className="px-3 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Testimonials Preview</span>
                        </div>
                        <div className="p-4 space-y-2">
                            <div className="text-center mb-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-400/10 text-accent-400 text-[9px] font-semibold rounded-full border border-accent-400/20">
                                    Testimonials
                                </span>
                                <h4 className="text-sm font-bold text-white mt-1">What Our Customers Say</h4>
                            </div>
                            {sorted.filter(t => t.is_active).map((item, i) => (
                                <div key={item.id}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3"
                                    style={{ transitionDelay: `${i * 80}ms` }}
                                >
                                    <div className="flex gap-0.5 mb-2">
                                        {[...Array(item.rating)].map((_, j) => (
                                            <svg key={j} className="w-3 h-3 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-surface-400 leading-relaxed line-clamp-2">&ldquo;{item.content}&rdquo;</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-brand-900 font-bold text-[8px]">
                                            {item.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-white">{item.name}</p>
                                            {item.role && <p className="text-[8px] text-surface-500">{item.role}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {sorted.filter(t => t.is_active).length === 0 && (
                                <p className="text-[10px] text-surface-500 text-center py-6">No active testimonials to preview.</p>
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
            <SlidePanel show={panelOpen} onClose={closePanel} title={editingItem ? 'Edit Testimonial' : 'Add Testimonial'}>
                <form onSubmit={submitForm} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Name <span className="text-red-400">*</span>
                        </label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Sarah Johnson"
                            className="w-full h-11 px-4 text-sm bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 transition-colors" />
                        {errors.name && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Role
                        </label>
                        <input type="text" value={data.role} onChange={(e) => setData('role', e.target.value)}
                            placeholder="e.g. Business Traveler"
                            className="w-full h-11 px-4 text-sm bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 transition-colors" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Content <span className="text-red-400">*</span>
                        </label>
                        <textarea rows={4} value={data.content} onChange={(e) => setData('content', e.target.value)}
                            placeholder="Write the testimonial text here..."
                            className="w-full px-4 py-3 text-sm bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 transition-colors resize-none" />
                        {errors.content && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.content}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
                            Rating
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setData('rating', star)}
                                    className="p-1 transition-colors">
                                    <svg className={`w-6 h-6 ${star <= data.rating ? 'text-accent-400' : 'text-surface-300 dark:text-surface-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                            ))}
                            <span className="text-sm font-semibold text-surface-600 dark:text-surface-300 ml-2">{data.rating}/5</span>
                        </div>
                    </div>

                    <div className="bg-surface-50/70 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5 space-y-4">
                        <div className="border-b border-surface-100 dark:border-surface-700/40 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Status</span>
                                    <p className="text-[10px] text-surface-400 mt-0.5">Enable or disable this testimonial.</p>
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
                                {processing ? 'Saving...' : editingItem ? 'Update Testimonial' : 'Create Testimonial'}
                            </button>
                        </div>
                    </div>
                </form>
            </SlidePanel>

            {/* Delete Modal */}
            {showDeleteModal && deletingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Delete Testimonial</h3>
                        <p className="text-sm text-surface-500 mt-2">Are you sure you want to delete "{deletingItem.name}"? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold rounded-xl text-sm hover:bg-surface-200 dark:hover:bg-surface-600 transition-all">
                                Cancel
                            </button>
                            <button onClick={() => {
                                router.delete(route('admin.testimonials.destroy', deletingItem.id), {
                                    preserveScroll: true,
                                    onSuccess: () => setShowDeleteModal(false),
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
