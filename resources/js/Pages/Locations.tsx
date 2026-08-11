import { useEffect, useRef, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationData {
    location_id: number;
    location: string;
    subtitle: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    hours: string | null;
    lat: number | null;
    lng: number | null;
    image: string | null;
    description: string | null;
    features: string[] | null;
    sort_order: number;
    is_active: number;
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

function LocationCard({ location, index }: { location: LocationData; index: number }) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const hourGroups = location.hours ? formatHours(location.hours) : null;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('opacity-100', 'translate-y-0');
                        entry.target.classList.remove('opacity-0', 'translate-y-12');
                    }
                });
            },
            { threshold: 0.15 },
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={cardRef}
            className="opacity-0 translate-y-12 transition-all duration-700 ease-out h-full"
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            <div
                className="group relative bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 flex flex-col h-full"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Section */}
                <div className="relative h-64 sm:h-72 overflow-hidden">
                    <img
                        src={location.image ? (location.image.startsWith('http') ? location.image : '/storage/' + location.image) : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'}
                        alt={location.location}
                        className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 via-surface-900/20 to-transparent" />

                    {/* Floating Badge */}
                    <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-surface-800">Open Now</span>
                        </div>
                    </div>

                    {/* Location Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{location.location}</h3>
                        {location.subtitle && <p className="text-accent-400 font-semibold text-sm tracking-wide uppercase">{location.subtitle}</p>}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-1 p-6 sm:p-8">
                    {location.description && <p className="text-surface-600 text-sm leading-relaxed mb-6">{location.description}</p>}

                    {/* Info Grid */}
                    <div className="space-y-3 mb-6">
                        {location.address && (
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                                    <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-surface-400 font-medium uppercase tracking-wider">Address</p>
                                    <p className="text-sm text-surface-700">{location.address}</p>
                                </div>
                            </div>
                        )}

                        {location.phone && (
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center shrink-0 group-hover:bg-accent-100 transition-colors">
                                    <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-surface-400 font-medium uppercase tracking-wider">Phone</p>
                                    <p className="text-sm text-surface-700">{location.phone}</p>
                                </div>
                            </div>
                        )}

                        {location.hours && (
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-surface-400 font-medium uppercase tracking-wider">Hours</p>
                                    <div className="text-sm text-surface-700 space-y-0.5">
                                        {!hourGroups
                                            ? <p>{location.hours}</p>
                                            : hourGroups.length === 1
                                                ? <p><span className="font-medium text-surface-500">{hourGroups[0].days}:</span> {hourGroups[0].hours}</p>
                                                : hourGroups.map((g, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <span className="font-medium text-surface-500 min-w-[112px] shrink-0">{g.days}</span>
                                                        <span>{g.hours}</span>
                                                    </div>
                                                ))
                                        }
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    {location.features && location.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {location.features.map((feature) => (
                                <span
                                    key={feature}
                                    className="px-3 py-1 text-xs font-medium text-brand-700 bg-brand-50 rounded-full border border-brand-100 group-hover:bg-brand-100 transition-colors"
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* CTA Button */}
                    {location.lat && location.lng && (
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-glow-blue group/btn mt-auto"
                        >
                            <svg className="w-4 h-4 transition-transform group-hover/btn:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Get Directions
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function MapSection({ locations }: { locations: LocationData[] }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
            center: [7.355, 134.505],
            zoom: 12,
            scrollWheelZoom: false,
            zoomControl: false,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        // Custom icon
        const createIcon = (color: string) =>
            L.divIcon({
                html: `<div style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>`,
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
            });

        locations.forEach((loc) => {
            if (!loc.lat || !loc.lng) return;
            const marker = L.marker([loc.lat, loc.lng], {
                icon: createIcon(loc.location_id === 1 ? '#1e3a5f' : '#2563eb'),
            }).addTo(map);

            marker.bindPopup(
                `<div style="padding:4px 0;font-family:sans-serif;">
                    <strong style="font-size:14px;color:#1e293b;">${loc.location}</strong><br/>
                    ${loc.subtitle ? `<span style="font-size:12px;color:#64748b;">${loc.subtitle}</span><br/>` : ''}
                    ${loc.city ? `<span style="font-size:11px;color:#94a3b8;">${loc.city}</span>` : ''}
                </div>`,
                { closeButton: false, className: 'custom-popup' }
            );
        });

        // Fit bounds
        const validLocations = locations.filter(l => l.lat && l.lng);
        const group = L.featureGroup(
            validLocations.map((loc) => L.marker([loc.lat!, loc.lng!]))
        );
        map.fitBounds(group.getBounds().pad(0.3));

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div className="relative z-0">
            <div
                ref={mapRef}
                className="w-full h-[400px] sm:h-[500px] rounded-3xl overflow-hidden shadow-elevated"
            />
            <style>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    border-radius: 12px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    border: none;
                }
                .custom-popup .leaflet-popup-tip {
                    box-shadow: none;
                }
            `}</style>
        </div>
    );
}

export default function Locations({ locations: pageLocations, pageSettings: pageSettingsProp }: { locations?: LocationData[]; pageSettings?: any }) {
    const { props } = usePage();
    const locations = pageLocations || (props as any).locations || [];
    const pageSettings = pageSettingsProp || (props as any).pageSettings || null;
    const route = useRoute();
    const [heroLoaded, setHeroLoaded] = useState(false);

    useEffect(() => {
        setHeroLoaded(true);
    }, []);

    return (
        <GuestLayout>
            <Head title="Our Locations" />

            {/* Hero Section */}
            {(!pageSettings || pageSettings.hero_active) && (
            <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={pageSettings?.hero_image_path ? `/storage/${pageSettings.hero_image_path}` : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80'}
                        alt="Locations hero"
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

                <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
                    <div
                        className={`transition-all duration-700 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    >
                        {pageSettings?.hero_badge_active !== false && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
                                <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                                <span className="text-sm font-medium text-white/90">{pageSettings?.hero_badge || 'Palau, Micronesia'}</span>
                            </div>
                        )}
                    </div>

                    <h1
                        className={`text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight mb-4 transition-all duration-700 delay-100 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    >
                        {pageSettings?.hero_title || 'Our'}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">
                            {pageSettings?.hero_highlight || 'Locations'}
                        </span>
                    </h1>

                    <p
                        className={`text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-8 transition-all duration-700 delay-200 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    >
                        {pageSettings?.hero_description || 'Two convenient locations across Palau — whether you\'re in the heart of Koror or arriving at the airport, we\'ve got you covered.'}
                    </p>

                    <div
                        className={`flex items-center justify-center gap-4 transition-all duration-700 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    >
                        <a
                            href="#locations"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-400 hover:bg-accent-500 text-surface-900 font-semibold rounded-xl transition-all duration-300 hover:shadow-glow-yellow"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            View Locations
                        </a>
                        <Link
                            href={route('contact')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 transition-all duration-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call Us
                        </Link>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                        <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
                    </div>
                </div>
            </section>
            )}

            {/* Locations Section */}
            <section id="locations" className="py-20 sm:py-28 bg-surface-50 relative">
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-surface-900/10 to-transparent" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full border border-brand-100 mb-4 uppercase tracking-wider">
                            Pickup & Drop-off Points
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4">
                            Where to Find Us
                        </h2>
                        <p className="text-surface-500 max-w-lg mx-auto">
                            Choose the location most convenient for your trip. Both offer the same great service and fleet.
                        </p>
                    </div>

                    {/* Location Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        {locations.map((location: LocationData, index: number) => (
                            <LocationCard key={location.location_id} location={location} index={index} />
                        ))}
                    </div>

                    {/* Map Section */}
                    <div className="relative">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl sm:text-3xl font-bold text-surface-900 mb-2">Explore on Map</h3>
                            <p className="text-surface-500">Both locations are just a short drive apart</p>
                        </div>
                        <MapSection locations={locations} />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {(!pageSettings || pageSettings.cta_active) && (
            <section className="py-20 sm:py-24 bg-gradient-to-br from-brand-800 via-brand-900 to-surface-900 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-400/5 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        {pageSettings?.cta_title || 'Ready to Hit the Road?'}
                    </h2>
                    <p className="text-lg text-surface-300 mb-8">
                        {pageSettings?.cta_description || 'Book your vehicle today and explore the beautiful islands of Palau at your own pace.'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={route('fleet')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-400 hover:bg-accent-500 text-surface-900 font-bold rounded-xl transition-all duration-300 hover:shadow-glow-yellow text-lg"
                        >
                            Browse Vehicles
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                        <Link
                            href={route('contact')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 transition-all duration-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call Us
                        </Link>
                    </div>
                </div>
            </section>
            )}
        </GuestLayout>
    );
}
