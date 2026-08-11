import { useState, useRef, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Search, X } from 'lucide-react';
import SlidePanel from '@/Components/SlidePanel';
import { cn } from '@/lib/utils';
import { DynamicIcon as BaseDynamicIcon, CURIATED_ICONS } from '@/lib/icons';

export interface WhyChooseUsItem {
    id: number;
    title: string;
    description: string | null;
    icon_svg: string | null;
    sort_order: number;
    is_active: boolean;
}

function DynamicIcon({ name, className }: { name: string | null; className?: string }) {
    return <BaseDynamicIcon name={name} className={className} fallback={<span className={cn('text-lg', className)}>✦</span>} />;
}

export default function WhyChooseUsSection({ items, heading, subheading, onHeadingChange, onSubheadingChange }: {
    items: WhyChooseUsItem[];
    heading: string;
    subheading: string;
    onHeadingChange: (v: string) => void;
    onSubheadingChange: (v: string) => void;
}) {
    const route = useRoute();
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WhyChooseUsItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<WhyChooseUsItem | null>(null);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [pendingClose, setPendingClose] = useState(false);
    const [reorderMode, setReorderMode] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const formRef = useRef<HTMLFormElement>(null);

    const form = useForm({
        title: '',
        description: '',
        icon_svg: '',
        sort_order: 0,
        is_active: true,
    });

    const isDirty = form.data.title !== '' || form.data.description !== '' || form.data.icon_svg !== '';

    const filteredIcons = useMemo(() => {
        if (!iconSearch) return CURIATED_ICONS;
        const q = iconSearch.toLowerCase();
        return CURIATED_ICONS.filter(icon =>
            icon.name.toLowerCase().includes(q) || icon.label.toLowerCase().includes(q)
        );
    }, [iconSearch]);

    function handleFormKeyDown(e: React.KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            formRef.current?.requestSubmit();
        }
        if (e.key === 'Escape') {
            closePanel();
        }
    }

    function openCreate() {
        setEditingItem(null);
        form.reset();
        const maxSort = items.reduce((max, item) => Math.max(max, item.sort_order), 0);
        form.setData('sort_order', maxSort + 1);
        setPanelOpen(true);
    }

    function openEdit(item: WhyChooseUsItem) {
        setEditingItem(item);
        form.setData({
            title: item.title,
            description: item.description || '',
            icon_svg: item.icon_svg || '',
            sort_order: item.sort_order,
            is_active: item.is_active,
        });
        setPanelOpen(true);
    }

    function closePanel() {
        if (isDirty && !editingItem) {
            setShowUnsavedWarning(true);
            setPendingClose(true);
            return;
        }
        doClosePanel();
    }

    function doClosePanel() {
        setPanelOpen(false);
        setEditingItem(null);
        setShowUnsavedWarning(false);
        setPendingClose(false);
        setIconSearch('');
        form.reset();
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (editingItem) {
            form.put(route('admin.why-choose-us.update', editingItem.id), {
                preserveScroll: true,
                onSuccess: () => doClosePanel(),
            });
        } else {
            form.post(route('admin.why-choose-us.store'), {
                preserveScroll: true,
                onSuccess: () => doClosePanel(),
            });
        }
    }

    function confirmDelete(item: WhyChooseUsItem) {
        setDeletingItem(item);
        setShowDeleteModal(true);
    }

    function executeDelete() {
        if (deletingItem) {
            router.delete(route('admin.why-choose-us.destroy', deletingItem.id), {
                preserveScroll: true,
                onSuccess: () => setShowDeleteModal(false),
            });
        }
    }

    function moveItem(index: number, direction: 'up' | 'down') {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sorted.length) return;
        const current = sorted[index];
        const target = sorted[targetIndex];
        router.put(route('admin.why-choose-us.update', current.id), {
            sort_order: target.sort_order,
            title: current.title,
            description: current.description,
            icon_svg: current.icon_svg,
            is_active: current.is_active,
        }, { preserveScroll: true });
        router.put(route('admin.why-choose-us.update', target.id), {
            sort_order: current.sort_order,
            title: target.title,
            description: target.description,
            icon_svg: target.icon_svg,
            is_active: target.is_active,
        }, { preserveScroll: true });
    }

    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left side: Settings + CRUD */}
            <div className="flex-1 min-w-0 space-y-6">
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white">Section Text</h3>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Heading</label>
                        <input type="text" value={heading} onChange={e => onHeadingChange(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Subheading</label>
                        <textarea rows={2} value={subheading} onChange={e => onSubheadingChange(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold text-sm rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add Item
                    </button>
                    {sorted.length > 1 && (
                        <button onClick={() => setReorderMode(!reorderMode)}
                            className={cn(
                                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all',
                                reorderMode
                                    ? 'bg-accent-50 border-accent-300 text-accent-700'
                                    : 'bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 hover:bg-surface-100'
                            )}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            {reorderMode ? 'Done' : 'Reorder'}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sorted.map((item, index) => (
                        <div key={item.id} className={cn(
                            'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 group hover:shadow-md transition-all',
                            reorderMode && 'ring-2 ring-accent-300 dark:ring-accent-600'
                        )}>
                            {reorderMode && (
                                <div className="flex items-center justify-center gap-2 mb-3 pb-2 border-b border-surface-100 dark:border-surface-700">
                                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0}
                                        className="p-1 rounded-md text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 disabled:opacity-30 disabled:pointer-events-none transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                    </button>
                                    <span className="text-xs font-bold text-surface-400">#{index + 1}</span>
                                    <button onClick={() => moveItem(index, 'down')} disabled={index === sorted.length - 1}
                                        className="p-1 rounded-md text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 disabled:opacity-30 disabled:pointer-events-none transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                </div>
                            )}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                                    <DynamicIcon name={item.icon_svg} className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-surface-900 dark:text-white">{item.title}</h3>
                                    {item.description && (
                                        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{item.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
                                <span className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                    item.is_active
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                )}>
                                    {item.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEdit(item)}
                                        className="p-1.5 text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => confirmDelete(item)}
                                        className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {sorted.length === 0 && (
                    <div className="text-center py-16 text-surface-400">
                        <p className="text-sm font-semibold">No items yet. Click "Add Item" to create one.</p>
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
                            <p className="text-[10px] text-surface-500 dark:text-surface-400">Why Choose Us as it appears on the homepage</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden bg-brand-900">
                        <div className="px-3 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Section Preview</span>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-400/10 text-accent-400 text-[9px] font-semibold rounded-full border border-accent-400/20 mb-2">
                                    Why Choose Us
                                </span>
                                <h4 className="text-sm font-bold text-white">{heading || 'Built for a Better Rental Experience'}</h4>
                                <p className="text-[10px] text-surface-400 mt-0.5">{subheading || 'We go the extra mile to make every rental smooth.'}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {sorted.filter(f => f.is_active).map((item, i) => (
                                    <div key={item.id}
                                        className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3"
                                        style={{ transitionDelay: `${i * 80}ms` }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-400/20 shrink-0">
                                                <DynamicIcon name={item.icon_svg} className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="text-xs font-bold text-white">{item.title}</h5>
                                                {item.description && (
                                                    <p className="text-[10px] text-surface-400 mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sorted.filter(f => f.is_active).length === 0 && (
                                    <p className="text-[10px] text-surface-500 text-center py-6">No active items to preview.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-surface-400 bg-surface-50 dark:bg-surface-800/30 rounded-xl px-3 py-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Changes reflect instantly
                    </div>
                </div>
            </div>

            {/* Slide Panel */}
            <SlidePanel show={panelOpen} onClose={closePanel} title={editingItem ? 'Edit Item' : 'Add Item'}>
                <form ref={formRef} onSubmit={submitForm} onKeyDown={handleFormKeyDown} className="space-y-5">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300">Title *</label>
                            <span className="text-[10px] text-surface-400">
                                <kbd className="px-1 py-0.5 rounded bg-surface-100 dark:bg-surface-700 font-mono text-[9px]">Ctrl+Enter</kbd> to save
                            </span>
                        </div>
                        <input type="text" value={form.data.title} onChange={e => form.setData('title', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                        {form.errors.title && <p className="text-xs text-red-500 mt-1">{form.errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Description</label>
                        <textarea rows={3} value={form.data.description} onChange={e => form.setData('description', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Icon</label>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                            <input type="text" value={iconSearch} onChange={e => setIconSearch(e.target.value)}
                                placeholder="Search icons..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                        </div>

                        {/* Icon grid */}
                        <div className="grid grid-cols-5 gap-1.5 mb-3 max-h-48 overflow-y-auto">
                            {filteredIcons.map(icon => (
                                <button key={icon.name} type="button" onClick={() => {
                                    form.setData('icon_svg', icon.name);
                                    setIconSearch('');
                                }}
                                    className={cn(
                                        'flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all',
                                        form.data.icon_svg === icon.name
                                            ? 'bg-accent-50 border-accent-300 ring-1 ring-accent-300'
                                            : 'bg-surface-50 dark:bg-surface-700/50 border-surface-200 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700'
                                    )} title={icon.label}>
                                    <DynamicIcon name={icon.name} className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                                    <span className="text-[6px] text-surface-500 dark:text-surface-400 leading-tight text-center truncate w-full">{icon.label}</span>
                                </button>
                            ))}
                            {filteredIcons.length === 0 && (
                                <div className="col-span-5 text-center py-4 text-[10px] text-surface-400">No icons found</div>
                            )}
                        </div>

                        {/* Selected icon preview + clear */}
                        {form.data.icon_svg && (
                            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600">
                                <DynamicIcon name={form.data.icon_svg} className="w-5 h-5 text-brand-500" />
                                <span className="text-xs font-semibold text-surface-600 dark:text-surface-300 flex-1">{form.data.icon_svg}</span>
                                <button type="button" onClick={() => form.setData('icon_svg', '')}
                                    className="p-1 rounded-md text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Custom SVG path */}
                        <div className="relative">
                            <textarea rows={2} value={/^M[\s\d]/.test(form.data.icon_svg ?? '') ? form.data.icon_svg : ''} onChange={e => form.setData('icon_svg', e.target.value)}
                                placeholder="Or paste custom SVG path data..."
                                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                            <span className="absolute right-2 bottom-2 text-[8px] text-surface-400">for custom SVG paths</span>
                        </div>
                    </div>
                    <div className="flex items-center pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.data.is_active} onChange={e => form.setData('is_active', e.target.checked)}
                                className="w-4 h-4 rounded border-surface-300 text-accent-500 focus:ring-accent-400" />
                            <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Active</span>
                        </label>
                    </div>

                    {/* Inline Preview */}
                    {form.data.title && (
                        <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden bg-brand-900">
                            <div className="px-3 py-1.5 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700/60">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-surface-500">Item Preview</span>
                            </div>
                            <div className="p-3 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-400/20 shrink-0">
                                    <DynamicIcon name={form.data.icon_svg} className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-white">{form.data.title || 'Item Title'}</h5>
                                    {form.data.description && (
                                        <p className="text-[10px] text-surface-400 mt-0.5 leading-relaxed line-clamp-2">{form.data.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={form.processing}
                            className="px-6 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all disabled:opacity-50">
                            {form.processing ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                        </button>
                        <button type="button" onClick={closePanel}
                            className="px-6 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </SlidePanel>

            {/* Unsaved Changes Warning */}
            {showUnsavedWarning && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUnsavedWarning(false)} />
                    <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Discard Changes?</h3>
                        <p className="text-sm text-surface-500 mt-2">You have unsaved changes. Are you sure you want to close?</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowUnsavedWarning(false)}
                                className="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold rounded-xl text-sm hover:bg-surface-200 dark:hover:bg-surface-600 transition-all">
                                Keep Editing
                            </button>
                            <button onClick={doClosePanel}
                                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-all">
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Delete Item</h3>
                        <p className="text-sm text-surface-500 mt-2">Are you sure you want to delete "{deletingItem.title}"? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold rounded-xl text-sm hover:bg-surface-200 dark:hover:bg-surface-600 transition-all">
                                Cancel
                            </button>
                            <button onClick={executeDelete}
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
