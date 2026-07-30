import { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

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

export default function LocationsPageTab({ settings }: { settings: LocationsPageSettings }) {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const savedImage = settings.hero_image_path ? `/storage/${settings.hero_image_path}` : null;
    const displaySrc = preview || savedImage;

    const { data, setData, post, processing } = useForm({
        hero_badge: settings.hero_badge,
        hero_title: settings.hero_title,
        hero_highlight: settings.hero_highlight,
        hero_description: settings.hero_description || '',
        hero_button_text: settings.hero_button_text,
        hero_phone_label: settings.hero_phone_label,
        hero_phone_number: settings.hero_phone_number,
        hero_active: settings.hero_active,
        cta_title: settings.cta_title,
        cta_description: settings.cta_description || '',
        cta_button_text: settings.cta_button_text,
        cta_button_url: settings.cta_button_url,
        cta_phone_label: settings.cta_phone_label,
        cta_phone_number: settings.cta_phone_number,
        cta_active: settings.cta_active,
    });

    function saveLocationsSettings() {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
        if (inputRef.current?.files?.[0]) {
            formData.append('hero_image', inputRef.current.files[0]);
        }
        post(route('admin.locations.page-settings.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    const [activePanel, setActivePanel] = useState<'hero' | 'cta'>('hero');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Locations Page</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Hero banner and CTA section content</p>
                </div>
            </div>

            <div className="flex gap-1 p-1 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass">
                <button type="button" onClick={() => setActivePanel('hero')}
                    className={cn(
                        'flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                        activePanel === 'hero'
                            ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                            : 'text-surface-500 dark:text-surface-400'
                    )}>
                    Hero Section
                </button>
                <button type="button" onClick={() => setActivePanel('cta')}
                    className={cn(
                        'flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                        activePanel === 'cta'
                            ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                            : 'text-surface-500 dark:text-surface-400'
                    )}>
                    CTA Section
                </button>
            </div>

            {activePanel === 'hero' && (
                <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white">Hero Section</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Header banner with badge, title, and phone contact</p>
                        </div>
                        <div className="ml-auto">
                            <button type="button"
                                onClick={() => setData('hero_active', !data.hero_active)}
                                className={cn(
                                    'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300',
                                    data.hero_active ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
                                )}>
                                <span className={cn(
                                    'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300',
                                    data.hero_active ? 'translate-x-5' : 'translate-x-0'
                                )} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Badge</label>
                            <input type="text" value={data.hero_badge} onChange={e => setData('hero_badge', e.target.value)}
                                className="input-field" placeholder="Our Locations" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Title</label>
                            <input type="text" value={data.hero_title} onChange={e => setData('hero_title', e.target.value)}
                                className="input-field" placeholder="Find Us" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Highlight</label>
                            <input type="text" value={data.hero_highlight} onChange={e => setData('hero_highlight', e.target.value)}
                                className="input-field" placeholder="Across Palau" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
                        <textarea rows={2} value={data.hero_description} onChange={e => setData('hero_description', e.target.value)}
                            className="input-field resize-none" placeholder="Description..." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Button Text</label>
                            <input type="text" value={data.hero_button_text} onChange={e => setData('hero_button_text', e.target.value)}
                                className="input-field" placeholder="View Locations" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Phone Label</label>
                            <input type="text" value={data.hero_phone_label} onChange={e => setData('hero_phone_label', e.target.value)}
                                className="input-field" placeholder="Call Us" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Phone Number</label>
                            <input type="text" value={data.hero_phone_number} onChange={e => setData('hero_phone_number', e.target.value)}
                                className="input-field" placeholder="+680 123 4567" />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-surface-100 dark:border-surface-700/60">
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Hero Background Image</label>
                        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-brand-900 ring-1 ring-surface-200 dark:ring-surface-700">
                            {displaySrc && (
                                <img src={displaySrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/90 to-brand-900/40" />
                            <div className="relative z-10 p-4 h-full flex items-center">
                                <h3 className="text-white font-bold text-lg">{data.hero_title} <span className="text-accent-400">{data.hero_highlight}</span></h3>
                            </div>
                        </div>
                        <div className="flex items-stretch gap-3 mt-3">
                            <label className={cn(
                                'relative flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-dashed transition-colors cursor-pointer group flex-1',
                                preview ? 'border-accent-400/50 bg-accent-400/5' : 'border-surface-300 dark:border-surface-600 hover:border-brand-400'
                            )}>
                                <input ref={inputRef} type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setPreview(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} className="sr-only" />
                                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                    {preview || savedImage ? 'Replace' : 'Upload'}
                                </span>
                            </label>
                            {(preview || savedImage) && (
                                <button type="button" onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ''; }}
                                    className="px-4 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-xs font-bold">
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activePanel === 'cta' && (
                <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                            <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white">CTA Section</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Call-to-action section at the bottom of the locations page</p>
                        </div>
                        <div className="ml-auto">
                            <button type="button"
                                onClick={() => setData('cta_active', !data.cta_active)}
                                className={cn(
                                    'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300',
                                    data.cta_active ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
                                )}>
                                <span className={cn(
                                    'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300',
                                    data.cta_active ? 'translate-x-5' : 'translate-x-0'
                                )} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Title</label>
                        <input type="text" value={data.cta_title} onChange={e => setData('cta_title', e.target.value)}
                            className="input-field" placeholder="Ready to Get Started?" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
                        <textarea rows={2} value={data.cta_description} onChange={e => setData('cta_description', e.target.value)}
                            className="input-field resize-none" placeholder="CTA description..." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Button Text</label>
                            <input type="text" value={data.cta_button_text} onChange={e => setData('cta_button_text', e.target.value)}
                                className="input-field" placeholder="Contact Us" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Button URL</label>
                            <input type="text" value={data.cta_button_url} onChange={e => setData('cta_button_url', e.target.value)}
                                className="input-field" placeholder="/contact" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Phone Label</label>
                            <input type="text" value={data.cta_phone_label} onChange={e => setData('cta_phone_label', e.target.value)}
                                className="input-field" placeholder="Call Us Today" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Phone Number</label>
                            <input type="text" value={data.cta_phone_number} onChange={e => setData('cta_phone_number', e.target.value)}
                                className="input-field" placeholder="+680 123 4567" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                <p className="text-xs text-surface-400 dark:text-surface-500">
                    Changes are applied immediately after saving.
                </p>
                <Button variant="default" onClick={saveLocationsSettings} disabled={processing}>
                    {processing ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Save Locations Page</>
                    )}
                </Button>
            </div>
        </div>
    );
}
