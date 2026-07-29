import { useEffect, useState } from 'react';

interface HeroPreviewProps {
    hero_badge: string;
    hero_title: string;
    hero_highlight: string;
    hero_description: string | null;
    hero_image_path: string | null;
    hero_image_file: File | null;
    hero_button_text: string;
    hero_phone_label: string;
    hero_phone_number: string;
    hero_active: boolean;
}

export default function HeroPreview({
    hero_badge,
    hero_title,
    hero_highlight,
    hero_description,
    hero_image_path,
    hero_image_file,
    hero_button_text,
    hero_phone_label,
    hero_phone_number,
    hero_active,
}: HeroPreviewProps) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const imageUrl = hero_image_file
        ? URL.createObjectURL(hero_image_file)
        : hero_image_path
            ? `/storage/${hero_image_path}`
            : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80';

    useEffect(() => {
        return () => {
            if (hero_image_file) URL.revokeObjectURL(imageUrl);
        };
    }, [hero_image_file, imageUrl]);

    return (
        <section className="relative min-h-[260px] flex items-center justify-center overflow-hidden rounded-xl border border-surface-200/60 dark:border-surface-700/40">
            {!hero_active && (
                <div className="absolute inset-0 z-20 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-sm font-medium text-white/80">Section is inactive</span>
                    </span>
                </div>
            )}

            <div className="absolute inset-0">
                <img
                    src={imageUrl}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-surface-900/70 via-surface-900/50 to-surface-900/80" />
            </div>

            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                }}
            />

            <div className="relative z-10 text-center px-4 max-w-3xl mx-auto py-8">
                <div
                    className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                        <span className="text-xs font-medium text-white/90">{hero_badge || 'Palau, Micronesia'}</span>
                    </div>
                </div>

                <h2
                    className={`text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                    {hero_title || 'Our'}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">
                        {hero_highlight || 'Locations'}
                    </span>
                </h2>

                {hero_description && (
                    <p
                        className={`text-sm sm:text-base text-white/70 max-w-xl mx-auto mb-6 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    >
                        {hero_description}
                    </p>
                )}

                <div
                    className={`flex items-center justify-center gap-3 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent-400 text-surface-900 text-sm font-semibold rounded-xl">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        {hero_button_text || 'View Locations'}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white text-sm font-semibold rounded-xl border border-white/20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {hero_phone_label || 'Call Us'}
                    </span>
                </div>
            </div>
        </section>
    );
}
