import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { router } from '@inertiajs/react';

interface HeroImage {
    id: number;
    image_path: string;
    tagline: string | null;
    alt_text: string | null;
    sort_order: number;
}

interface ImageFormType {
    data: {
        hero_setting_id: number;
        image: File | null;
        tagline: string;
    };
    setData: (key: string, value: string | File | null) => void;
    errors: Record<string, string>;
    processing: boolean;
    reset: () => void;
}

interface CarouselImagesSectionProps {
    settings: { images: HeroImage[] };
    showImageForm: boolean;
    onSetShowImageForm: (show: boolean) => void;
    imageForm: ImageFormType;
    imagePreview: string | null;
    onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmitImage: (e: React.FormEvent) => void;
    onCancelImageForm: () => void;
    onDeleteImage: (img: HeroImage) => void;
    onLightbox: (img: { src: string; alt: string } | null) => void;
    editingImage: HeroImage | null;
    onEditImage: (img: HeroImage) => void;
    onUpdateImage: (e: React.FormEvent) => void;
    autoplaySpeed?: number;
    onAutoplaySpeedChange?: (speed: number) => void;
}

export default function CarouselImagesSection({
    settings,
    showImageForm,
    onSetShowImageForm,
    imageForm,
    imagePreview,
    onImageFileChange,
    onSubmitImage,
    onCancelImageForm,
    onDeleteImage,
    onLightbox,
    editingImage,
    onEditImage,
    onUpdateImage,
    autoplaySpeed = 3500,
    onAutoplaySpeedChange,
}: CarouselImagesSectionProps) {
    const images = settings.images;

    function moveImage(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= images.length) return;

        const reordered = [...images];
        [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

        const payload = reordered.map((img, i) => ({
            id: img.id,
            sort_order: i,
        }));

        router.post(route('admin.hero-settings.images.reorder'), { images: payload }, {
            preserveScroll: true,
        });
    }

    const SPEED_OPTIONS = [
        { value: 2000, label: '2s' },
        { value: 3500, label: '3.5s' },
        { value: 5000, label: '5s' },
        { value: 7000, label: '7s' },
    ];

    return (
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
                        <h3 className="text-base font-bold text-surface-900 dark:text-white">Carousel Images</h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                            {images.length > 0
                                ? `${images.length} image${images.length !== 1 ? 's' : ''} in the hero slideshow`
                                : 'No images added yet'}
                        </p>
                    </div>
                </div>
                <Button variant="accent" size="sm" onClick={() => onSetShowImageForm(true)}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Image
                </Button>
            </div>

            <div className="relative p-6 sm:p-8 space-y-6">
                {images.length === 0 ? (
                    <div className="rounded-xl bg-surface-50/80 dark:bg-surface-800/30 backdrop-blur-sm border border-dashed border-surface-200 dark:border-surface-700 p-10 text-center transition-all hover:border-brand-300 dark:hover:border-brand-600">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                            </svg>
                        </div>
                        <h4 className="text-base font-bold text-surface-900 dark:text-white mb-1">No carousel images yet</h4>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-5 max-w-xs mx-auto">Upload your first image to create a dynamic slideshow on the homepage.</p>
                        <Button variant="accent" onClick={() => onSetShowImageForm(true)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Upload Image
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {images.map((img, i) => (
                                <div key={img.id}
                                    className="group relative aspect-[16/9] rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                                    onClick={() => onLightbox({ src: `/storage/${img.image_path}`, alt: img.alt_text || '' })}>
                                    <img src={`/storage/${img.image_path}`} alt={img.alt_text || ''}
                                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />

                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium ring-1 ring-white/10">
                                        #{i + 1}
                                    </div>

                                    {img.tagline && (
                                        <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium truncate">
                                            {img.tagline}
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-3">
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={e => { e.stopPropagation(); onEditImage(img); }}
                                                className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button type="button" onClick={e => { e.stopPropagation(); onLightbox({ src: `/storage/${img.image_path}`, alt: img.alt_text || '' }); }}
                                                className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                                </svg>
                                            </button>
                                            <button type="button" onClick={e => { e.stopPropagation(); onDeleteImage(img); }}
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
                                                disabled={i === images.length - 1}
                                                className={cn('p-1.5 rounded-lg backdrop-blur-sm transition-colors',
                                                    i === images.length - 1 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/20 text-white hover:bg-white/30')}>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-xl bg-brand-50/60 dark:bg-surface-800/30 border border-brand-200/50 dark:border-surface-700/50 p-4 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Image Guidelines</h4>
                            <ul className="space-y-1.5">
                                {[
                                    'Recommended size: 1920 × 800px',
                                    'Max file size: 5MB per image',
                                    'Formats: JPEG, WebP, or PNG',
                                    'Add taglines for better slide context',
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

                        {onAutoplaySpeedChange && (
                            <div className="flex items-center justify-between bg-surface-50/70 dark:bg-surface-800/30 rounded-xl border border-surface-200 dark:border-surface-700/50 px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <svg className="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Autoplay speed</span>
                                </div>
                                <div className="flex gap-1">
                                    {SPEED_OPTIONS.map(opt => (
                                        <button key={opt.value} type="button" onClick={() => onAutoplaySpeedChange(opt.value)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                                                autoplaySpeed === opt.value
                                                    ? 'bg-white dark:bg-brand-800 shadow-sm text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-700'
                                                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-white/50 dark:hover:bg-surface-700/50'
                                            )}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
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
                                {editingImage ? 'Edit Carousel Image' : 'New Carousel Image'}
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
                                    <input type="text" value={imageForm.data.tagline} onChange={e => imageForm.setData('tagline', e.target.value)}
                                        className="input-field" placeholder="Tagline shown over the image (e.g. Luxury Sedans)" />
                                </div>
                            </div>
                            {imageForm.errors.image && <p className="text-xs text-red-500">{imageForm.errors.image}</p>}
                            {imageForm.errors.tagline && <p className="text-xs text-red-500">{imageForm.errors.tagline}</p>}
                            <div className="flex items-center gap-2 justify-end">
                                <Button variant="secondary" size="sm" type="button"
                                    onClick={onCancelImageForm}>
                                    Cancel
                                </Button>
                                {editingImage ? (
                                    <Button variant="default" size="sm" type="button" onClick={onUpdateImage} disabled={imageForm.processing}>
                                        {imageForm.processing ? (
                                            <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Updating...</>
                                        ) : (
                                            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Update Image</>
                                        )}
                                    </Button>
                                ) : (
                                    <Button variant="default" size="sm" type="button" onClick={onSubmitImage} disabled={imageForm.processing || !imageForm.data.image}>
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
            </div>
        </div>
    );
}