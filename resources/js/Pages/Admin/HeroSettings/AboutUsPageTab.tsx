import { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

interface StatItem {
    value: string;
    label: string;
}

interface ValueItem {
    icon: string;
    title: string;
    description: string;
    color: string;
}

interface TeamMember {
    name: string;
    role: string | null;
    image_path: string | null;
    image?: File | null;
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
    story_image_path: string | null;
    mission_text: string | null;
    vision_text: string | null;
    stats: StatItem[] | null;
    values: ValueItem[] | null;
    team_members: TeamMember[] | null;
    is_active: boolean;
}

const DEFAULT_STATS: StatItem[] = [
    { value: '500+', label: 'Vehicles in Fleet' },
    { value: '4', label: 'Convenient Locations' },
    { value: '98%', label: 'Customer Satisfaction' },
    { value: '10+', label: 'Years of Service' },
];

const DEFAULT_VALUES: ValueItem[] = [
    {
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        title: 'Reliability',
        description: 'Every vehicle undergoes rigorous inspection and maintenance to ensure your safety and peace of mind on every journey.',
        color: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
    },
    {
        icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        title: 'Transparency',
        description: 'No hidden fees, no surprises. We believe in clear pricing and honest communication with every customer.',
        color: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
    },
    {
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        title: 'Speed & Efficiency',
        description: 'From online booking to key handover, we\'ve streamlined every step to get you on the road faster.',
        color: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
    },
    {
        icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        title: '24/7 Support',
        description: 'Our dedicated support team is available around the clock to assist you, wherever the road takes you.',
        color: 'bg-violet-500/10 text-violet-600 ring-violet-500/20',
    },
];

const DEFAULT_TEAM: TeamMember[] = [
    { name: 'Sarah Mitchell', role: 'Founder & CEO', image_path: 'https://ui-avatars.com/api/?name=Sarah+Mitchell&background=1e293b&color=fff&size=128' },
    { name: 'James Rodriguez', role: 'Operations Director', image_path: 'https://ui-avatars.com/api/?name=James+Rodriguez&background=334155&color=fff&size=128' },
    { name: 'Emily Chen', role: 'Customer Experience Lead', image_path: 'https://ui-avatars.com/api/?name=Emily+Chen&background=475569&color=fff&size=128' },
    { name: 'Michael Thompson', role: 'Fleet Manager', image_path: 'https://ui-avatars.com/api/?name=Michael+Thompson&background=1e293b&color=fff&size=128' },
];

const ICON_OPTIONS: { label: string; value: string }[] = [
    { label: 'Shield Check', value: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Info', value: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Lightning', value: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Headset', value: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Shield', value: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { label: 'Heart', value: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
    { label: 'Star', value: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
    { label: 'Map Pin', value: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
];

const COLOR_OPTIONS: { label: string; value: string }[] = [
    { label: 'Emerald', value: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' },
    { label: 'Blue', value: 'bg-blue-500/10 text-blue-600 ring-blue-500/20' },
    { label: 'Amber', value: 'bg-amber-500/10 text-amber-600 ring-amber-500/20' },
    { label: 'Violet', value: 'bg-violet-500/10 text-violet-600 ring-violet-500/20' },
    { label: 'Rose', value: 'bg-rose-500/10 text-rose-600 ring-rose-500/20' },
    { label: 'Slate', value: 'bg-slate-500/10 text-slate-600 ring-slate-500/20' },
];

function teamImageSrc(member: TeamMember): string | null {
    if (!member.image_path) return null;
    return member.image_path.startsWith('http') ? member.image_path : '/storage/' + member.image_path;
}

export default function AboutUsPageTab({ settings }: { settings: AboutUsSettings }) {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [storyPreview, setStoryPreview] = useState<string | null>(null);
    const storyInputRef = useRef<HTMLInputElement>(null);
    const [teamPreviews, setTeamPreviews] = useState<(string | null)[]>(() =>
        (settings.team_members || DEFAULT_TEAM).map((m) => teamImageSrc(m))
    );
    const [activeSubTab, setActiveSubTab] = useState<'hero' | 'story' | 'stats' | 'values' | 'team'>('hero');

    const savedImage = settings.hero_image_path ? '/storage/' + settings.hero_image_path : null;
    const displaySrc = preview || savedImage;
    const savedStoryImage = settings.story_image_path ? '/storage/' + settings.story_image_path : null;
    const storyDisplaySrc = storyPreview || savedStoryImage;

    const { data, setData, post, processing, errors } = useForm({
        hero_badge: settings.hero_badge,
        hero_title: settings.hero_title,
        hero_highlight: settings.hero_highlight,
        hero_description: settings.hero_description || '',
        story_heading: settings.story_heading,
        story_content: settings.story_content || '',
        mission_text: settings.mission_text || '',
        vision_text: settings.vision_text || '',
        stats: settings.stats || DEFAULT_STATS,
        values: settings.values || DEFAULT_VALUES,
        team_members: (settings.team_members || DEFAULT_TEAM).map<TeamMember>((m) => ({ ...m, image: null })),
        is_active: settings.is_active,
        hero_image: null as File | null,
        story_image: null as File | null,
    });

    function saveAboutUsSettings() {
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

    function updateValue(index: number, field: keyof ValueItem, val: string) {
        const newValues = [...(data.values || [])];
        newValues[index] = { ...newValues[index], [field]: val };
        setData('values', newValues);
    }

    function addValue() {
        setData('values', [...(data.values || []), { icon: ICON_OPTIONS[0].value, title: '', description: '', color: COLOR_OPTIONS[0].value }]);
    }

    function removeValue(index: number) {
        const newValues = (data.values || []).filter((_, i) => i !== index);
        setData('values', newValues);
    }

    function updateTeamMember(index: number, field: 'name' | 'role', val: string) {
        const newMembers = [...(data.team_members || [])];
        newMembers[index] = { ...newMembers[index], [field]: val };
        setData('team_members', newMembers);
    }

    function addTeamMember() {
        setData('team_members', [...(data.team_members || []), { name: '', role: '', image_path: null, image: null }]);
        setTeamPreviews((p) => [...p, null]);
    }

    function removeTeamMember(index: number) {
        const newMembers = (data.team_members || []).filter((_, i) => i !== index);
        setData('team_members', newMembers);
        setTeamPreviews((p) => p.filter((_, i) => i !== index));
    }

    function onTeamImageChange(index: number, file: File | null) {
        const newMembers = [...(data.team_members || [])];
        newMembers[index] = { ...newMembers[index], image: file, ...(file ? {} : { image_path: null }) };
        setData('team_members', newMembers);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setTeamPreviews((p) => {
                const np = [...p];
                np[index] = ev.target?.result as string;
                return np;
            });
            reader.readAsDataURL(file);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">About Us Page</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Hero banner, company story, mission, vision, values, team, and stats</p>
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

            <div className="flex gap-1 p-1 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass overflow-x-auto">
                {[
                    { id: 'hero', label: 'Hero Section', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z' },
                    { id: 'story', label: 'Story', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
                    { id: 'stats', label: 'Stats', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
                    { id: 'values', label: 'Values', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
                    { id: 'team', label: 'Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                ].map(tab => (
                    <button key={tab.id} type="button" onClick={() => setActiveSubTab(tab.id as any)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                            activeSubTab === tab.id
                                ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                        )}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
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

            {activeSubTab === 'story' && (
                <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                            <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white">Story</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Company story, image, mission, and vision</p>
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
                    <div className="pt-3 border-t border-surface-100 dark:border-surface-700/60">
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Story Image</label>
                        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-surface-100 dark:bg-brand-900 ring-1 ring-surface-200 dark:ring-surface-700">
                            {storyDisplaySrc && <img src={storyDisplaySrc} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                        </div>
                        <div className="flex items-stretch gap-3 mt-3">
                            <label className={cn(
                                'relative flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-dashed transition-colors cursor-pointer group flex-1',
                                storyPreview ? 'border-accent-400/50 bg-accent-400/5' : 'border-surface-300 dark:border-surface-600 hover:border-brand-400'
                            )}>
                                <input ref={storyInputRef} type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setData('story_image', file);
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setStoryPreview(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} className="sr-only" />
                                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                    {storyPreview || savedStoryImage ? 'Replace' : 'Upload'}
                                </span>
                            </label>
                            {(storyPreview || savedStoryImage) && (
                                <button type="button" onClick={() => { setStoryPreview(null); setData('story_image', null); if (storyInputRef.current) storyInputRef.current.value = ''; }}
                                    className="px-4 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-xs font-bold">
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-surface-100 dark:border-surface-700/60">
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

            {activeSubTab === 'values' && (
                <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                            <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white">Values</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Core value cards displayed on the About Us page</p>
                        </div>
                        <button type="button" onClick={addValue}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-400 text-brand-900 font-bold text-xs rounded-xl hover:bg-accent-300 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add Value
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(data.values || []).map((value, i) => (
                            <div key={i} className="p-4 rounded-xl bg-surface-50/70 dark:bg-brand-900/30 border border-surface-100 dark:border-surface-700/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Value #{i + 1}</span>
                                    <button type="button" onClick={() => removeValue(i)}
                                        className="p-1 text-surface-400 hover:text-red-500 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-surface-500 mb-0.5">Title</label>
                                        <input type="text" value={value.title} onChange={e => updateValue(i, 'title', e.target.value)}
                                            className="input-field" placeholder="e.g. Reliability" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-surface-500 mb-0.5">Icon</label>
                                        <select value={value.icon} onChange={e => updateValue(i, 'icon', e.target.value)}
                                            className="input-field">
                                            {ICON_OPTIONS.map((opt) => (
                                                <option key={opt.label} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 mb-0.5">Description</label>
                                    <textarea rows={2} value={value.description} onChange={e => updateValue(i, 'description', e.target.value)}
                                        className="input-field resize-none" placeholder="Describe this value..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 mb-0.5">Color</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {COLOR_OPTIONS.map((opt) => (
                                            <button key={opt.label} type="button" onClick={() => updateValue(i, 'color', opt.value)}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold ring-1 transition-all',
                                                    value.color === opt.value
                                                        ? 'ring-2 ring-brand-500 scale-[1.02]'
                                                        : 'ring-surface-200 dark:ring-surface-700 hover:ring-brand-400'
                                                )}>
                                                <span className={cn('w-3 h-3 rounded-full ring-1 ring-black/5 shrink-0', opt.value)} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {(data.values || []).length === 0 && (
                        <div className="text-center py-8 text-surface-400">
                            <p className="text-sm font-semibold">No values yet. Click Add Value to add one.</p>
                        </div>
                    )}
                </div>
            )}

            {activeSubTab === 'team' && (
                <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                            <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white">Team Members</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Team member cards displayed on the About Us page</p>
                        </div>
                        <button type="button" onClick={addTeamMember}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-400 text-brand-900 font-bold text-xs rounded-xl hover:bg-accent-300 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add Member
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(data.team_members || []).map((member, i) => (
                            <div key={i} className="p-4 rounded-xl bg-surface-50/70 dark:bg-brand-900/30 border border-surface-100 dark:border-surface-700/50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Member #{i + 1}</span>
                                    <button type="button" onClick={() => removeTeamMember(i)}
                                        className="p-1 text-surface-400 hover:text-red-500 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-200 dark:bg-brand-900 ring-1 ring-surface-200 dark:ring-surface-700 shrink-0">
                                        {teamPreviews[i] && <img src={teamPreviews[i] as string} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className={cn(
                                            'relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-colors cursor-pointer group text-xs font-semibold',
                                            teamPreviews[i] ? 'border-accent-400/50 bg-accent-400/5' : 'border-surface-300 dark:border-surface-600 hover:border-brand-400'
                                        )}>
                                            <input type="file" accept="image/*" onChange={(e) => onTeamImageChange(i, e.target.files?.[0] || null)}
                                                className="sr-only" />
                                            {teamPreviews[i] ? 'Replace Photo' : 'Upload Photo'}
                                        </label>
                                        {teamPreviews[i] && (
                                            <button type="button" onClick={() => onTeamImageChange(i, null)}
                                                className="w-full px-3 py-1.5 rounded-lg border-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-xs font-bold">
                                                Remove Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 mb-0.5">Name</label>
                                    <input type="text" value={member.name} onChange={e => updateTeamMember(i, 'name', e.target.value)}
                                        className="input-field" placeholder="e.g. Sarah Mitchell" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 mb-0.5">Role</label>
                                    <input type="text" value={member.role || ''} onChange={e => updateTeamMember(i, 'role', e.target.value)}
                                        className="input-field" placeholder="e.g. Founder & CEO" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {(data.team_members || []).length === 0 && (
                        <div className="text-center py-8 text-surface-400">
                            <p className="text-sm font-semibold">No team members yet. Click Add Member to add one.</p>
                        </div>
                    )}
                </div>
            )}

            {Object.keys(errors).length > 0 && (
                <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-5 py-4">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm mb-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Please fix the following errors:
                    </div>
                    <ul className="space-y-1 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                        {Object.values(errors).map((msg, i) => (
                            <li key={i}>{msg}</li>
                        ))}
                    </ul>
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
