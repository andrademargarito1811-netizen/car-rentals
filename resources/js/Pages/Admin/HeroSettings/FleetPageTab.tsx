import { useState, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

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

export default function FleetPageTab({ settings }: { settings: FleetSettings }) {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=800&fit=crop';
    const savedImage = settings.hero_image_path ? `/storage/${settings.hero_image_path}` : null;
    const displaySrc = preview || savedImage || FALLBACK_IMAGE;

    const { data, setData, post, processing, errors } = useForm({
        hero_badge: settings.hero_badge,
        hero_title: settings.hero_title,
        hero_highlight: settings.hero_highlight,
        hero_description: settings.hero_description || '',
        section_heading: settings.section_heading,
        section_subheading: settings.section_subheading,
        is_active: settings.is_active,
    });

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function handleRemove() {
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    }

    function saveFleetSettings() {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
        if (inputRef.current?.files?.[0]) {
            formData.append('hero_image', inputRef.current.files[0]);
        }
        post(route('admin.fleet-page-settings.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Fleet Page</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Hero banner, heading text, and section content</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Hero Content */}
                <div className="space-y-5">
                    <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-surface-900 dark:text-white">Hero Content</h3>
                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Header banner text and background image</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Badge Text</label>
                            <input type="text" value={data.hero_badge} onChange={e => setData('hero_badge', e.target.value)}
                                className="input-field" placeholder="Browse Our Fleet" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Hero Title</label>
                                <input type="text" value={data.hero_title} onChange={e => setData('hero_title', e.target.value)}
                                    className="input-field" placeholder="Explore Our" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Hero Highlight</label>
                                <input type="text" value={data.hero_highlight} onChange={e => setData('hero_highlight', e.target.value)}
                                    className="input-field" placeholder="Premium Fleet" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Hero Description</label>
                            <textarea rows={2} value={data.hero_description} onChange={e => setData('hero_description', e.target.value)}
                                className="input-field resize-none" placeholder="Describe the fleet page hero..." />
                        </div>

                        <div className="pt-3 border-t border-surface-100 dark:border-surface-700/60">
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Hero Background Image</label>
                            <div className="relative w-full h-36 rounded-xl overflow-hidden bg-brand-900 ring-1 ring-surface-200 dark:ring-surface-700">
                                <img src={displaySrc} alt="Fleet hero" className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-900/50" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="relative z-10 p-4 h-full flex flex-col justify-center">
                                    <h3 className="text-lg font-bold text-white">{data.hero_title} <span className="text-accent-400">{data.hero_highlight}</span></h3>
                                    {data.hero_description && (
                                        <p className="text-surface-400 text-xs mt-1 line-clamp-1">{data.hero_description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-stretch gap-3 mt-3">
                                <label className={cn(
                                    'relative flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-dashed transition-colors cursor-pointer group flex-1',
                                    preview ? 'border-accent-400/50 bg-accent-400/5' : 'border-surface-300 dark:border-surface-600 hover:border-brand-400'
                                )}>
                                    <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="sr-only" />
                                    <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                        {preview || savedImage ? 'Replace image' : 'Upload image'}
                                    </span>
                                </label>
                                {(preview || savedImage) && (
                                    <button type="button" onClick={handleRemove}
                                        className="px-4 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-xs font-bold">
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Section Content */}
                <div className="space-y-5">
                    <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                                <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-surface-900 dark:text-white">Section Content</h3>
                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Heading and subheading for the fleet listing area</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Section Heading</label>
                            <input type="text" value={data.section_heading} onChange={e => setData('section_heading', e.target.value)}
                                className="input-field" placeholder="Find Your Perfect Drive" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Section Subheading</label>
                            <textarea rows={2} value={data.section_subheading} onChange={e => setData('section_subheading', e.target.value)}
                                className="input-field resize-none" placeholder="Choose from our wide selection of premium vehicles" />
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-surface-900 dark:text-white">Page Active</h3>
                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Show or hide the fleet page hero section</p>
                            </div>
                            <button type="button"
                                onClick={() => setData('is_active', !data.is_active)}
                                className={cn(
                                    'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300',
                                    data.is_active ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
                                )}>
                                <span className={cn(
                                    'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300',
                                    data.is_active ? 'translate-x-5' : 'translate-x-0'
                                )} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                <p className="text-xs text-surface-400 dark:text-surface-500">
                    Changes are applied immediately after saving.
                </p>
                <Button variant="default" onClick={saveFleetSettings} disabled={processing}>
                    {processing ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Save Fleet Page</>
                    )}
                </Button>
            </div>
        </div>
    );
}
