import { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface HeroImage {
    id: number;
    image_path: string;
    alt_text: string | null;
    caption: string | null;
    sort_order: number;
}

interface PageLocation {
    location_id: number;
    location: string;
    subtitle: string | null;
    address: string | null;
    hours: string | null;
    phone: string | null;
    image: string | null;
    features: string[] | null;
}

interface WhyBookItem {
    id: number;
    title: string;
    description: string | null;
    icon_svg: string | null;
    icon_path: string | null;
    sort_order: number;
    is_active: boolean;
}

interface ReservationSettings {
    id: number;
    badge_text: string;
    headline: string;
    headline_highlight: string;
    subtitle: string | null;
    stat_pills: { icon: string; text: string }[] | null;
    is_active: boolean;
    hero_images: HeroImage[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

function formatHours(hoursString: string): { days: string; hours: string }[] | null {
    const firstLine = hoursString.split('\n')[0].trim();
    const isPerDay = DAYS.some(d => firstLine.toLowerCase().startsWith(d.toLowerCase()));
    if (!isPerDay) return null;

    const dayHours: Record<string, { open: string; close: string; closed: boolean }> = {};
    for (const line of hoursString.split('\n')) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const dayName = line.slice(0, idx).trim();
        const range = line.slice(idx + 1).trim();
        const day = DAYS.find(d => d.toLowerCase() === dayName.toLowerCase());
        if (!day || !range) continue;
        if (range.toLowerCase() === 'closed') {
            dayHours[day] = { open: '', close: '', closed: true };
        } else {
            const parts = range.split('-').map(s => s.trim());
            dayHours[day] = { open: parts[0] || '', close: parts[1] || '', closed: false };
        }
    }

    const groups: { days: string[]; open: string; close: string; closed: boolean }[] = [];
    let current: typeof groups[0] | null = null;

    for (const day of DAYS) {
        const h = dayHours[day] || { open: '', close: '', closed: true };
        const key = h.closed ? 'closed' : `${h.open}|${h.close}`;
        const curKey = current ? (current.closed ? 'closed' : `${current.open}|${current.close}`) : null;

        if (curKey !== key || !current) {
            current = { days: [day], open: h.open, close: h.close, closed: h.closed };
            groups.push(current);
        } else {
            current.days.push(day);
        }
    }

    return groups.map(g => {
        let dayLabel: string;
        if (g.days.length === 7) {
            dayLabel = 'Open Daily';
        } else if (g.days.length > 1) {
            dayLabel = `${g.days[0]} - ${g.days[g.days.length - 1]}`;
        } else {
            dayLabel = g.days[0];
        }
        return { days: dayLabel, hours: g.closed ? 'Closed' : `${g.open} - ${g.close}` };
    });
}

const countries = [
    'Palau',
    'United States',
    'Japan',
    'Philippines',
    'Taiwan',
    'South Korea',
    'China',
    'Australia',
    'New Zealand',
    'Germany',
    'United Kingdom',
    'France',
    'Canada',
    'Other',
];

const steps = [
    { num: '01', title: 'Choose Dates', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { num: '02', title: 'Pick Location', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { num: '03', title: 'Browse Fleet', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
    { num: '04', title: 'Confirm & Go', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const STAT_PILL_ICONS: Record<string, string> = {
    location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    car: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    support: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export default function Reservation() {
    const route = useRoute();
    const { props: pageProps } = usePage();
    const settings = (pageProps.reservationSettings as ReservationSettings) || null;
    const heroSettings = (pageProps.heroSettings as any) || null;
    const pageLocations = (pageProps.pageLocations as PageLocation[]) || (pageProps.locations as PageLocation[]) || [];
    const whyBookItems = (pageProps.whyBookItems as WhyBookItem[]) || [];

    const defaultHeroImages = [
        { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=600&fit=crop&q=80', alt: 'Palau Beach', caption: 'Crystal Clear Waters' },
        { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&h=600&fit=crop&q=80', alt: 'Tropical Ocean', caption: 'Pristine Coral Reefs' },
    ];
    const heroImages = settings?.hero_images?.length
        ? settings.hero_images.map(img => ({
            url: img.image_path.startsWith('http') ? img.image_path : '/storage/' + img.image_path,
            alt: img.alt_text || '',
            caption: img.caption || '',
        }))
        : defaultHeroImages;

    const locNames = pageLocations.map(l => l.location);
    const locDetails = pageLocations.map(l => ({
        location_id: l.location_id,
        name: l.location,
        subtitle: l.subtitle || '',
        address: l.address || '',
        hours: l.hours || '',
        hourGroups: l.hours ? formatHours(l.hours) : null,
        phone: l.phone || '',
        image: l.image ? (l.image.startsWith('http') ? l.image : '/storage/' + l.image) : '',
        features: l.features || [],
    }));
    const todayPalau = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Palau' });
    const futurePalau = new Date();
    futurePalau.setDate(futurePalau.getDate() + 3);
    const returnPalau = futurePalau.toLocaleDateString('en-CA', { timeZone: 'Pacific/Palau' });
    const { data, setData, processing, errors } = useForm({
        pickup_date: todayPalau,
        pickup_time: '09:00',
        pickup_location: '',
        return_date: returnPalau,
        return_time: '09:00',
        return_location: '',
        country: '',
        confirm_age: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.visit(route('fleet', {
            pickup_date: data.pickup_date,
            pickup_time: data.pickup_time,
            pickup_location: data.pickup_location,
            return_date: data.return_date,
            return_time: data.return_time,
            return_location: data.return_location,
        }));
    };

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('opacity-100', 'translate-y-0');
                        entry.target.classList.remove('opacity-0', 'translate-y-8');
                    }
                });
            },
            { threshold: 0.1 },
        );
        document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <GuestLayout>
            <Head title="Make a Reservation" />

            {/* Hero Header */}
            {settings?.is_active !== false && (
            <section className="relative min-h-[260px] sm:min-h-[320px] overflow-hidden">
                {heroImages.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/85 to-brand-900/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                />

                <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-5 animate-fade-in-down">
                                {(() => {
                                    const iconPath: Record<string, string> = {
                                        tag: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z',
                                        percent: 'M14.25 7.756a4.5 4.5 0 11-8.25-3.568M3 21l18-18M21 14.25a4.5 4.5 0 00-8.25 3.568M9 21l3-3m3-3l3-3',
                                        dollar: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                                        star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
                                        shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
                                        location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
                                    };
                                    return heroSettings?.badge_icon && iconPath[heroSettings.badge_icon] ? (
                                        <svg className="w-3.5 h-3.5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath[heroSettings.badge_icon]} />
                                        </svg>
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                                    );
                                })()}
                                <span className="text-sm font-medium text-white/90">{heroSettings?.badge_text || settings?.badge_text || 'Palau Exclusive'}</span>
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 animate-fade-in-up leading-[1.1]">
                                {settings?.headline || 'Reserve Your'}{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">{settings?.headline_highlight || 'Ride'}</span>
                            </h1>
                            <p className="text-base sm:text-lg text-white/60 max-w-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                {settings?.subtitle || 'Complete the form below to secure your perfect vehicle. Palau-exclusive rentals for a truly unique experience.'}
                            </p>
                        </div>
                        {settings?.stat_pills && settings.stat_pills.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                {settings.stat_pills.map((pill, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                                        {STAT_PILL_ICONS[pill.icon] ? (
                                            <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={STAT_PILL_ICONS[pill.icon]} />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        <span className="text-sm font-semibold text-white">{pill.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {heroImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === currentSlide ? 'bg-accent-400 w-6' : 'bg-white/30 hover:bg-white/50 w-1.5'
                            }`}
                        />
                    ))}
                </div>

                <div className="hidden lg:block absolute bottom-6 right-8 animate-fade-in-left" style={{ animationDelay: '0.4s' }}>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 max-w-[200px]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent-400/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-white/50 leading-none mb-1">Instant</p>
                                <p className="text-sm font-bold text-white leading-tight">Confirmation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* How It Works - Horizontal Steps */}
            <section className="py-12 sm:py-16 bg-white border-b border-surface-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10" data-animate>
                        <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
                            How It <span className="gradient-text">Works</span>
                        </h2>
                    </div>

                    <div className="relative">
                        {/* Connector Line */}
                        <div className="hidden sm:block absolute top-6 left-[12%] right-[12%] h-0.5 bg-surface-100" />
                        <div className="hidden sm:block absolute top-6 left-[12%] h-0.5 bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: '76%' }} />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
                            {steps.map((step, i) => (
                                <div
                                    key={step.num}
                                    data-animate
                                    className="opacity-0 translate-y-8 transition-all duration-700 relative"
                                    style={{ transitionDelay: `${i * 100}ms` }}
                                >
                                    <div className="flex flex-col items-center text-center group">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brand-500/20 relative z-10">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step.icon} />
                                            </svg>
                                        </div>
                                        <span className="text-[10px] font-black text-brand-600 tracking-widest mb-1">{step.num}</span>
                                        <h3 className="text-sm font-bold text-surface-900">{step.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Locations & Reservation - 2 Column Layout */}
            <section className="py-16 sm:py-20 bg-gradient-to-b from-surface-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-12" data-animate>
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 rounded-full border border-brand-100 mb-4">
                            <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Book Now</span>
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-3">
                            Reserve Your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-500">Ride</span>
                        </h2>
                        <p className="text-surface-500 max-w-lg mx-auto">Choose your location and complete the reservation form to secure your perfect vehicle</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                        {/* Left Column - Reservation Form */}
                        <div data-animate className="opacity-0 translate-y-8 transition-all duration-700">
                            <div className="bg-white rounded-3xl border border-surface-100 shadow-card overflow-hidden">
                                {/* Form Header */}
                                <div className="relative px-6 py-5 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 overflow-hidden">
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                                    <div className="relative flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white">Complete Your Reservation</h3>
                                            <p className="text-xs text-white/60">Fill in the details below</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Body */}
                                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                                    {/* Pickup & Return - Side by Side */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Pickup */}
                                        <div className="p-3.5 bg-surface-50 rounded-xl border border-surface-100">
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-xs font-bold text-surface-900">Pickup</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="label-text !text-[10px]">Date</label>
                                                    <input type="date" value={data.pickup_date} onChange={(e) => setData('pickup_date', e.target.value)} className="input-field !py-1.5 !text-xs" required />
                                                    {errors.pickup_date && <p className="mt-0.5 text-[10px] text-red-600">{errors.pickup_date}</p>}
                                                </div>
                                                <div>
                                                    <label className="label-text !text-[10px]">Time</label>
                                                    <input type="time" value={data.pickup_time} onChange={(e) => setData('pickup_time', e.target.value)} className="input-field !py-1.5 !text-xs" required />
                                                    {errors.pickup_time && <p className="mt-0.5 text-[10px] text-red-600">{errors.pickup_time}</p>}
                                                </div>
                                                <div>
                                                    <label className="label-text !text-[10px]">Location</label>
                                                    <select value={data.pickup_location} onChange={(e) => setData('pickup_location', e.target.value)} className="input-field !py-1.5 !text-xs" required>
                                                        <option value="">Select location</option>
                                                        {locNames.map((loc) => (
                                                            <option key={loc} value={loc}>{loc}</option>
                                                        ))}
                                                    </select>
                                                    {errors.pickup_location && <p className="mt-0.5 text-[10px] text-red-600">{errors.pickup_location}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Return */}
                                        <div className="p-3.5 bg-surface-50 rounded-xl border border-surface-100">
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-xs font-bold text-surface-900">Return</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="label-text !text-[10px]">Date</label>
                                                    <input type="date" value={data.return_date} onChange={(e) => setData('return_date', e.target.value)} className="input-field !py-1.5 !text-xs" required />
                                                    {errors.return_date && <p className="mt-0.5 text-[10px] text-red-600">{errors.return_date}</p>}
                                                </div>
                                                <div>
                                                    <label className="label-text !text-[10px]">Time</label>
                                                    <input type="time" value={data.return_time} onChange={(e) => setData('return_time', e.target.value)} className="input-field !py-1.5 !text-xs" required />
                                                    {errors.return_time && <p className="mt-0.5 text-[10px] text-red-600">{errors.return_time}</p>}
                                                </div>
                                                <div>
                                                    <label className="label-text !text-[10px]">Location</label>
                                                    <select value={data.return_location} onChange={(e) => setData('return_location', e.target.value)} className="input-field !py-1.5 !text-xs" required>
                                                        <option value="">Select location</option>
                                                        {locNames.map((loc) => (
                                                            <option key={loc} value={loc}>{loc}</option>
                                                        ))}
                                                    </select>
                                                    {errors.return_location && <p className="mt-0.5 text-[10px] text-red-600">{errors.return_location}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Borrower Info */}
                                    <div className="p-4 bg-surface-50 rounded-xl border border-surface-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-sm font-bold text-surface-900">Borrower Information</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="label-text">Country of Residence</label>
                                                <select value={data.country} onChange={(e) => setData('country', e.target.value)} className="input-field" required>
                                                    <option value="">Select your country</option>
                                                    {countries.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
                                            </div>

                                            {heroSettings?.booking_badge_enabled !== false && (() => {
                                                const iconPath: Record<string, string> = {
                                                    tag: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z',
                                                    percent: 'M14.25 7.756a4.5 4.5 0 11-8.25-3.568M3 21l18-18M21 14.25a4.5 4.5 0 00-8.25 3.568M9 21l3-3m3-3l3-3',
                                                    dollar: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                                                    star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
                                                    shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
                                                    location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
                                                };
                                                return (
                                                    <div className="flex items-start gap-3 p-3 bg-accent-50/50 rounded-xl border border-accent-100">
                                                        <div className="mt-0.5 w-4 h-4 rounded-full bg-accent-500 flex items-center justify-center shrink-0">
                                                            {heroSettings?.booking_badge_icon && iconPath[heroSettings.booking_badge_icon] ? (
                                                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath[heroSettings.booking_badge_icon]} />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-surface-900 text-xs">{heroSettings?.booking_badge_text || 'Exclusive in Palau'}</p>
                                                            <p className="text-[10px] text-surface-500 mt-0.5">This vehicle is available exclusively for rentals within Palau.</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            <div className="flex items-start gap-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100">
                                                <input type="checkbox" id="confirm_age" checked={data.confirm_age} onChange={(e) => setData('confirm_age', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500/20" />
                                                <div>
                                                    <label htmlFor="confirm_age" className="font-semibold text-surface-900 text-xs cursor-pointer">Age Verification (25+)</label>
                                                    <p className="text-[10px] text-surface-500 mt-0.5">I confirm the primary driver is at least 25 years old. Valid ID required at pickup.</p>
                                                </div>
                                            </div>
                                            {errors.confirm_age && <p className="text-xs text-red-600">{errors.confirm_age}</p>}
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                                        <button type="submit" className="btn-accent !px-8 !py-3 text-sm group w-full sm:w-auto" disabled={processing}>
                                            {processing ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Submit Reservation
                                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                        <Link href={route('fleet')} className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                                            Browse our fleet first &rarr;
                                        </Link>
                                    </div>

                                    {/* Age Requirement Notice */}
                                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                        <div className="flex items-start gap-2">
                                            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <div>
                                                <p className="text-xs font-semibold text-red-800">Age Requirement: 25+</p>
                                                <p className="text-[10px] text-red-600">Drivers under 25 may face additional fees. Valid license and ID required at pickup.</p>
                                            </div>
                                        </div>
                                    </div>
                                </form>

                                {/* Need Help Footer */}
                                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                                    <Link href={route('contact')} className="flex items-center justify-center gap-2 w-full py-2.5 bg-surface-50 hover:bg-surface-100 rounded-xl border border-surface-100 transition-colors group">
                                        <svg className="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs font-semibold text-surface-600">Need help? Contact our team</span>
                                        <svg className="w-3 h-3 text-surface-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Locations */}
                        <div data-animate className="opacity-0 translate-y-8 transition-all duration-700" style={{ transitionDelay: '150ms' }}>
                            <div className="sticky top-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-surface-900">Our Locations</h3>
                                        <p className="text-xs text-surface-500">Pick up & drop off points</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {locDetails.map((loc, i) => (
                                        <div
                                            key={loc.name}
                                            className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-surface-100 hover:border-brand-200 transition-all duration-500"
                                            style={{ transitionDelay: `${i * 100}ms` }}
                                        >
                                            <div className="flex">
                                                {/* Image */}
                                                <div className="relative w-28 sm:w-36 shrink-0 overflow-hidden">
                                                    <img
                                                        src={loc.image}
                                                        alt={loc.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                                                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[9px] font-bold text-emerald-700">Open</span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-surface-900 text-sm sm:text-base leading-tight">{loc.name}</h4>
                                                            <p className="text-accent-500 font-semibold text-[11px]">{loc.subtitle}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 mb-3">
                                                        <div className="flex items-center gap-1.5 text-xs text-surface-500">
                                                            <svg className="w-3 h-3 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            </svg>
                                                            <span className="truncate">{loc.address}</span>
                                                        </div>
                                                        <div className="flex items-start gap-1.5 text-xs text-surface-500">
                                                            <svg className="w-3 h-3 text-brand-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span>
                                                                {!loc.hourGroups
                                                                    ? loc.hours
                                                                    : loc.hourGroups.length === 1
                                                                        ? <><span className="font-medium">{loc.hourGroups[0].days}:</span> {loc.hourGroups[0].hours}</>
                                                                        : loc.hourGroups.map((g, i) => (
                                                                            <div key={i} className="flex gap-1">
                                                                                <span className="font-medium shrink-0">{g.days}:</span>
                                                                                <span>{g.hours}</span>
                                                                            </div>
                                                                        ))
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-surface-500">
                                                            <svg className="w-3 h-3 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            {loc.phone}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5">
                                                        {loc.features.map((f) => (
                                                            <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-50 text-surface-600 text-[10px] font-semibold rounded-md border border-surface-100">
                                                                <svg className="w-2.5 h-2.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Why Book With Us - Compact */}
                                {whyBookItems.length > 0 && (
                                    <div className="mt-6 p-4 bg-white rounded-2xl border border-surface-100 shadow-sm">
                                        <h4 className="text-sm font-bold text-surface-900 mb-3">Why Book With Us</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {whyBookItems.map((item) => (
                                                <div key={item.id} className="flex items-center gap-2 py-1.5">
                                                    <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                                                        <svg className="w-3 h-3 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon_svg || 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'} />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-semibold text-surface-700">{item.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}
