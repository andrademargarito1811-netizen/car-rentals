import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';

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
}: CarouselImagesSectionProps) {
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
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Manage the rotating image gallery on the right side of the hero.</p>
                    </div>
                </div>
                <Button variant="accent" size="sm" onClick={() => onSetShowImageForm(true)}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Image
                </Button>
            </div>

            <div className="relative p-6 sm:p-8">
                {settings.images.length === 0 ? (
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {settings.images.map((img, i) => (
                            <div key={img.id}
                                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                                onClick={() => onLightbox({ src: `/storage/${img.image_path}`, alt: img.alt_text || '' })}>
                                <img src={`/storage/${img.image_path}`} alt={img.alt_text || ''}
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />

                                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium ring-1 ring-white/10">
                                    #{i + 1}
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 translate-y-2 group-hover:translate-y-0">
                                    <p className="text-white text-xs font-medium truncate leading-tight">
                                        {img.tagline || <span className="italic text-white/50">No tagline</span>}
                                    </p>
                                    {img.alt_text && (
                                        <p className="text-white/50 text-[10px] truncate mt-0.5">{img.alt_text}</p>
                                    )}
                                    <div className="flex items-center gap-1 mt-2">
                                        <button type="button" onClick={e => { e.stopPropagation(); onEditImage(img); }}
                                            className="flex-1 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold hover:bg-white/30 transition-colors text-center">
                                            <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button type="button" onClick={e => { e.stopPropagation(); onLightbox({ src: `/storage/${img.image_path}`, alt: img.alt_text || '' }); }}
                                            className="flex-1 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold hover:bg-white/30 transition-colors text-center">
                                            View
                                        </button>
                                        <button type="button" onClick={e => { e.stopPropagation(); onDeleteImage(img); }}
                                            className="py-1 px-2 rounded-lg bg-red-500/60 backdrop-blur-sm text-white text-[10px] font-semibold hover:bg-red-500/80 transition-colors">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showImageForm && (
                    <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-brand-50/80 to-brand-100/50 dark:from-surface-800/50 dark:to-surface-800/20 border border-brand-200/70 dark:border-surface-700/60 backdrop-blur-sm animate-fade-in-up">
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
                                <div className="relative w-28 h-20 shrink-0 rounded-xl border-2 border-dashed border-brand-300 dark:border-surface-600 bg-white dark:bg-surface-800/50 group cursor-pointer overflow-hidden transition-all duration-300 hover:border-brand-400 hover:shadow-glow-blue">
                                    <input type="file" onChange={onImageFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                    ) : editingImage ? (
                                        <img src={`/storage/${editingImage.image_path}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 transition-transform duration-200 group-hover:scale-105">
                                            <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
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
