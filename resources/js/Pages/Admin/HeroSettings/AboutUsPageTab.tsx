import { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

interface StatItem {
    value: string;
    label: string;
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
    stats: StatItem[] | null;
    is_active: boolean;
}

export default function AboutUsPageTab({ settings }: { settings: AboutUsSettings }) {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const savedImage = settings.hero_image_path ? '/storage/' + settings.hero_image_path : null;
    const displaySrc = preview || savedImage;

    const { data, setData, post, processing, errors } = useForm({
        hero_badge: settings.hero_badge,
        hero_title: settings.hero_title,
        hero_highlight: settings.hero_highlight,
        hero_description: settings.hero_description || '',
        story_heading: settings.story_heading,
        story_content: settings.story_content || '',
        mission_text: settings.mission_text || '',
        vision_text: settings.vision_text || '',
        stats: settings.stats || [
            { value: '10+', label: 'Years Experience' },
            { value: '500+', label: 'Happy Customers' },
            { value: '50+', label: 'Premium Vehicles' },
        ],
        is_active: settings.is_active,
    });

    function saveAboutUsSettings() {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'stats') {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });
        if (inputRef.current?.files?.[0]) {
            formData.append('hero_image', inputRef.current.files[0]);
        }
        post(route('admin.about-us-settings.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    function updateStat(index: number, field: 'value' | 'label', val: string) {
        const newStats = [...(data.stats || [])];
        newStats[index] = { ...newStats[index], [field]: val };
        setData('stats', newStats);
    }

    function addStat() {
        setData('stats', [...(data.stats || []), { value: '', label: '' }]);
    }

    function removeStat(index: number) {
        const newStats = (data.stats || []).filter((_, i) => i !== index);
        setData('stats', newStats);
    }

    const [activeSubTab, setActiveSubTab] = useState<'hero' | 'story' | 'stats'>('hero');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">About Us Page</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Hero banner, company story, mission, vision, and stats</p>
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

            <div className="flex gap-1 p-1 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass">
                {[
                    { id: 'hero', label: 'Hero Section', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z' },
                    { id: 'story', label: 'Story & Values', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
                    { id: 'stats', label: 'Stats', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
                ].map(tab => (
                    <button key={tab.id} type="button" onClick={() => setActiveSubTab(tab.id as any)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                            activeSubTab === tab.id
                                ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                                : 'text-surface-500 dark:text-surface-400'
                        )}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                        </svg>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeSubTab === 'hero' && (
                <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white">Hero Section</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Header banner with badge, title, highlight, and background image</p>
                        </div>
                        <div className="ml-auto">
                            <button type="button" onClick={() => setData('is_active', !data.is_active)}
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Badge</label>
                            <input type="text" value={data.hero_badge} onChange={e => setData('hero_badge', e.target.value)}
                                className="input-field" placeholder="About Us" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Title</label>
                            <input type="text" value={data.hero_title} onChange={e => setData('hero_title', e.target.value)}
                                className="input-field" placeholder="Our Story" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Highlight</label>
                            <input type="text" value={data.hero_highlight} onChange={e => setData('hero_highlight', e.target.value)}
                                className="input-field" placeholder="Driven by Excellence" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
                        <textarea rows={2} value={data.hero_description} onChange={e => setData('hero_description', e.target.value)}
                            className="input-field resize-none" placeholder="Hero description..." />
                    </div>
                    <div className="pt-3 border-t border-surface-100 dark:border-surface-700/60">
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Hero Background Image</label>
                        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-brand-900 ring-1 ring-surface-200 dark:ring-surface-700">
                            {displaySrc && <img src={displaySrc} alt="" className="absolute inset-0 w-full h-full object-cover" />}
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

            {activeSubTab === 'story' && (
                <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                            <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white">Story & Values</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Company story, mission, and vision</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Story Heading</label>
                        <input type="text" value={data.story_heading} onChange={e => setData('story_heading', e.target.value)}
                            className="input-field" placeholder="Our Journey" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Story Content</label>
                        <textarea rows={6} value={data.story_content} onChange={e => setData('story_content', e.target.value)}
                            className="input-field resize-none" placeholder="Tell your company story here..." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Mission</label>
                            <textarea rows={3} value={data.mission_text} onChange={e => setData('mission_text', e.target.value)}
                                className="input-field resize-none" placeholder="Our mission statement..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Vision</label>
                            <textarea rows={3} value={data.vision_text} onChange={e => setData('vision_text', e.target.value)}
                                className="input-field resize-none" placeholder="Our vision statement..." />
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'stats' && (
                <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                            <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white">Statistics</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Highlight numbers displayed on the About Us page</p>
                        </div>
                        <button type="button" onClick={addStat}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-400 text-brand-900 font-bold text-xs rounded-xl hover:bg-accent-300 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add Stat
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(data.stats || []).map((stat, i) => (
                            <div key={i} className="p-4 rounded-xl bg-surface-50/70 dark:bg-brand-900/30 border border-surface-100 dark:border-surface-700/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Stat #{i + 1}</span>
                                    <button type="button" onClick={() => removeStat(i)}
                                        className="p-1 text-surface-400 hover:text-red-500 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 mb-0.5">Value</label>
                                    <input type="text" value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)}
                                        className="input-field" placeholder="e.g. 500+" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 mb-0.5">Label</label>
                                    <input type="text" value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)}
                                        className="input-field" placeholder="e.g. Happy Customers" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {(data.stats || []).length === 0 && (
                        <div className="text-center py-8 text-surface-400">
                            <p className="text-sm font-semibold">No stats yet. Click Add Stat to add one.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                <p className="text-xs text-surface-400 dark:text-surface-500">
                    Changes are applied immediately after saving.
                </p>
                <Button variant="default" onClick={saveAboutUsSettings} disabled={processing}>
                    {processing ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Save About Us Page</>
                    )}
                </Button>
            </div>
        </div>
    );
}
