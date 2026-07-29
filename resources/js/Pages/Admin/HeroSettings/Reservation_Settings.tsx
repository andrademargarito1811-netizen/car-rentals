import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';
import RichEditor from '@/Pages/Admin/Locations/RichEditor';

interface HeroImage {
    id: number;
    image_path: string;
    alt_text: string | null;
    caption: string | null;
    sort_order: number;
}

interface Settings {
    id: number;
    badge_text: string;
    headline: string;
    headline_highlight: string;
    subtitle: string | null;
    stat_pills: { icon: string; text: string }[] | null;
    is_active: boolean;
    booking_terms: string | null;
    hero_images: HeroImage[];
}

interface WhyBookItem {
    id: number;
    title: string;
    description: string | null;
    icon_svg: string | null;
    icon_path: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

interface Props {
    settings: Settings;
    whyBookItems: {
        data: WhyBookItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

const STAT_ICONS: Record<string, string> = {
    location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    car: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    support: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const ICON_OPTIONS = Object.keys(STAT_ICONS);

const SVG_PRESETS: { label: string; path: string }[] = [
    { label: 'Shield (Insured)', path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'Money (Best Prices)', path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Lightning (Quick Pickup)', path: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Credit Card (No Hidden Fees)', path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Star', path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { label: 'Support', path: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Location', path: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Car', path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
];

export default function ReservationSettings({ settings, whyBookItems }: Props) {
    const route = useRoute();
    const [activeTab, setActiveTab] = useState<'hero' | 'why-book' | 'terms'>('hero');

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showImageForm, setShowImageForm] = useState(false);
    const [whyPanelOpen, setWhyPanelOpen] = useState(false);
    const [editingWhyItem, setEditingWhyItem] = useState<WhyBookItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<WhyBookItem | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        badge_text: settings.badge_text,
        headline: settings.headline,
        headline_highlight: settings.headline_highlight,
        subtitle: settings.subtitle || '',
        stat_pills: settings.stat_pills || [
            { icon: 'location', text: '' },
            { icon: 'shield', text: '' },
            { icon: 'clock', text: '' },
        ],
        is_active: settings.is_active,
        booking_terms: settings.booking_terms || '',
    });

    const imageForm = useForm({
        image: null as File | null,
        alt_text: '',
        caption: '',
    });

    const whyForm = useForm({
        title: '',
        description: '',
        icon_svg: '',
        icon_path: '',
        sort_order: 0,
        is_active: true,
    });

    function addPill() {
        setData('stat_pills', [...(data.stat_pills || []), { icon: 'star', text: '' }]);
    }

    function removePill(index: number) {
        const pills = [...(data.stat_pills || [])];
        pills.splice(index, 1);
        setData('stat_pills', pills);
    }

    function updatePill(index: number, field: 'icon' | 'text', value: string) {
        const pills = [...(data.stat_pills || [])];
        pills[index] = { ...pills[index], [field]: value };
        setData('stat_pills', pills);
    }

    function submitSettings(e: React.FormEvent) {
        e.preventDefault();
        post(route('admin.reservation-settings.update'));
    }

    function submitImage(e: React.FormEvent) {
        e.preventDefault();
        imageForm.post(route('admin.reservation-settings.images.upload', {
            reservation_setting_id: settings.id,
        }), {
            onSuccess: () => {
                imageForm.reset();
                setImagePreview(null);
                const input = document.getElementById('image-upload-input') as HTMLInputElement;
                if (input) input.value = '';
                setShowImageForm(false);
            },
        });
    }

    function deleteImage(img: HeroImage) {
        if (confirm('Delete this image?')) {
            router.delete(route('admin.reservation-settings.images.delete', img.id));
        }
    }

    function openWhyCreate() {
        setEditingWhyItem(null);
        whyForm.reset();
        setWhyPanelOpen(true);
    }

    function openWhyEdit(item: WhyBookItem) {
        setEditingWhyItem(item);
        whyForm.setData({
            title: item.title,
            description: item.description || '',
            icon_svg: item.icon_svg || '',
            icon_path: item.icon_path || '',
            sort_order: item.sort_order,
            is_active: item.is_active,
        });
        setWhyPanelOpen(true);
    }

    function closeWhyPanel() {
        setWhyPanelOpen(false);
        setEditingWhyItem(null);
        whyForm.reset();
    }

    function submitWhyForm(e: React.FormEvent) {
        e.preventDefault();
        if (editingWhyItem) {
            whyForm.put(route('admin.why-book.update', editingWhyItem.id), {
                onSuccess: () => closeWhyPanel(),
            });
        } else {
            whyForm.post(route('admin.why-book.store'), {
                onSuccess: () => closeWhyPanel(),
            });
        }
    }

    function confirmDelete(item: WhyBookItem) {
        setDeletingItem(item);
        setShowDeleteModal(true);
    }

    function executeDelete() {
        if (deletingItem) {
            router.delete(route('admin.why-book.destroy', deletingItem.id), {
                onSuccess: () => setShowDeleteModal(false),
            });
        }
    }

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Reservation Settings" />
            <AuthenticatedLayout
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative">
                            <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Reservation Settings
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1">
                                Reservation Settings
                            </h1>
                            <p className="text-white/60 max-w-xl mt-1">
                                Manage the reservation page — hero header content, carousel images, stat pills, and Why Book With Us items.
                            </p>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">
                        {/* Main Tabs */}
                        <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
                            <button onClick={() => setActiveTab('hero')}
                                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'hero' ? 'bg-white dark:bg-surface-700 text-brand-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
                                Hero Content
                            </button>
                            <button onClick={() => setActiveTab('why-book')}
                                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'why-book' ? 'bg-white dark:bg-surface-700 text-brand-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
                                Why Book With Us ({whyBookItems.data.length})
                            </button>
                            <button onClick={() => setActiveTab('terms')}
                                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'terms' ? 'bg-white dark:bg-surface-700 text-brand-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>
                                Booking Terms & Conditions
                            </button>
                        </div>

                        {/* Hero Content Tab */}
                        {activeTab === 'hero' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                <div>
                                    <form onSubmit={submitSettings} className="space-y-6">
                                        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 space-y-5">
                                            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Hero Text Content</h3>
                                            <div>
                                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Badge Text</label>
                                                <input type="text" value={data.badge_text}
                                                    onChange={e => setData('badge_text', e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                                                {errors.badge_text && <p className="text-xs text-red-500 mt-1">{errors.badge_text}</p>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Headline</label>
                                                    <input type="text" value={data.headline}
                                                        onChange={e => setData('headline', e.target.value)}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                                                    {errors.headline && <p className="text-xs text-red-500 mt-1">{errors.headline}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Headline Highlight</label>
                                                    <input type="text" value={data.headline_highlight}
                                                        onChange={e => setData('headline_highlight', e.target.value)}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                                                    {errors.headline_highlight && <p className="text-xs text-red-500 mt-1">{errors.headline_highlight}</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Subtitle</label>
                                                <textarea rows={3} value={data.subtitle}
                                                    onChange={e => setData('subtitle', e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-bold text-surface-900 dark:text-white">Stat Pills</h3>
                                                <button type="button" onClick={addPill}
                                                    className="text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                    Add Pill
                                                </button>
                                            </div>
                                            {data.stat_pills?.map((pill, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                                                    <select value={pill.icon} onChange={e => updatePill(i, 'icon', e.target.value)}
                                                        className="px-2 py-1.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm">
                                                        {ICON_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                                                    </select>
                                                    <input type="text" value={pill.text} onChange={e => updatePill(i, 'text', e.target.value)}
                                                        placeholder="Pill text..."
                                                        className="flex-1 px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm" />
                                                    <button type="button" onClick={() => removePill(i)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={data.is_active}
                                                    onChange={e => setData('is_active', e.target.checked)}
                                                    className="w-4 h-4 rounded border-surface-300 text-accent-500 focus:ring-accent-400" />
                                                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Active</span>
                                            </label>
                                        </div>

                                        <div className="flex gap-3">
                                            <button type="submit" disabled={processing}
                                                className="px-6 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all disabled:opacity-50">
                                                {processing ? 'Saving...' : 'Save Settings'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div>
                                    <div className="space-y-6">
                                        <button onClick={() => setShowImageForm(true)}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold text-sm rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                            Add Image
                                        </button>

                                        {showImageForm && (
                                            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
                                                <form onSubmit={submitImage} className="space-y-5">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Image</label>
                                                        <div className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer ${imagePreview ? 'border-accent-400 bg-accent-50/30 dark:bg-accent-900/10' : 'border-surface-300 dark:border-surface-600 hover:border-accent-400 bg-surface-50/50 dark:bg-surface-800/50'}`}
                                                            onClick={() => document.getElementById('image-upload-input')?.click()}>
                                                            <input id="image-upload-input" type="file" accept="image/*" className="hidden"
                                                                onChange={e => {
                                                                    const file = e.target.files?.[0] || null;
                                                                    imageForm.setData('image', file);
                                                                    if (file) { const reader = new FileReader(); reader.onload = () => setImagePreview(reader.result as string); reader.readAsDataURL(file); }
                                                                }} />
                                                            {imagePreview ? (
                                                                <div className="relative w-full">
                                                                    <img src={imagePreview} alt="Preview" className="w-full h-48 rounded-xl object-cover" />
                                                                    <button type="button" onClick={e => { e.stopPropagation(); setImagePreview(null); imageForm.setData('image', null); document.getElementById('image-upload-input')!.value = ''; }}
                                                                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-10 h-10 text-surface-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                                                                    <p className="text-sm text-surface-500 font-medium">Click to upload</p>
                                                                    <p className="text-xs text-surface-400 mt-1">PNG, JPG, WebP up to 5MB</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Alt Text</label>
                                                            <input type="text" value={imageForm.data.alt_text}
                                                                onChange={e => imageForm.setData('alt_text', e.target.value)}
                                                                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Caption</label>
                                                            <input type="text" value={imageForm.data.caption}
                                                                onChange={e => imageForm.setData('caption', e.target.value)}
                                                                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 pt-1">
                                                        <button type="submit" disabled={!imageForm.data.image || imageForm.processing}
                                                            className="px-5 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold rounded-xl text-sm hover:from-accent-300 hover:to-accent-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                            {imageForm.processing ? (
                                                                <span className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                                    Uploading...
                                                                </span>
                                                            ) : 'Upload Image'}
                                                        </button>
                                                        <button type="button" onClick={() => { setShowImageForm(false); setImagePreview(null); imageForm.reset(); }}
                                                            className="px-5 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold rounded-xl text-sm hover:bg-surface-200 dark:hover:bg-surface-600 transition-all">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {settings.hero_images?.map(img => (
                                                <div key={img.id} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden group">
                                                    <div className="relative aspect-video">
                                                        <img src={img.image_path.startsWith('http') ? img.image_path : '/storage/' + img.image_path} alt={img.alt_text || ''} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                            <button onClick={() => deleteImage(img)}
                                                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 space-y-1">
                                                        {img.caption && <p className="text-sm font-semibold text-surface-900 dark:text-white">{img.caption}</p>}

                                                    </div>
                                                </div>
                                            ))}
                                            {(!settings.hero_images || settings.hero_images.length === 0) && (
                                                <div className="col-span-full text-center py-12 text-surface-400">
                                                    <p className="text-sm font-semibold">No hero images yet. Add one above.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Booking Terms Tab */}
                        {activeTab === 'terms' && (
                            <div className="max-w-2xl">
                                <form onSubmit={submitSettings} className="space-y-6">
                                    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 space-y-5">
                                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">Booking Terms & Conditions</h3>
                                        <RichEditor
                                            label="Terms & Conditions Content"
                                            value={data.booking_terms}
                                            onChange={(html) => setData('booking_terms', html)}
                                            placeholder="Enter booking terms and conditions here..."
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="submit" disabled={processing}
                                            className="px-6 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all disabled:opacity-50">
                                            {processing ? 'Saving...' : 'Save Settings'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Why Book With Us Tab */}
                        {activeTab === 'why-book' && (
                            <div className="space-y-6">
                                <button onClick={openWhyCreate}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold text-sm rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    Add Item
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {whyBookItems.data.map(item => (
                                        <div key={item.id} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 group hover:shadow-md transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                                                    {item.icon_svg ? (
                                                        <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon_svg} />
                                                        </svg>
                                                    ) : (
                                                        <span className="text-lg">✦</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-surface-900 dark:text-white">{item.title}</h3>
                                                    {item.description && (
                                                        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{item.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-surface-400">Order: {item.sort_order}</span>
                                                    <button onClick={() => openWhyEdit(item)}
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

                                {whyBookItems.data.length === 0 && (
                                    <div className="text-center py-16 text-surface-400">
                                        <p className="text-sm font-semibold">No items yet. Click "Add Item" to create one.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Why Book Slide Panel */}
                <SlidePanel show={whyPanelOpen} onClose={closeWhyPanel} title={editingWhyItem ? 'Edit Item' : 'Add Item'}>
                    <form onSubmit={submitWhyForm} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Title *</label>
                            <input type="text" value={whyForm.data.title} onChange={e => whyForm.setData('title', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                            {whyForm.errors.title && <p className="text-xs text-red-500 mt-1">{whyForm.errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Description</label>
                            <textarea rows={3} value={whyForm.data.description} onChange={e => whyForm.setData('description', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Icon (SVG Path)</label>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {SVG_PRESETS.map(preset => (
                                    <button key={preset.label} type="button" onClick={() => whyForm.setData('icon_svg', preset.path)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${whyForm.data.icon_svg === preset.path ? 'bg-accent-50 border-accent-300 text-accent-700' : 'bg-surface-50 border-surface-200 text-surface-500 hover:bg-surface-100'}`}>
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <textarea rows={2} value={whyForm.data.icon_svg} onChange={e => whyForm.setData('icon_svg', e.target.value)}
                                placeholder="Paste SVG path data..."
                                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                            {whyForm.data.icon_svg && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-surface-500">
                                    <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={whyForm.data.icon_svg} />
                                    </svg>
                                    <span>Preview</span>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Sort Order</label>
                                <input type="number" value={whyForm.data.sort_order} onChange={e => whyForm.setData('sort_order', parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={whyForm.data.is_active} onChange={e => whyForm.setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded border-surface-300 text-accent-500 focus:ring-accent-400" />
                                    <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Active</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={whyForm.processing}
                                className="px-6 py-2.5 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all disabled:opacity-50">
                                {whyForm.processing ? 'Saving...' : editingWhyItem ? 'Update Item' : 'Create Item'}
                            </button>
                            <button type="button" onClick={closeWhyPanel}
                                className="px-6 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-all">
                                Cancel
                            </button>
                        </div>
                    </form>
                </SlidePanel>

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
            </AuthenticatedLayout>
        </>
    );
}
