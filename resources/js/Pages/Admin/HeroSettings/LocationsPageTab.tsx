import { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import LocationsPreviewPanel from './LocationsPreviewPanel';

interface LocationsPageSettings {
    id: number;
    hero_badge: string;
    hero_badge_active: boolean;
    hero_title: string;
    hero_highlight: string;
    hero_description: string | null;
    hero_image_path: string | null;
    hero_active: boolean;
    cta_title: string;
    cta_description: string | null;
    cta_active: boolean;
    is_active: boolean;
}

export default function LocationsPageTab({ settings }: { settings: LocationsPageSettings }) {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const savedImage = settings.hero_image_path ? `/storage/${settings.hero_image_path}` : null;
    const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80';
    const displaySrc = preview || savedImage || DEFAULT_HERO_IMAGE;

    const { data, setData, post, processing } = useForm({
        hero_badge: settings.hero_badge,
        hero_badge_active: settings.hero_badge_active,
        hero_title: settings.hero_title,
        hero_highlight: settings.hero_highlight,
        hero_description: settings.hero_description || '',
        hero_active: settings.hero_active,
        cta_title: settings.cta_title,
        cta_description: settings.cta_description || '',
        cta_active: settings.cta_active,
        hero_image: null as File | null,
    });

    function saveLocationsSettings() {
        post(route('admin.locations.page-settings.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    const [activeSection, setActiveSection] = useState<'hero-section' | 'cta-section'>('hero-section');
    const [showPreview, setShowPreview] = useState(true);

    const SECTION_ITEMS: { id: 'hero-section' | 'cta-section'; label: string; icon: string }[] = [
        { id: 'hero-section', label: 'Header Section', icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
        { id: 'cta-section', label: 'CTA Section', icon: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Locations Page</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Header banner and CTA section content</p>
                </div>
            </div>

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
                    {activeSection === 'hero-section' && (
                        <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-surface-900 dark:text-white">Header Section</h3>
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
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300">Badge</label>
                                        <button type="button"
                                            onClick={() => setData('hero_badge_active', !data.hero_badge_active)}
                                            className={cn(
                                                'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300',
                                                data.hero_badge_active ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
                                            )}>
                                            <span className={cn(
                                                'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300',
                                                data.hero_badge_active ? 'translate-x-4' : 'translate-x-0'
                                            )} />
                                        </button>
                                    </div>
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

                            <div className="pt-3 border-t border-surface-100 dark:border-surface-700/60">
                                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Header Background Image</label>
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
                                                setData('hero_image', file);
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
                                        <button type="button" onClick={() => { setPreview(null); setData('hero_image', null); if (inputRef.current) inputRef.current.value = ''; }}
                                            className="px-4 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-xs font-bold">
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'cta-section' && (
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
                        </div>
                    )}
                </div>

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
                                    <p className="text-[10px] text-surface-500 dark:text-surface-400">Locations page as it appears on the site</p>
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
                            <LocationsPreviewPanel
                                activeSection={activeSection}
                                hero_badge={data.hero_badge}
                                hero_badge_active={data.hero_badge_active}
                                hero_title={data.hero_title}
                                hero_highlight={data.hero_highlight}
                                hero_description={data.hero_description}
                                hero_image_path={settings.hero_image_path}
                                hero_image_preview={preview}
                                hero_active={data.hero_active}
                                cta_title={data.cta_title}
                                cta_description={data.cta_description}
                                cta_active={data.cta_active}
                            />
                        )}
                    </div>
                </div>
            </div>

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
