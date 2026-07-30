import { useState } from 'react';
import TextContentSection from './TextContentSection';
import CarouselImagesSection from './CarouselImagesSection';
import WhyChooseUsSection, { type WhyChooseUsItem } from './WhyChooseUsSection';
import PreviewPanel from './PreviewPanel';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

interface HeroImage {
    id: number;
    image_path: string;
    tagline: string | null;
    alt_text: string | null;
    sort_order: number;
}

interface HomeSettings {
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
    why_choose_us_heading: string;
    why_choose_us_subheading: string;
    images: HeroImage[];
}

export default function HomePageTab({
    settings,
    whyChooseUsItems,
    form,
    imageForm,
    showImageForm,
    setShowImageForm,
    imagePreview,
    onImageFileChange,
    onSubmitImage,
    onCancelImageForm,
    onDeleteImage,
    onLightbox,
    editingImage,
    onEditImage,
    onUpdateImage,
}: {
    settings: HomeSettings;
    whyChooseUsItems: WhyChooseUsItem[];
    form: any;
    imageForm: any;
    showImageForm: boolean;
    setShowImageForm: (v: boolean) => void;
    imagePreview: string | null;
    onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmitImage: (e: React.FormEvent) => void;
    onCancelImageForm: () => void;
    onDeleteImage: (img: HeroImage) => void;
    onLightbox: (img: { src: string; alt: string } | null) => void;
    editingImage: HeroImage | null;
    onEditImage: (img: HeroImage) => void;
    onUpdateImage: (e: React.FormEvent) => void;
}) {
    const [activeSection, setActiveSection] = useState('header-section');
    const [showPreview, setShowPreview] = useState(true);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [autoplaySpeed, setAutoplaySpeed] = useState(3500);

    const SECTION_ITEMS = [
        { id: 'header-section', label: 'Header Section', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
        { id: 'why-choose-us', label: 'Why Choose Us', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    ];

    const currentImage = settings.image_path ? `/storage/${settings.image_path}` : null;
    const carouselPreviews = settings.images.map(img => ({
        src: `/storage/${img.image_path}`,
        tagline: img.tagline,
    }));

    function saveHomeSettings() {
        form.post(route('admin.hero-settings.update'), {
            preserveScroll: true,
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Home Page</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Hero banner, carousel, badges, and Why Choose Us section</p>
                </div>
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm',
                    form.data.is_active
                        ? 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-surface-500/15 text-surface-500 ring-1 ring-surface-500/30'
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', form.data.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-surface-400')} />
                    {form.data.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            {/* Sub-navigation */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass overflow-x-auto">
                {SECTION_ITEMS.map(item => (
                    <button key={item.id} type="button" onClick={() => setActiveSection(item.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                            activeSection === item.id
                                ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                        )}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 min-w-0 space-y-6">
                    {activeSection === 'header-section' && (
                        <div className="lg:grid lg:grid-cols-2 items-start gap-6 space-y-6 lg:space-y-0">
                            <TextContentSection
                                data={form.data}
                                onSetData={(key, value) => form.setData(key as any, value as any)}
                                errors={form.errors}
                                focusedField={focusedField}
                                onFieldFocus={setFocusedField}
                                onFieldBlur={() => setFocusedField(null)}
                            />
                            <CarouselImagesSection
                                settings={settings}
                                showImageForm={showImageForm}
                                onSetShowImageForm={setShowImageForm}
                                imageForm={imageForm}
                                imagePreview={imagePreview}
                                onImageFileChange={onImageFileChange}
                                onSubmitImage={onSubmitImage}
                                onCancelImageForm={onCancelImageForm}
                                onDeleteImage={onDeleteImage}
                                onLightbox={onLightbox}
                                editingImage={editingImage}
                                onEditImage={onEditImage}
                                onUpdateImage={onUpdateImage}
                                autoplaySpeed={autoplaySpeed}
                                onAutoplaySpeedChange={setAutoplaySpeed}
                            />
                        </div>
                    )}

                    {activeSection === 'why-choose-us' && (
                        <WhyChooseUsSection
                            items={whyChooseUsItems}
                            heading={form.data.why_choose_us_heading}
                            subheading={form.data.why_choose_us_subheading}
                            onHeadingChange={(v) => form.setData('why_choose_us_heading', v)}
                            onSubheadingChange={(v) => form.setData('why_choose_us_subheading', v)}
                        />
                    )}
                </div>

                {activeSection === 'header-section' && (
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
                                        <p className="text-[10px] text-surface-500 dark:text-surface-400">Homepage hero as it appears on the site</p>
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
                                    focusedField={focusedField}
                                    autoplaySpeed={autoplaySpeed}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                <p className="text-xs text-surface-400 dark:text-surface-500">
                    Changes are applied immediately after saving.
                </p>
                <Button variant="default" onClick={saveHomeSettings} disabled={form.processing}>
                    {form.processing ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Save Home Page</>
                    )}
                </Button>
            </div>
        </div>
    );
}
