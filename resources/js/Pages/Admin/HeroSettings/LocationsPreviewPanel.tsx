import { cn } from '@/lib/utils';

interface LocationsPreviewPanelProps {
    activeSection: 'hero-section' | 'cta-section';
    hero_badge: string;
    hero_badge_active: boolean;
    hero_title: string;
    hero_highlight: string;
    hero_description: string | null;
    hero_image_path: string | null;
    hero_image_preview?: string | null;
    hero_active: boolean;
    cta_title: string;
    cta_description: string | null;
    cta_active: boolean;
}

export default function LocationsPreviewPanel({
    activeSection,
    hero_badge,
    hero_badge_active,
    hero_title,
    hero_highlight,
    hero_description,
    hero_image_path,
    hero_image_preview,
    hero_active,
    cta_title,
    cta_description,
    cta_active,
}: LocationsPreviewPanelProps) {
    const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80';
    const heroImage = hero_image_preview || (hero_image_path ? `/storage/${hero_image_path}` : DEFAULT_HERO_IMAGE);

    return (
        <div className="space-y-4">
            {activeSection === 'hero-section' && (
                <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden">
                    <div className="px-3 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Locations Hero</span>
                    </div>
                    <div className="relative min-h-[220px] flex items-center justify-center overflow-hidden bg-brand-900">
                        {heroImage && (
                            <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-surface-900/70 via-surface-900/50 to-surface-900/80" />
                        <div
                            className="absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize: '50px 50px',
                            }}
                        />

                        {!hero_active && (
                            <div className="absolute inset-0 z-20 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-sm font-medium text-white/80">Section is inactive</span>
                                </span>
                            </div>
                        )}

                        <div className="relative z-10 text-center px-4 py-8">
                            {hero_badge_active && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                                    <span className="text-xs font-medium text-white/90">{hero_badge || 'Palau, Micronesia'}</span>
                                </div>
                            )}
                            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                                {hero_title || 'Our'}{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">
                                    {hero_highlight || 'Locations'}
                                </span>
                            </h3>
                            {hero_description && (
                                <p className="text-xs text-white/70 max-w-xs mx-auto mb-4 line-clamp-2">{hero_description}</p>
                            )}
                            <div className="flex items-center justify-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-400 text-surface-900 text-[10px] font-semibold rounded-lg">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                    View Locations
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-semibold rounded-lg border border-white/20">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Call Us
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'cta-section' && (
                <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden">
                    <div className="px-3 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Locations CTA</span>
                    </div>
                    <div className="relative min-h-[200px] flex items-center justify-center bg-gradient-to-br from-brand-800 via-brand-900 to-surface-900 overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent-400/5 rounded-full blur-3xl" />

                        {!cta_active && (
                            <div className="absolute inset-0 z-20 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-sm font-medium text-white/80">Section is inactive</span>
                                </span>
                            </div>
                        )}

                        <div className="relative z-10 text-center px-4 py-8 max-w-xs">
                            <h3 className="text-lg font-bold text-white mb-2">
                                {cta_title || 'Ready to Hit the Road?'}
                            </h3>
                            {cta_description && (
                                <p className="text-xs text-surface-300 mb-5 line-clamp-2">{cta_description}</p>
                            )}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-400 text-surface-900 text-xs font-bold rounded-lg">
                                    Browse Vehicles
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 backdrop-blur-md text-white text-xs font-semibold rounded-lg border border-white/20">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Call Us
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 text-[10px] text-surface-400 bg-surface-50 dark:bg-surface-800/30 rounded-xl px-3 py-2">
                <span className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full',
                    (activeSection === 'hero-section' ? hero_active : cta_active) ? 'bg-emerald-400 animate-pulse' : 'bg-surface-400'
                )} />
                {activeSection === 'hero-section'
                    ? (hero_active ? 'Hero section is active and visible' : 'Hero section is inactive and hidden')
                    : (cta_active ? 'CTA section is active and visible' : 'CTA section is inactive and hidden')
                }
            </div>
        </div>
    );
}
