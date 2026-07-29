import { useEffect, useRef, useState, useCallback } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

interface WelcomeProps {
    canLogin?: boolean;
    canRegister?: boolean;
}

const LOCATIONS = ['West Plaza Hotel @ Lebuu St.', 'Airport'];

const features = [
    {
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        title: 'Fully Insured',
        desc: 'Every rental includes comprehensive insurance coverage for complete peace of mind.',
        gradient: 'from-blue-500/20 to-brand-500/20',
        iconColor: 'text-blue-600',
        hoverBg: 'group-hover:from-blue-500 group-hover:to-brand-600',
    },
    {
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        title: 'Best Prices',
        desc: 'Transparent pricing with no hidden fees. Competitive rates guaranteed.',
        gradient: 'from-emerald-500/20 to-teal-500/20',
        iconColor: 'text-emerald-600',
        hoverBg: 'group-hover:from-emerald-500 group-hover:to-teal-600',
    },
    {
        icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
        title: '4 Locations',
        desc: 'Convenient pickup and drop-off points across major cities.',
        gradient: 'from-purple-500/20 to-pink-500/20',
        iconColor: 'text-purple-600',
        hoverBg: 'group-hover:from-purple-500 group-hover:to-pink-600',
    },
    {
        icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        title: '24/7 Support',
        desc: 'Round-the-clock roadside assistance whenever you need it.',
        gradient: 'from-accent-500/20 to-orange-500/20',
        iconColor: 'text-accent-600',
        hoverBg: 'group-hover:from-accent-500 group-hover:to-orange-600',
    },
];

function useCountUp(target: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const start = useCallback(() => {
        if (started) return;
        setStarted(true);
        const startTime = performance.now();
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [target, duration, started]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) start(); },
            { threshold: 0.5 },
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [start]);

    return { count, ref };
}

export default function Welcome({ canLogin, canRegister }: WelcomeProps) {
    const [pickupDate, setPickupDate] = useState(() =>
        new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Palau' })
    );
    const [pickupTime, setPickupTime] = useState('09:00');
    const [pickupLocation, setPickupLocation] = useState(LOCATIONS[0]);
    const [returnDate, setReturnDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 3);
        return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Palau' });
    });
    const [returnTime, setReturnTime] = useState('09:00');
    const [returnLocation, setReturnLocation] = useState(LOCATIONS[1]);

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

    const { count: vehicleCount, ref: vehicleRef } = useCountUp(50, 2000);
    const { count: locationCount, ref: locationRef } = useCountUp(4, 2000);
    const { count: supportCount, ref: supportRef } = useCountUp(24, 2000);
    const { count: customerCount, ref: customerRef } = useCountUp(10, 2000);

    return (
        <>
            <Head title="Premium Car Rentals" />
            <GuestLayout canLogin={canLogin} canRegister={canRegister}>
                {/* Hero - Split Layout */}
                <section className="min-h-screen flex flex-col lg:flex-row">
                    {/* Left: Content + Compact Booking Card */}
                    <div className="lg:w-[55%] bg-brand-900 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-20 lg:py-0 relative overflow-hidden">
                        <div className="absolute top-20 right-10 w-72 h-72 bg-accent-400/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-20 left-10 w-56 h-56 bg-brand-400/10 rounded-full blur-3xl" />

                        <div className="relative z-10 max-w-xl mx-auto lg:mx-0 w-full">
                            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-400/10 text-accent-400 text-sm font-semibold rounded-full border border-accent-400/20 mb-5">
                                    <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
                                    Premium Car Rental Service
                                </span>
                            </div>

                            <h1 data-animate className="opacity-0 translate-y-8 transition-all duration-700 delay-100 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.15] tracking-tight mb-3">
                                Find Your Perfect
                                <span className="block gradient-text mt-1">Ride Today</span>
                            </h1>

                            <p data-animate className="opacity-0 translate-y-8 transition-all duration-700 delay-200 text-surface-400 mb-6 leading-relaxed">
                                Browse our premium fleet of well-maintained vehicles and hit the road with confidence.
                            </p>

                            {/* Compact Booking Card */}
                            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 delay-300 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Book Your Ride</h3>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 text-[10px] font-bold rounded-full">
                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        Palau
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-medium text-surface-400 mb-1">Pickup Date</label>
                                        <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)}
                                            className="w-full px-2.5 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-xs placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-surface-400 mb-1">Pickup Time</label>
                                        <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}
                                            className="w-full px-2.5 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-surface-400 mb-1">Pickup Location</label>
                                        <select value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)}
                                            className="w-full px-2.5 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition">
                                            {LOCATIONS.map((loc) => (
                                                <option key={loc} value={loc} className="bg-brand-900">{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-surface-400 mb-1">Return Date</label>
                                        <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full px-2.5 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-xs placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-surface-400 mb-1">Return Time</label>
                                        <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)}
                                            className="w-full px-2.5 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-surface-400 mb-1">Return Location</label>
                                        <select value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)}
                                            className="w-full px-2.5 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition">
                                            {LOCATIONS.map((loc) => (
                                                <option key={loc} value={loc} className="bg-brand-900">{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <Link href={route('fleet', {
                                    pickup_date: pickupDate,
                                    pickup_time: pickupTime,
                                    pickup_location: pickupLocation,
                                    return_date: returnDate,
                                    return_time: returnTime,
                                    return_location: returnLocation,
                                })}
                                    className="btn-accent !py-2.5 w-full mt-3 text-sm group justify-center">
                                    Search Available Cars
                                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>

                            {/* Mini Stats Row */}
                            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 delay-500 flex items-center justify-between gap-4 mt-6">
                                <div ref={vehicleRef} className="text-center">
                                    <div className="text-lg sm:text-xl font-bold text-accent-400 tabular-nums">{vehicleCount}+</div>
                                    <div className="text-[10px] text-surface-500 font-medium">Vehicles</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div ref={locationRef} className="text-center">
                                    <div className="text-lg sm:text-xl font-bold text-accent-400">{locationCount}</div>
                                    <div className="text-[10px] text-surface-500 font-medium">Locations</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div ref={supportRef} className="text-center">
                                    <div className="text-lg sm:text-xl font-bold text-accent-400 tabular-nums">{supportCount}/7</div>
                                    <div className="text-[10px] text-surface-500 font-medium">Support</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div ref={customerRef} className="text-center">
                                    <div className="text-lg sm:text-xl font-bold text-accent-400 tabular-nums">{customerCount}k+</div>
                                    <div className="text-[10px] text-surface-500 font-medium">Happy Customers</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Car Image */}
                    <div className="lg:w-[45%] relative min-h-[40vh] lg:min-h-screen overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=1400&fit=crop"
                            alt="Premium car"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/80 via-brand-900/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-brand-900/20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                    </div>
                </section>

                {/* Features */}
                <section className="py-20 sm:py-28 bg-gradient-to-b from-surface-50 to-white relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-400/5 rounded-full blur-3xl animate-float" />
                        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/3 rounded-full blur-3xl animate-morph" />
                    </div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 data-animate className="opacity-0 translate-y-8 transition-all duration-700 section-heading mb-4">
                                Why Choose <span className="gradient-text">West Car</span>
                            </h2>
                            <p data-animate className="opacity-0 translate-y-8 transition-all duration-700 delay-100 section-subheading mx-auto">
                                We deliver exceptional service that keeps our customers coming back
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                            {features.map((feature, i) => (
                                <div key={i}
                                    data-animate
                                    style={{ transitionDelay: `${(i + 1) * 150}ms` }}
                                    className="opacity-0 translate-y-8 transition-all duration-700 group relative p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-glass hover:shadow-glass-lg hover:-translate-y-2 hover:scale-[1.02] hover:border-white/80 transition-all duration-500">
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" style={{ background: `linear-gradient(135deg, rgba(59,130,246,0.08), rgba(147,51,234,0.08))` }} />
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                                        <svg className={`w-7 h-7 ${feature.iconColor} group-hover:text-white transition-colors duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={feature.icon} />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-surface-900 mb-3">{feature.title}</h3>
                                    <p className="text-sm text-surface-500 leading-relaxed">{feature.desc}</p>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-1/2 h-0.5 bg-gradient-to-r from-transparent via-accent-400 to-transparent transition-all duration-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 sm:py-28 bg-gradient-to-br from-surface-900 via-brand-900 to-surface-900 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent-400/5 rounded-full blur-3xl" />
                    </div>
                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                            Ready to Hit the Road?
                        </h2>
                        <p className="text-lg text-surface-300 mb-10 max-w-2xl mx-auto">
                            Book your perfect car today and enjoy premium service every mile of the way
                        </p>
                        <Link href={route('cars.index')}
                            className="btn-accent !px-10 !py-4 !text-base">
                            Get Started Now
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </section>
            </GuestLayout>
        </>
    );
}
