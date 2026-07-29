import { cn } from '@/lib/utils';

interface TextContentData {
    badge_text: string;
    badge_enabled: boolean;
    badge_icon: string;
    booking_badge_text: string;
    booking_badge_enabled: boolean;
    booking_badge_icon: string;
    headline: string;
    headline_highlight: string;
    tagline: string;
    description: string;
    is_active: boolean;
}

interface TextContentSectionProps {
    data: TextContentData;
    onSetData: (key: string, value: string | boolean) => void;
    errors: Record<string, string>;
    onToggleActive: () => void;
}

const BADGE_ICONS = [
    { value: 'tag', label: 'Tag' },
    { value: 'percent', label: 'Percent' },
    { value: 'dollar', label: 'Dollar' },
    { value: 'star', label: 'Star' },
    { value: 'shield', label: 'Shield' },
    { value: 'location', label: 'Location' },
];

const BADGE_ICON_PATHS: Record<string, string> = {
    tag: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z',
    percent: 'M14.25 7.756a4.5 4.5 0 11-8.25-3.568M3 21l18-18M21 14.25a4.5 4.5 0 00-8.25 3.568M9 21l3-3m3-3l3-3',
    dollar: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
};

function BadgeConfig({ prefix, label, data, onSetData, errors }: {
    prefix: string;
    label: string;
    data: TextContentData;
    onSetData: (key: string, value: string | boolean) => void;
    errors: Record<string, string>;
}) {
    const textKey = `${prefix}_text` as keyof TextContentData;
    const enabledKey = `${prefix}_enabled` as keyof TextContentData;
    const iconKey = `${prefix}_icon` as keyof TextContentData;

    return (
        <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5 space-y-4">
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">{label}</span>
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <input type="text" value={data[textKey] as string} onChange={e => onSetData(textKey, e.target.value)}
                        className="input-field" placeholder="Badge text..." />
                    {errors[textKey] && <p className="mt-1 text-xs text-red-500">{errors[textKey]}</p>}
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <button type="button"
                        onClick={() => onSetData(enabledKey, !(data[enabledKey] as boolean))}
                        className={cn(
                            'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                            (data[enabledKey] as boolean) ? 'bg-accent-500' : 'bg-surface-300 dark:bg-surface-600'
                        )}>
                        <span className={cn(
                            'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300',
                            (data[enabledKey] as boolean) ? 'translate-x-5' : 'translate-x-0'
                        )} />
                    </button>
                    <span className="text-[10px] font-medium text-surface-500 dark:text-surface-400">{(data[enabledKey] as boolean) ? 'On' : 'Off'}</span>
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-semibold text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wider">Icon</label>
                <div className="relative">
                    <select value={data[iconKey] as string} onChange={e => onSetData(iconKey, e.target.value)}
                        className="input-field appearance-none cursor-pointer pr-10">
                        {BADGE_ICONS.map(ico => (
                            <option key={ico.value} value={ico.value}>{ico.label}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                    <svg className="w-3.5 h-3.5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d={BADGE_ICON_PATHS[data[iconKey] as string]} />
                    </svg>
                    <span className="text-[10px] text-surface-400">{BADGE_ICONS.find(i => i.value === data[iconKey])?.label}</span>
                </div>
                {errors[iconKey] && <p className="mt-1 text-xs text-red-500">{errors[iconKey]}</p>}
            </div>
        </div>
    );
}

export default function TextContentSection({ data, onSetData, errors, onToggleActive }: TextContentSectionProps) {
    return (
        <div className="group/card relative overflow-hidden bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-400/5 rounded-full blur-3xl group-hover/card:bg-accent-400/5 transition-colors duration-700" />
            <div className="relative px-6 sm:px-8 py-4 border-b border-surface-100 dark:border-surface-700/60">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-surface-900 dark:text-white">Text Content</h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Edit the headline, tagline, and badges shown across the site.</p>
                    </div>
                </div>
            </div>
            <div className="relative p-6 sm:p-8">
                <div className="space-y-5 max-w-2xl">
                    <BadgeConfig prefix="badge" label="Hero Badge (above Find Your)" data={data} onSetData={onSetData} errors={errors} />
                    <BadgeConfig prefix="booking_badge" label="Booking Badge (next to Book Your Ride)" data={data} onSetData={onSetData} errors={errors} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Headline</label>
                            <input type="text" value={data.headline} onChange={e => onSetData('headline', e.target.value)}
                                className="input-field" placeholder="Find Your" />
                            {errors.headline && <p className="mt-1 text-xs text-red-500">{errors.headline}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Headline Highlight</label>
                            <input type="text" value={data.headline_highlight} onChange={e => onSetData('headline_highlight', e.target.value)}
                                className="input-field" placeholder="Perfect Ride" />
                            {errors.headline_highlight && <p className="mt-1 text-xs text-red-500">{errors.headline_highlight}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Tagline</label>
                        <input type="text" value={data.tagline} onChange={e => onSetData('tagline', e.target.value)}
                            className="input-field" placeholder="Drive Your Dreams, One Mile at a Time" />
                        {errors.tagline && <p className="mt-1 text-xs text-red-500">{errors.tagline}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
                        <textarea value={data.description} onChange={e => onSetData('description', e.target.value)}
                            className="input-field resize-none" rows={3} placeholder="Browse our fleet of premium vehicles..." />
                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-surface-100 dark:border-surface-700/60">
                        <button type="button"
                            onClick={onToggleActive}
                            className={cn(
                                'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                                data.is_active ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
                            )}>
                            <span className={cn(
                                'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300',
                                data.is_active ? 'translate-x-5' : 'translate-x-0'
                            )} />
                        </button>
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Hero banner active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
