import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

interface HeroImage {
    id: number;
    image_path: string;
    alt_text: string | null;
    caption: string | null;
    sort_order: number;
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
    hero_images: HeroImage[];
}

export default function ReservationPageTab({ settings }: { settings: ReservationSettings }) {
    const [activeSubTab, setActiveSubTab] = useState<'hero' | 'terms'>('hero');

    const { data, setData, post, processing } = useForm({
        badge_text: settings.badge_text,
        headline: settings.headline,
        headline_highlight: settings.headline_highlight,
        subtitle: settings.subtitle || '',
        stat_pills: settings.stat_pills || [
            { icon: 'location', text: '' },
            { icon: 'shield', text: '' },
            { icon: 'clock', text: '' },
        ],
        is_active: settings.is_active,
        booking_terms: settings.booking_terms || '',
    });

    function saveReservationSettings() {
        post(route('admin.reservation-settings.update'), {
            preserveScroll: true,
        });
    }

    function updateStatPill(index: number, field: 'icon' | 'text', value: string) {
        const newPills = [...(data.stat_pills || [])];
        newPills[index] = { ...newPills[index], [field]: value };
        setData('stat_pills', newPills);
    }

    const STAT_ICONS: Record<string, string> = {
        location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
        shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        car: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
        star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
        support: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Reservation Page</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Hero content, stat pills, and booking terms & conditions</p>
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

            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass">
                <button type="button" onClick={() => setActiveSubTab('hero')}
                    className={cn(
                        'flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                        activeSubTab === 'hero'
                            ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                            : 'text-surface-500 dark:text-surface-400'
                    )}>
                    Hero Content
                </button>
                <button type="button" onClick={() => setActiveSubTab('terms')}
                    className={cn(
                        'flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                        activeSubTab === 'terms'
                            ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                            : 'text-surface-500 dark:text-surface-400'
                    )}>
                    Terms & Conditions
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeSubTab === 'hero' && (
                    <>
                        <div className="space-y-5">
                            <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-surface-900 dark:text-white">Hero Content</h3>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Header text, badge, and stat pills</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Badge Text</label>
                                    <input type="text" value={data.badge_text} onChange={e => setData('badge_text', e.target.value)}
                                        className="input-field" placeholder="Palau Exclusive" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Headline</label>
                                        <input type="text" value={data.headline} onChange={e => setData('headline', e.target.value)}
                                            className="input-field" placeholder="Reserve Your" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Highlight</label>
                                        <input type="text" value={data.headline_highlight} onChange={e => setData('headline_highlight', e.target.value)}
                                            className="input-field" placeholder="Ride" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Subtitle</label>
                                    <textarea rows={2} value={data.subtitle} onChange={e => setData('subtitle', e.target.value)}
                                        className="input-field resize-none" placeholder="Complete the form below to secure your perfect vehicle..." />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                                        <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-surface-900 dark:text-white">Stat Pills</h3>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Highlight stats shown on the reservation page</p>
                                    </div>
                                </div>

                                {(data.stat_pills || []).map((pill, i) => (
                                    <div key={i} className="flex items-stretch gap-3 p-3 rounded-xl bg-surface-50/70 dark:bg-brand-900/30 border border-surface-100 dark:border-surface-700/50">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Icon</label>
                                            <select value={pill.icon} onChange={e => updateStatPill(i, 'icon', e.target.value)}
                                                className="input-field appearance-none cursor-pointer text-xs">
                                                {Object.keys(STAT_ICONS).map(ico => (
                                                    <option key={ico} value={ico}>{ico}</option>
                                                ))}
                                            </select>
                                            <svg className="w-4 h-4 text-accent-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={STAT_ICONS[pill.icon]} />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Text</label>
                                            <input type="text" value={pill.text} onChange={e => updateStatPill(i, 'text', e.target.value)}
                                                className="input-field mt-0.5" placeholder="e.g. 300+ Cars" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeSubTab === 'terms' && (
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 p-6 space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-surface-900 dark:text-white">Booking Terms & Conditions</h3>
                                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Terms shown during the reservation process</p>
                                </div>
                            </div>
                            <textarea rows={12} value={data.booking_terms} onChange={e => setData('booking_terms', e.target.value)}
                                className="input-field resize-none font-mono text-sm" placeholder="Enter booking terms and conditions (HTML supported)..." />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                <p className="text-xs text-surface-400 dark:text-surface-500">
                    Changes are applied immediately after saving.
                </p>
                <Button variant="default" onClick={saveReservationSettings} disabled={processing}>
                    {processing ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Save Reservation Page</>
                    )}
                </Button>
            </div>
        </div>
    );
}
