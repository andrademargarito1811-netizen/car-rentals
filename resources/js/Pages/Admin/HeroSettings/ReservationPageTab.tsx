import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import SlidePanel from '@/Components/SlidePanel';
import { cn } from '@/lib/utils';

interface HeroImage {
    id: number;
    image_path: string;
    alt_text: string | null;
    caption: string | null;
    sort_order: number;
}

interface WhyBookItem {
    id: number;
    title: string;
    description: string | null;
    icon_svg: string | null;
    icon_path: string | null;
    sort_order: number;
    is_active: boolean;
}

interface ReservationSettings {
    id: number;
    badge_text: string;
    badge_icon?: string;
    badge_enabled?: boolean;
    headline: string;
    headline_highlight: string;
    subtitle: string | null;
    stat_pills: { icon: string; text: string }[] | null;
    is_active: boolean;
    hero_images: HeroImage[];
}

const BADGE_ICON_OPTIONS: Record<string, string> = {
    tag: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z',
    percent: 'M14.25 7.756a4.5 4.5 0 11-8.25-3.568M3 21l18-18M21 14.25a4.5 4.5 0 00-8.25 3.568M9 21l3-3m3-3l3-3',
    dollar: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
};

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

export default function ReservationPageTab({ settings, whyBookItems = [] }: { settings: ReservationSettings; whyBookItems?: WhyBookItem[] }) {
    const [activeSubTab, setActiveSubTab] = useState<'hero' | 'why-book'>('hero');
    const [showPreview, setShowPreview] = useState(true);
    const [showImageForm, setShowImageForm] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editingImage, setEditingImage] = useState<HeroImage | null>(null);
    const [confirmDeleteImage, setConfirmDeleteImage] = useState<HeroImage | null>(null);
    const [previewSlide, setPreviewSlide] = useState(0);

    const [whyPanelOpen, setWhyPanelOpen] = useState(false);
    const [editingWhyItem, setEditingWhyItem] = useState<WhyBookItem | null>(null);
    const [showDeleteWhyModal, setShowDeleteWhyModal] = useState(false);
    const [deletingWhyItem, setDeletingWhyItem] = useState<WhyBookItem | null>(null);

    const heroImages = settings.hero_images;

    const previewHeroImages = heroImages?.length
        ? settings.hero_images.map(img => ({
            url: img.image_path.startsWith('http') ? img.image_path : '/storage/' + img.image_path,
            alt: img.alt_text || '',
        }))
        : [];

    useEffect(() => {
        if (previewHeroImages.length < 2) return;
        const timer = setInterval(() => setPreviewSlide(s => (s + 1) % previewHeroImages.length), 3500);
        return () => clearInterval(timer);
    }, [previewHeroImages.length]);

    const imageForm = useForm({
        reservation_setting_id: settings.id,
        image: null as File | null,
        alt_text: '',
        caption: '',
    });

    const { data, setData, post, processing } = useForm({
        badge_text: settings.badge_text,
        badge_icon: settings.badge_icon || 'tag',
        badge_enabled: settings.badge_enabled ?? true,
        headline: settings.headline,
        headline_highlight: settings.headline_highlight,
        subtitle: settings.subtitle || '',
        stat_pills: settings.stat_pills || [
            { icon: 'location', text: '' },
            { icon: 'shield', text: '' },
            { icon: 'clock', text: '' },
        ],
        is_active: settings.is_active,
    });

    const whyForm = useForm({
        title: '',
        description: '',
        icon_svg: '',
        icon_path: '',
        sort_order: 0,
        is_active: true,
    });

    function saveReservationSettings() {
        post(route('admin.reservation-settings.update'), {
            preserveScroll: true,
        });
    }

    function updateStatPill(index: number, field: 'icon' | 'text', value: string) {
        const newPills = [...(data.stat_pills || [])];
        newPills[index] = { ...newPills[index], [field]: value };
        setData('stat_pills', newPills);
    }

    function onImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                imageForm.setError('image', 'Image size must not exceed 5MB.');
                return;
            }
            imageForm.clearErrors('image');
            imageForm.setData('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    }

    function submitImage(e: React.FormEvent) {
        e.preventDefault();
        imageForm.post(route('admin.reservation-settings.images.upload'), {
            forceFormData: true,
            onSuccess: () => {
                imageForm.reset();
                setImagePreview(null);
                setShowImageForm(false);
            },
        });
    }

    function editImage(img: HeroImage) {
        setEditingImage(img);
        imageForm.setData('alt_text', img.alt_text || '');
        imageForm.setData('caption', img.caption || '');
        setImagePreview(null);
        setShowImageForm(true);
    }

    function updateImage(e: React.FormEvent) {
        e.preventDefault();
        if (!editingImage) return;
        imageForm.post(route('admin.reservation-settings.images.update', editingImage.id), {
            onSuccess: () => {
                imageForm.reset();
                setImagePreview(null);
                setShowImageForm(false);
                setEditingImage(null);
            },
        });
    }

    function deleteImage(img: HeroImage) {
        router.delete(route('admin.reservation-settings.images.delete', img.id), {
            preserveScroll: true,
            onSuccess: () => setConfirmDeleteImage(null),
        });
    }

    function moveImage(index: number, direction: 'up' | 'down') {
        const images = settings.hero_images;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= images.length) return;

        const reordered = [...images];
        [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

        const payload = reordered.map((img, i) => ({
            id: img.id,
            sort_order: i,
        }));

        router.post(route('admin.reservation-settings.images.reorder'), { images: payload }, {
            preserveScroll: true,
        });
    }

    function cancelImageForm() {
        setShowImageForm(false);
        setImagePreview(null);
        setEditingImage(null);
        imageForm.reset();
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

    function moveWhyItem(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= whyBookItems.length) return;

        const reordered = [...whyBookItems];
        [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

        const payload = reordered.map((item, i) => ({
            id: item.id,
            sort_order: i,
        }));

        router.post(route('admin.why-book.reorder'), { items: payload }, {
            preserveScroll: true,
        });
    }

    function confirmDeleteWhy(item: WhyBookItem) {
        setDeletingWhyItem(item);
        setShowDeleteWhyModal(true);
    }

    function executeDeleteWhy() {
        if (deletingWhyItem) {
            router.delete(route('admin.why-book.destroy', deletingWhyItem.id), {
                onSuccess: () => setShowDeleteWhyModal(false),
            });
        }
    }

    const STAT_ICONS: Record<string, string> = {
        location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
        shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        car: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
        star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
        support: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Reservation Page</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Hero content, stat pills, and why book with us</p>
                </div>
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm',
                    data.is_active
                        ? 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-surface-500/15 text-surface-500 ring-1 ring-surface-500/30'
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', data.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-surface-400')} />
                    {data.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass overflow-x-auto">
                <button type="button" onClick={() => setActiveSubTab('hero')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                        activeSubTab === 'hero'
                            ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                    )}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Header Section
                </button>
                <button type="button" onClick={() => setActiveSubTab('why-book')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                        activeSubTab === 'why-book'
                            ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                    )}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Why Book With Us
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeSubTab === 'hero' && (
                            <>
                                <div className="h-full space-y-5">
                                    <div className="flex flex-col h-full bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-surface-900 dark:text-white">Header Section</h3>
                                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Header text, badge, and stat pills</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Badge Text</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="text" value={data.badge_text} onChange={e => setData('badge_text', e.target.value)}
                                                        className="input-field flex-1" placeholder="Palau Exclusive" />
                                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                                        <button type="button"
                                                            onClick={() => setData('badge_enabled', !data.badge_enabled)}
                                                            className={cn(
                                                                'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300',
                                                                data.badge_enabled ? 'bg-accent-500' : 'bg-surface-300 dark:bg-surface-600'
                                                            )}>
                                                            <span className={cn(
                                                                'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300',
                                                                data.badge_enabled ? 'translate-x-5' : 'translate-x-0'
                                                            )} />
                                                        </button>
                                                        <span className="text-[10px] font-medium text-surface-500 dark:text-surface-400">{data.badge_enabled ? 'On' : 'Off'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Badge Icon</label>
                                                <div className="flex gap-2">
                                                    {Object.entries(BADGE_ICON_OPTIONS).map(([key, path]) => (
                                                        <button key={key} type="button" onClick={() => setData('badge_icon', key)}
                                                            className={cn(
                                                                'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                                                                data.badge_icon === key
                                                                    ? 'bg-brand-100 dark:bg-brand-800 shadow-sm text-brand-600 dark:text-brand-300 ring-2 ring-brand-400/50'
                                                                    : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600/50'
                                                            )}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                                                            </svg>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Headline</label>
                                                <input type="text" value={data.headline} onChange={e => setData('headline', e.target.value)}
                                                    className="input-field" placeholder="Reserve Your" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Highlight</label>
                                                <input type="text" value={data.headline_highlight} onChange={e => setData('headline_highlight', e.target.value)}
                                                    className="input-field" placeholder="Ride" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Subtitle</label>
                                            <textarea rows={2} value={data.subtitle} onChange={e => setData('subtitle', e.target.value)}
                                                className="input-field resize-none h-[calc(100%-1.5rem)]" placeholder="Complete the form below to secure your perfect vehicle..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-full space-y-5">
                                    <div className="h-full bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                                                <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-surface-900 dark:text-white">Stat Pills</h3>
                                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Highlight stats shown on the reservation page</p>
                                            </div>
                                        </div>

                                        {(data.stat_pills || []).map((pill, i) => (
                                            <div key={i} className="flex items-stretch gap-3 p-3 rounded-xl bg-surface-50/70 dark:bg-brand-900/30 border border-surface-100 dark:border-surface-700/50">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Icon</label>
                                                    <div className="flex gap-1.5">
                                                        {Object.keys(STAT_ICONS).map(ico => (
                                                            <button key={ico} type="button" onClick={() => updateStatPill(i, 'icon', ico)}
                                                                className={cn(
                                                                    'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                                                                    pill.icon === ico
                                                                        ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 ring-2 ring-accent-400/50 shadow-sm'
                                                                        : 'bg-surface-100 dark:bg-surface-700/40 text-surface-400 dark:text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-600/50'
                                                                )}>
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d={STAT_ICONS[ico]} />
                                                                </svg>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Text</label>
                                                    <input type="text" value={pill.text} onChange={e => updateStatPill(i, 'text', e.target.value)}
                                                        className="input-field mt-0.5" placeholder="e.g. 300+ Cars" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-5">
                                    <div className="group/card relative overflow-hidden bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-400/5 rounded-full blur-3xl group-hover/card:bg-brand-400/5 transition-colors duration-700" />
                                        <div className="relative px-6 sm:px-8 py-4 border-b border-surface-100 dark:border-surface-700/60 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                                                    <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-surface-900 dark:text-white">Hero Images</h3>
                                                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                                        {heroImages.length > 0
                                                            ? `${heroImages.length} image${heroImages.length !== 1 ? 's' : ''} in the hero slideshow`
                                                            : 'No images added yet'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="accent" size="sm" onClick={() => { setEditingImage(null); imageForm.reset(); setImagePreview(null); setShowImageForm(true); }}>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add Image
                                            </Button>
                                        </div>

                                        <div className="relative p-6 sm:p-8 space-y-6">
                                            {heroImages.length === 0 ? (
                                                <div className="rounded-xl bg-surface-50/80 dark:bg-surface-800/30 backdrop-blur-sm border border-dashed border-surface-200 dark:border-surface-700 p-10 text-center transition-all hover:border-brand-300 dark:hover:border-brand-600">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                                                        <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="text-base font-bold text-surface-900 dark:text-white mb-1">No hero images yet</h4>
                                                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-5 max-w-xs mx-auto">Upload images to create a dynamic slideshow on the reservation page.</p>
                                                    <Button variant="accent" onClick={() => { setEditingImage(null); imageForm.reset(); setImagePreview(null); setShowImageForm(true); }}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        Upload Image
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {heroImages.map((img, i) => (
                                                        <div key={img.id}
                                                            className="group relative aspect-[16/9] rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                                            <img src={img.image_path.startsWith('http') ? img.image_path : `/storage/${img.image_path}`} alt={img.alt_text || ''}
                                                                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                                                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium ring-1 ring-white/10">
                                                                #{i + 1}
                                                            </div>
                                                            {img.caption && (
                                                                <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium truncate">
                                                                    {img.caption}
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-3">
                                                                <div className="flex items-center gap-1">
                                                                    <button type="button" onClick={e => { e.stopPropagation(); editImage(img); }}
                                                                        className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button type="button" onClick={e => { e.stopPropagation(); setConfirmDeleteImage(img); }}
                                                                        className="p-1.5 rounded-lg bg-red-500/60 backdrop-blur-sm text-white hover:bg-red-500/80 transition-colors">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button type="button" onClick={e => { e.stopPropagation(); moveImage(i, 'up'); }}
                                                                        disabled={i === 0}
                                                                        className={cn('p-1.5 rounded-lg backdrop-blur-sm transition-colors',
                                                                            i === 0 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/20 text-white hover:bg-white/30')}>
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                                                        </svg>
                                                                    </button>
                                                                    <button type="button" onClick={e => { e.stopPropagation(); moveImage(i, 'down'); }}
                                                                        disabled={i === heroImages.length - 1}
                                                                        className={cn('p-1.5 rounded-lg backdrop-blur-sm transition-colors',
                                                                             i === heroImages.length - 1 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/20 text-white hover:bg-white/30')}>
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {showImageForm && (
                                                <div className="p-5 rounded-xl bg-gradient-to-br from-brand-50/80 to-brand-100/50 dark:from-surface-800/50 dark:to-surface-800/20 border border-brand-200/70 dark:border-surface-700/60 backdrop-blur-sm animate-fade-in-up">
                                                    <div className="flex items-center gap-2.5 mb-4">
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm">
                                                            {editingImage ? (
                                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <h4 className="text-sm font-bold text-surface-900 dark:text-white">
                                                            {editingImage ? 'Edit Hero Image' : 'New Hero Image'}
                                                        </h4>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="relative w-36 h-24 shrink-0 rounded-xl border-2 border-dashed border-brand-300 dark:border-surface-600 bg-white dark:bg-surface-800/50 group cursor-pointer overflow-hidden transition-all duration-300 hover:border-brand-400 hover:shadow-glow-blue">
                                                                <input type="file" onChange={onImageFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                                {imagePreview ? (
                                                                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                                                ) : editingImage ? (
                                                                    <img src={`/storage/${editingImage.image_path}`} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 transition-transform duration-200 group-hover:scale-105">
                                                                        <svg className="w-7 h-7 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                        <span className="text-[10px] text-brand-500 font-medium">Click to upload</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-3">
                                                                <input type="text" value={imageForm.data.alt_text} onChange={e => imageForm.setData('alt_text', e.target.value)}
                                                                    className="input-field" placeholder="Alt text for accessibility" />
                                                                <input type="text" value={imageForm.data.caption} onChange={e => imageForm.setData('caption', e.target.value)}
                                                                    className="input-field" placeholder="Caption shown over the image" />
                                                            </div>
                                                        </div>
                                                        {imageForm.errors.image && <p className="text-xs text-red-500">{imageForm.errors.image}</p>}
                                                        {imageForm.errors.alt_text && <p className="text-xs text-red-500">{imageForm.errors.alt_text}</p>}
                                                        {imageForm.errors.caption && <p className="text-xs text-red-500">{imageForm.errors.caption}</p>}
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <Button variant="secondary" size="sm" type="button" onClick={cancelImageForm}>Cancel</Button>
                                                            {editingImage ? (
                                                                <Button variant="default" size="sm" type="button" onClick={updateImage} disabled={imageForm.processing}>
                                                                    {imageForm.processing ? (
                                                                        <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Updating...</>
                                                                    ) : (
                                                                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Update Image</>
                                                                    )}
                                                                </Button>
                                                            ) : (
                                                                <Button variant="default" size="sm" type="button" onClick={submitImage} disabled={imageForm.processing || !imageForm.data.image}>
                                                                    {imageForm.processing ? (
                                                                        <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Uploading...</>
                                                                    ) : (
                                                                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Upload Image</>
                                                                    )}
                                                                </Button>
                                                          )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {heroImages.length > 0 && (
                                                <div className="rounded-xl bg-brand-50/60 dark:bg-surface-800/30 border border-brand-200/50 dark:border-surface-700/50 p-4 space-y-3">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Image Guidelines</h4>
                                                    <ul className="space-y-1.5">
                                                        {[
                                                            'Recommended size: 1920 × 800px',
                                                            'Max file size: 5MB per image',
                                                            'Formats: JPEG, WebP, or PNG',
                                                            'Add captions for better slide context',
                                                        ].map((tip, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-xs text-surface-600 dark:text-surface-400">
                                                                <svg className="w-3.5 h-3.5 text-brand-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeSubTab === 'why-book' && (
                            <div className="lg:col-span-2 space-y-6">
                                <Button variant="accent" size="sm" onClick={openWhyCreate}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Item
                                </Button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {whyBookItems.map((item, i) => (
                                        <div key={item.id} className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-5 group hover:shadow-md transition-all">
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
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100 dark:border-surface-700/60">
                                                <span className={cn(
                                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                                    item.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                )}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => moveWhyItem(i, 'up')} disabled={i === 0}
                                                        className={cn('p-1.5 rounded-lg transition-colors', i === 0 ? 'text-surface-200 dark:text-surface-600 cursor-not-allowed' : 'text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20')}>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                                    </button>
                                                    <button onClick={() => moveWhyItem(i, 'down')} disabled={i === whyBookItems.length - 1}
                                                        className={cn('p-1.5 rounded-lg transition-colors', i === whyBookItems.length - 1 ? 'text-surface-200 dark:text-surface-600 cursor-not-allowed' : 'text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20')}>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                    </button>
                                                    <button onClick={() => openWhyEdit(item)}
                                                        className="p-1.5 text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => confirmDeleteWhy(item)}
                                                        className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {whyBookItems.length === 0 && (
                                    <div className="text-center py-16 text-surface-400 bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60">
                                        <p className="text-sm font-semibold">No items yet. Click "Add Item" to create one.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {activeSubTab === 'hero' && (
                    <div className="w-full lg:w-80 xl:w-96 shrink-0">
                        <div className="lg:sticky lg:top-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-sm shrink-0">
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-surface-900 dark:text-white">Live Preview</h3>
                                        <p className="text-[10px] text-surface-500 dark:text-surface-400">Reservation hero as it appears on the site</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowPreview(!showPreview)}
                                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors" title={showPreview ? 'Hide preview' : 'Show preview'}>
                                    <svg className={cn('w-4 h-4 text-surface-500 transition-transform duration-200', !showPreview && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </div>
                            {showPreview && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden">
                                        <div className="px-3 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700/60">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Reservation Page</span>
                                        </div>
                                        <div className="relative w-full min-h-[16rem] overflow-hidden bg-brand-900">
                                            {previewHeroImages.length > 0 ? (
                                                previewHeroImages.map((img, i) => (
                                                    <div key={i}
                                                        className={`absolute inset-0 transition-all duration-700 ${i === previewSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
                                                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                                                    </div>
                                                ))
                                            ) : null}
                                            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/60 to-brand-900/20" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                            <div className="relative z-10 p-5 h-full min-h-[16rem] flex flex-col justify-center">
                                                <div className="space-y-4">
                                                {data.badge_enabled && (
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-full border w-fit backdrop-blur-sm',
                                                        'bg-accent-400/15 text-accent-300 border-accent-400/25'
                                                    )}>
                                                        {BADGE_ICON_OPTIONS[data.badge_icon] ? (
                                                            <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d={BADGE_ICON_OPTIONS[data.badge_icon]} />
                                                            </svg>
                                                        ) : (
                                                            <span className="w-1 h-1 rounded-full bg-accent-400 animate-pulse" />
                                                        )}
                                                        {data.badge_text || 'Exclusive Offer'}
                                                    </span>
                                                )}
                                                <h3 className="text-lg font-bold text-white leading-tight">
                                                    {data.headline || 'Reserve Your'}
                                                    {data.headline_highlight && (
                                                        <span className="block gradient-text mt-0.5">{data.headline_highlight}</span>
                                                    )}
                                                </h3>
                                                {data.subtitle && (
                                                    <p className="text-surface-400 text-xs leading-relaxed">{data.subtitle}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {(data.stat_pills || []).map((pill, i) => (
                                                        <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
                                                            <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d={STAT_ICONS[pill.icon] || STAT_ICONS.location} />
                                                            </svg>
                                                            <span className="text-[10px] font-medium text-white/80">{pill.text || 'Stat'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {previewHeroImages.length > 1 && (
                                            <>
                                                <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
                                                    {previewHeroImages.map((_, i) => (
                                                        <button key={i} onClick={() => setPreviewSlide(i)}
                                                            className={cn(
                                                                'h-1.5 rounded-full transition-all duration-500',
                                                                i === previewSlide ? 'bg-accent-400 w-6 shadow-glow-yellow' : 'bg-white/30 hover:bg-white/60 w-1.5'
                                                            )} />
                                                    ))}
                                                </div>
                                                <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white text-[10px] font-medium ring-1 ring-white/10">
                                                    {previewSlide + 1} / {previewHeroImages.length}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-surface-400 bg-surface-50 dark:bg-surface-800/30 rounded-xl px-3 py-2">
                                        <span className={cn('inline-block w-1.5 h-1.5 rounded-full', data.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-surface-400')} />
                                        {data.is_active ? 'Reservation hero is active and visible' : 'Reservation hero is inactive and hidden'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                <p className="text-xs text-surface-400 dark:text-surface-500">
                    Changes are applied immediately after saving.
                </p>
                <Button variant="default" onClick={saveReservationSettings} disabled={processing}>
                    {processing ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Save Reservation Page</>
                    )}
                </Button>
            </div>

            <SlidePanel show={whyPanelOpen} onClose={closeWhyPanel} title={editingWhyItem ? 'Edit Why Book Item' : 'Add Why Book Item'}>
                <form onSubmit={submitWhyForm} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Title *</label>
                        <input type="text" value={whyForm.data.title} onChange={e => whyForm.setData('title', e.target.value)}
                            className="input-field" />
                        {whyForm.errors.title && <p className="text-xs text-red-500 mt-1">{whyForm.errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Description</label>
                        <div className="relative">
                            <textarea rows={3} value={whyForm.data.description} onChange={e => whyForm.setData('description', e.target.value)}
                                maxLength={200} className="input-field resize-none pr-14" />
                            <span className="absolute right-3 bottom-3 text-[10px] font-medium text-surface-400">{whyForm.data.description.length}/200</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Icon</label>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {SVG_PRESETS.map(preset => (
                                <button key={preset.label} type="button" onClick={() => whyForm.setData('icon_svg', preset.path)}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all',
                                        whyForm.data.icon_svg === preset.path
                                            ? 'bg-accent-50 border-accent-300 text-accent-700 ring-2 ring-accent-400/30'
                                            : 'bg-surface-50 border-surface-200 text-surface-500 hover:bg-surface-100 hover:border-surface-300'
                                    )}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={preset.path} />
                                    </svg>
                                    <span className="text-[8px] font-semibold text-center leading-tight">{preset.label.replace(/\(.*\)/, '').trim()}</span>
                                </button>
                            ))}
                        </div>
                        <textarea rows={2} value={whyForm.data.icon_svg} onChange={e => whyForm.setData('icon_svg', e.target.value)}
                            placeholder="Or paste SVG path data..."
                            className="input-field resize-none font-mono text-xs" />
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
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={whyForm.data.is_active} onChange={e => whyForm.setData('is_active', e.target.checked)}
                                    className="w-4 h-4 rounded border-surface-300 text-accent-500 focus:ring-accent-400" />
                                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Active</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="default" type="submit" disabled={whyForm.processing}>
                            {whyForm.processing ? 'Saving...' : editingWhyItem ? 'Update Item' : 'Create Item'}
                        </Button>
                        <Button variant="secondary" type="button" onClick={closeWhyPanel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </SlidePanel>

            <Modal show={showDeleteWhyModal} onClose={() => setShowDeleteWhyModal(false)} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Item</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                        Are you sure you want to delete <strong>{deletingWhyItem?.title}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button variant="secondary" onClick={() => setShowDeleteWhyModal(false)}>Cancel</Button>
                        <Button variant="default" onClick={executeDeleteWhy}
                            className="bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20">
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal show={!!confirmDeleteImage} onClose={() => setConfirmDeleteImage(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Hero Image</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                        Are you sure you want to remove <strong>{confirmDeleteImage?.caption || `image #${confirmDeleteImage?.id}`}</strong> from the hero slideshow? This action cannot be undone.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button variant="secondary" onClick={() => setConfirmDeleteImage(null)}>Cancel</Button>
                        <Button variant="default" onClick={() => confirmDeleteImage && deleteImage(confirmDeleteImage)}
                            className="bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20">
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
