import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import HomePageTab from './HomePageTab';
import FleetPageTab from './FleetPageTab';
import ReservationPageTab from './ReservationPageTab';
import LocationsPageTab from './LocationsPageTab';
import AboutUsPageTab from './AboutUsPageTab';

const PAGE_TABS = [
    { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'fleet', label: 'Fleet', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
    { id: 'reservation', label: 'Reservation', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'locations', label: 'Locations', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'about-us', label: 'About Us', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
] as const;

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

interface FleetSettings {
    id: number;
    hero_badge: string;
    hero_title: string;
    hero_highlight: string;
    hero_description: string | null;
    hero_image_path: string | null;
    section_heading: string;
    section_subheading: string;
    is_active: boolean;
}

interface ReservationSettings {
    id: number;
    badge_text: string;
    headline: string;
    headline_highlight: string;
    subtitle: string | null;
    stat_pills: { icon: string; text: string }[] | null;
    is_active: boolean;
    booking_terms: string | null;
    hero_images: { id: number; image_path: string; alt_text: string | null; caption: string | null; sort_order: number }[];
}

interface LocationsPageSettings {
    id: number;
    hero_badge: string;
    hero_title: string;
    hero_highlight: string;
    hero_description: string | null;
    hero_image_path: string | null;
    hero_button_text: string;
    hero_phone_label: string;
    hero_phone_number: string;
    hero_active: boolean;
    cta_title: string;
    cta_description: string | null;
    cta_button_text: string;
    cta_button_url: string;
    cta_phone_label: string;
    cta_phone_number: string;
    cta_active: boolean;
    is_active: boolean;
}

interface AboutUsSettings {
    id: number;
    hero_badge: string;
    hero_title: string;
    hero_highlight: string;
    hero_description: string | null;
    hero_image_path: string | null;
    story_heading: string;
    story_content: string | null;
    mission_text: string | null;
    vision_text: string | null;
    stats: { value: string; label: string }[] | null;
    is_active: boolean;
}

interface WhyChooseUsItem {
    id: number;
    title: string;
    description: string | null;
    icon_svg: string | null;
    sort_order: number;
    is_active: boolean;
}

export default function HeroSettingsIndex({
    homeSettings,
    whyChooseUsItems,
    fleetSettings,
    reservationSettings,
    locationsPageSettings,
    aboutUsSettings,
}: {
    homeSettings: HomeSettings;
    whyChooseUsItems?: WhyChooseUsItem[];
    fleetSettings: FleetSettings;
    reservationSettings: ReservationSettings;
    locationsPageSettings: LocationsPageSettings;
    aboutUsSettings: AboutUsSettings;
}) {
    const [activePage, setActivePage] = useState('home');
    const [showImageForm, setShowImageForm] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null);
    const [editingImage, setEditingImage] = useState<HeroImage | null>(null);

    const form = useForm({
        badge_text: homeSettings.badge_text,
        badge_enabled: homeSettings.badge_enabled ?? true,
        badge_icon: homeSettings.badge_icon || 'tag',
        booking_badge_text: homeSettings.booking_badge_text || 'Exclusive in Palau',
        booking_badge_enabled: homeSettings.booking_badge_enabled ?? true,
        booking_badge_icon: homeSettings.booking_badge_icon || 'tag',
        headline: homeSettings.headline,
        headline_highlight: homeSettings.headline_highlight,
        tagline: homeSettings.tagline || '',
        description: homeSettings.description || '',
        image: null as File | null,
        is_active: homeSettings.is_active,
        fleet_image: null as File | null,
        why_choose_us_heading: homeSettings.why_choose_us_heading || 'Built for a Better Rental Experience',
        why_choose_us_subheading: homeSettings.why_choose_us_subheading || 'We go the extra mile to make every rental smooth, transparent, and enjoyable from start to finish.',
    });

    const imageForm = useForm({
        hero_setting_id: homeSettings.id,
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

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

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

    return (
        <>
            <Head title="Page Customization" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Page Customization' }]}
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
                                    Page Customization
                                </h1>
                                <p className="text-white/60 max-w-xl text-sm">
                                    Manage content for every page on your site — Home, Fleet, Reservation, Locations, and About Us.
                                </p>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10">
                        <div className="flex flex-col gap-6">

                            {/* Page Tab Navigation */}
                            <div className="flex gap-1 p-1.5 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass overflow-x-auto">
                                {PAGE_TABS.map(tab => (
                                    <button key={tab.id} type="button" onClick={() => setActivePage(tab.id)}
                                        className={cn(
                                            'flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 relative whitespace-nowrap',
                                            activePage === tab.id
                                                ? 'bg-white dark:bg-brand-800/80 shadow-md text-brand-700 dark:text-brand-300'
                                                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-white/50 dark:hover:bg-brand-800/40'
                                        )}>
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                                        </svg>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Page Content */}
                            <div className="animate-fade-in">
                                {activePage === 'home' && (
                                    <HomePageTab
                                        settings={homeSettings}
                                        whyChooseUsItems={whyChooseUsItems || []}
                                        form={form}
                                        imageForm={imageForm}
                                        showImageForm={showImageForm}
                                        setShowImageForm={setShowImageForm}
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

                                {activePage === 'fleet' && (
                                    <FleetPageTab settings={fleetSettings} />
                                )}

                                {activePage === 'reservation' && (
                                    <ReservationPageTab settings={reservationSettings} />
                                )}

                                {activePage === 'locations' && (
                                    <LocationsPageTab settings={locationsPageSettings} />
                                )}

                                {activePage === 'about-us' && (
                                    <AboutUsPageTab settings={aboutUsSettings} />
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

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
