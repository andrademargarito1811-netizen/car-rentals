import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/Components/ui/sheet';
import TextContentSection from './TextContentSection';
import CarouselImagesSection from './CarouselImagesSection';
import FleetPageSection from './FleetPageSection';
import PreviewPanel from './PreviewPanel';

interface HeroImage {
    id: number;
    image_path: string;
    tagline: string | null;
    alt_text: string | null;
    sort_order: number;
}

interface HeroSettingsData {
    id: number;
    badge_text: string;
    badge_enabled: boolean;
    badge_icon: string;
    booking_badge_text: string;
    booking_badge_enabled: boolean;
    booking_badge_icon: string;
    headline: string;
    headline_highlight: string;
    tagline: string | null;
    description: string | null;
    image_path: string | null;
    fleet_image_path: string | null;
    is_active: boolean;
    images: HeroImage[];
}

function ImagePreviewModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <div className="relative max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden shadow-elevated ring-1 ring-white/10 animate-scale-in" onClick={e => e.stopPropagation()}>
                <img src={src} alt={alt} className="w-full h-full object-contain max-h-[85vh]" />
                <button onClick={onClose}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/25 transition-all duration-200 hover:scale-105">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

const NAV_ITEMS = [
    { id: 'text-content', label: 'Text Content', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { id: 'carousel', label: 'Carousel Images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'fleet-page', label: 'Fleet Page', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
] as const;

export default function HeroSettingsIndex({ settings }: { settings: HeroSettingsData }) {
    const [showImageForm, setShowImageForm] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null);
    const [activeNav, setActiveNav] = useState('text-content');
    const [showPreview, setShowPreview] = useState(false);
    const [editingImage, setEditingImage] = useState<HeroImage | null>(null);

    const form = useForm({
        badge_text: settings.badge_text,
        badge_enabled: settings.badge_enabled ?? true,
        badge_icon: settings.badge_icon || 'tag',
        booking_badge_text: settings.booking_badge_text || 'Exclusive in Palau',
        booking_badge_enabled: settings.booking_badge_enabled ?? true,
        booking_badge_icon: settings.booking_badge_icon || 'tag',
        headline: settings.headline,
        headline_highlight: settings.headline_highlight,
        tagline: settings.tagline || '',
        description: settings.description || '',
        image: null as File | null,
        is_active: settings.is_active,
        fleet_image: null as File | null,
    });

    const imageForm = useForm({
        hero_setting_id: settings.id,
        image: null as File | null,
        tagline: '',
    });

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

    function saveSettings() {
        form.post(route('admin.hero-settings.update'));
    }

    function submitImage(e: React.FormEvent) {
        e.preventDefault();
        imageForm.post(route('admin.hero-settings.images.upload'), {
            forceFormData: true,
            onSuccess: () => {
                imageForm.reset();
                setImagePreview(null);
                setShowImageForm(false);
            },
        });
    }

    function deleteImage(img: HeroImage) {
        if (confirm('Remove this carousel image?')) {
            router.delete(route('admin.hero-settings.images.delete', img.id), {
                preserveScroll: true,
            });
        }
    }

    function editImage(img: HeroImage) {
        setEditingImage(img);
        imageForm.setData('tagline', img.tagline || '');
        setImagePreview(null);
        setShowImageForm(true);
    }

    function updateImage(e: React.FormEvent) {
        e.preventDefault();
        if (!editingImage) return;
        imageForm.post(route('admin.hero-settings.images.update', editingImage.id), {
            onSuccess: () => {
                imageForm.reset();
                setImagePreview(null);
                setShowImageForm(false);
                setEditingImage(null);
            },
        });
    }

    function cancelImageForm() {
        setShowImageForm(false);
        setImagePreview(null);
        setEditingImage(null);
        imageForm.reset();
    }

    const currentImage = settings.image_path ? `/storage/${settings.image_path}` : null;

    const FLEET_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=800&fit=crop';
    const fleetImage = settings.fleet_image_path ? `/storage/${settings.fleet_image_path}` : FLEET_FALLBACK_IMAGE;

    const carouselPreviews = settings.images.map(img => ({
        src: `/storage/${img.image_path}`,
        tagline: img.tagline,
    }));

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Hero Settings" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Hero Settings' }]}
                header={
                    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br', headerGradient, 'p-6 sm:p-8')}>
                        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-float-orb" />
                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-float-orb-delayed" />
                        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl animate-soft-pulse hidden sm:block" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Site Settings
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Hero Banner Settings
                                </h1>
                                <p className="text-white/60 max-w-xl text-sm">
                                    Customize hero banners for the homepage and fleet page — text content, carousel images, and backgrounds.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm',
                                    form.data.is_active
                                        ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30'
                                        : 'bg-surface-500/15 text-surface-400 ring-1 ring-surface-500/30'
                                )}>
                                    <span className={cn('w-1.5 h-1.5 rounded-full', form.data.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-surface-400')} />
                                    {form.data.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}
                                    className="lg:hidden bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm border-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview
                                </Button>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10">
                        <div className="flex flex-col lg:flex-row gap-8">

                            {/* Desktop Sidebar Navigation */}
                            <nav className="hidden lg:block lg:w-48 shrink-0 animate-fade-in-right">
                                <div className="lg:sticky lg:top-6 space-y-1 p-2 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass">
                                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500">
                                        Sections
                                    </p>
                                    {NAV_ITEMS.map(item => (
                                        <button key={item.id} type="button" onClick={() => setActiveNav(item.id)}
                                            className={cn(
                                                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative overflow-hidden group',
                                                activeNav === item.id
                                                    ? 'text-brand-700 dark:text-brand-300 bg-white dark:bg-brand-800/80 shadow-sm'
                                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-white/50 dark:hover:bg-brand-800/40'
                                            )}>
                                            {activeNav === item.id && (
                                                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-gradient-to-b from-brand-500 to-accent-400 rounded-full" />
                                            )}
                                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                            </svg>
                                            {item.label}
                                            {item.id === 'carousel' && settings.images.length > 0 && (
                                                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-400 text-[9px] font-bold">
                                                    {settings.images.length}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </nav>

                            {/* Mobile Tab Bar */}
                            <div className="flex lg:hidden gap-1 p-1 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass">
                                {NAV_ITEMS.map(item => (
                                    <button key={item.id} type="button" onClick={() => setActiveNav(item.id)}
                                        className={cn(
                                            'flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 text-center',
                                            activeNav === item.id
                                                ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                                                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                                        )}>
                                        {item.label}
                                        {item.id === 'carousel' && settings.images.length > 0 && (
                                            <span className="ml-1.5 px-1 py-0.5 rounded-full bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-400 text-[9px] font-bold">
                                                {settings.images.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0 space-y-8">
                                {activeNav === 'text-content' && (
                                    <TextContentSection
                                        data={form.data}
                                        onSetData={(key, value) => form.setData(key as any, value as any)}
                                        errors={form.errors}
                                        onToggleActive={() => form.setData('is_active', !form.data.is_active)}
                                    />
                                )}

                                {activeNav === 'fleet-page' && (
                                    <FleetPageSection
                                        savedImagePath={settings.fleet_image_path ? `/storage/${settings.fleet_image_path}` : null}
                                        onFileChange={(file) => {
                                            if (file) form.setData('fleet_image' as any, file);
                                        }}
                                        error={form.errors.fleet_image}
                                    />
                                )}

                                {activeNav === 'carousel' && (
                                    <CarouselImagesSection
                                        settings={settings}
                                        showImageForm={showImageForm}
                                        onSetShowImageForm={setShowImageForm}
                                        imageForm={imageForm}
                                        imagePreview={imagePreview}
                                        onImageFileChange={onImageFileChange}
                                        onSubmitImage={submitImage}
                                        onCancelImageForm={cancelImageForm}
                                        onDeleteImage={deleteImage}
                                        onLightbox={setLightboxImg}
                                        editingImage={editingImage}
                                        onEditImage={editImage}
                                        onUpdateImage={updateImage}
                                    />
                                )}

                                {/* Save Button */}
                                <div className="animate-fade-in-up flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                                    <p className="text-xs text-surface-400 dark:text-surface-500">
                                        Changes are applied immediately after saving.
                                    </p>
                                    <Button variant="default" onClick={saveSettings} disabled={form.processing}>
                                        {form.processing ? (
                                            <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Save Settings</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Desktop Preview Panel */}
                            <div className="hidden lg:block lg:w-80 xl:w-96 shrink-0">
                                <div className="lg:sticky lg:top-6">
                                    <PreviewPanel
                                        images={carouselPreviews}
                                        badgeText={form.data.badge_text}
                                        badgeIcon={form.data.badge_icon}
                                        headline={form.data.headline}
                                        headlineHighlight={form.data.headline_highlight}
                                        tagline={form.data.tagline}
                                        description={form.data.description}
                                        isActive={form.data.is_active}
                                        currentImage={currentImage}
                                        fleetImage={fleetImage}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            {/* Mobile Preview Drawer */}
            <Sheet open={showPreview} onOpenChange={setShowPreview}>
                <SheetContent side="right" className="w-full sm:max-w-lg p-0 bg-white dark:bg-brand-900 border-l border-surface-200 dark:border-surface-700/60">
                    <SheetHeader className="px-5 py-4 border-b border-surface-100 dark:border-surface-700/60 space-y-0">
                        <div className="flex items-center gap-2.5 pr-8">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-sm shrink-0">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div>
                                <SheetTitle className="text-sm font-bold text-surface-900 dark:text-white">Live Preview</SheetTitle>
                                <SheetDescription className="text-[10px] text-surface-500 dark:text-surface-400">Hero banner as it appears on the homepage</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-5">
                        <PreviewPanel
                            images={carouselPreviews}
                            badgeText={form.data.badge_text}
                            badgeIcon={form.data.badge_icon}
                            headline={form.data.headline}
                            headlineHighlight={form.data.headline_highlight}
                            tagline={form.data.tagline}
                            description={form.data.description}
                            isActive={form.data.is_active}
                            currentImage={currentImage}
                            fleetImage={fleetImage}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Lightbox */}
            {lightboxImg && (
                <ImagePreviewModal
                    src={lightboxImg.src}
                    alt={lightboxImg.alt}
                    onClose={() => setLightboxImg(null)}
                />
            )}
        </>
    );
}
