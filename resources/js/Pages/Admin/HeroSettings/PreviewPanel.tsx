import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const BADGE_ICON_PATHS: Record<string, string> = {
    tag: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z',
    percent: 'M14.25 7.756a4.5 4.5 0 11-8.25-3.568M3 21l18-18M21 14.25a4.5 4.5 0 00-8.25 3.568M9 21l3-3m3-3l3-3',
    dollar: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
};

function CarouselPreview({ images, badgeText, badgeIcon, headline, headlineHighlight, tagline, description, focusedField, autoplaySpeed }: {
    images: { src: string; tagline?: string | null }[];
    badgeText: string;
    badgeIcon?: string;
    headline: string;
    headlineHighlight: string;
    tagline: string;
    description: string;
    focusedField?: string | null;
    autoplaySpeed?: number;
}) {
    const [slide, setSlide] = useState(0);

    useEffect(() => {
        if (images.length < 2) return;
        const timer = setInterval(() => setSlide(s => (s + 1) % images.length), autoplaySpeed ?? 3500);
        return () => clearInterval(timer);
    }, [images.length, autoplaySpeed]);

    if (images.length === 0) return null;

    return (
        <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-brand-900 shadow-elevated">
            {images.map((img, i) => (
                <div key={i}
                    className={`absolute inset-0 transition-all duration-700 ${i === slide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/60 to-brand-900/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            <div className="relative z-10 p-5 sm:p-7 h-full flex flex-col justify-center max-w-sm">
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-full border mb-3 w-fit backdrop-blur-sm transition-all duration-300',
                    focusedField?.includes('badge')
                        ? 'bg-accent-400/30 text-accent-200 ring-2 ring-accent-400/60 border-accent-400/50'
                        : 'bg-accent-400/15 text-accent-300 border-accent-400/25'
                )}>
                    {badgeIcon && BADGE_ICON_PATHS[badgeIcon] ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d={BADGE_ICON_PATHS[badgeIcon]} />
                        </svg>
                    ) : (
                        <span className="w-1 h-1 rounded-full bg-accent-400 animate-pulse" />
                    )}
                    {badgeText || 'Premium Car Rental Service'}
                </span>
                <h3 className={cn(
                    'text-lg sm:text-xl font-bold text-white leading-tight transition-all duration-300',
                    focusedField === 'headline' && 'drop-shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                )}>
                    {headline || 'Find Your'}
                    {headlineHighlight && (
                        <span className="block gradient-text mt-0.5">{headlineHighlight}</span>
                    )}
                </h3>
                {tagline && <p className={cn(
                    'text-accent-400 font-medium text-xs mt-1.5 tracking-wide transition-all duration-300',
                    focusedField === 'tagline' && 'drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                )}>{tagline}</p>}
                {description && <p className={cn(
                    'text-surface-400 text-[11px] mt-1.5 leading-relaxed transition-all duration-300',
                    focusedField === 'description' && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]'
                )}>{description}</p>}
            </div>

            {images.length > 1 && (
                <div className="absolute bottom-3 right-4 z-10 flex gap-1.5">
                    {images.map((_, i) => (
                        <button key={i} onClick={() => setSlide(i)}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-500',
                                i === slide ? 'bg-accent-400 w-6 shadow-glow-yellow' : 'bg-white/30 hover:bg-white/60 w-1.5'
                            )} />
                    ))}
                </div>
            )}

            <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg bg-black/30 backdrop-blur-md text-white text-[10px] font-medium ring-1 ring-white/10">
                {slide + 1} / {images.length}
            </div>
        </div>
    );
}

interface PreviewPanelProps {
    images: { src: string; tagline?: string | null }[];
    badgeText: string;
    badgeIcon?: string;
    headline: string;
    headlineHighlight: string;
    tagline: string;
    description: string;
    isActive: boolean;
    currentImage: string | null;
    focusedField?: string | null;
    autoplaySpeed?: number;
}

export default function PreviewPanel({
    images,
    badgeText,
    badgeIcon,
    headline,
    headlineHighlight,
    tagline,
    description,
    isActive,
    currentImage,
    focusedField,
    autoplaySpeed,
}: PreviewPanelProps) {
    return (
        <div className="space-y-4">
            {/* Homepage hero preview */}
            <div className="rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden">
                <div className="px-3 py-2 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Homepage</span>
                </div>
                {images.length > 0 ? (
                    <CarouselPreview
                        images={images}
                        badgeText={badgeText}
                        badgeIcon={badgeIcon}
                        headline={headline}
                        headlineHighlight={headlineHighlight}
                        tagline={tagline}
                        description={description}
                        focusedField={focusedField}
                        autoplaySpeed={autoplaySpeed}
                    />
                ) : (
                    <div className="relative w-full h-48 rounded-none overflow-hidden bg-brand-900">
                        {currentImage && (
                            <img src={currentImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className={cn(
                            'absolute inset-0',
                            currentImage
                                ? 'bg-gradient-to-r from-brand-900/95 via-brand-900/60 to-brand-900/20'
                                : 'bg-gradient-to-br from-brand-800 to-brand-900'
                        )} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="relative z-10 p-4 h-full flex flex-col justify-center max-w-xs">
                            <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-semibold rounded-full border mb-2 w-fit backdrop-blur-sm transition-all duration-300',
                                focusedField?.includes('badge')
                                    ? 'bg-accent-400/30 text-accent-200 ring-2 ring-accent-400/60 border-accent-400/50'
                                    : 'bg-accent-400/15 text-accent-300 border-accent-400/25'
                            )}>
                                {badgeIcon && BADGE_ICON_PATHS[badgeIcon] ? (
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={BADGE_ICON_PATHS[badgeIcon]} />
                                    </svg>
                                ) : (
                                    <span className="w-1 h-1 rounded-full bg-accent-400 animate-pulse" />
                                )}
                                {badgeText || 'Premium Car Rental Service'}
                            </span>
                            <h3 className={cn(
                                'text-base font-bold text-white leading-tight transition-all duration-300',
                                focusedField === 'headline' && 'drop-shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                            )}>
                                {headline || 'Find Your'}
                                {headlineHighlight && <span className="block gradient-text mt-0.5">{headlineHighlight}</span>}
                            </h3>
                            {tagline && <p className={cn(
                                'text-accent-400 font-medium text-[10px] mt-1 transition-all duration-300',
                                focusedField === 'tagline' && 'drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                            )}>{tagline}</p>}
                            {description && <p className={cn(
                                'text-surface-400 text-[10px] mt-1 leading-relaxed line-clamp-2 transition-all duration-300',
                                focusedField === 'description' && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]'
                            )}>{description}</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-surface-400 bg-surface-50 dark:bg-surface-800/30 rounded-xl px-3 py-2">
                <span className={cn('inline-block w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-400 animate-pulse' : 'bg-surface-400')} />
                {isActive ? 'Hero banner is active and visible' : 'Hero banner is inactive and hidden'}
            </div>
        </div>
    );
}
