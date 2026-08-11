import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

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
}

interface AboutUsSettings {
    hero_badge: string | null;
    hero_title: string | null;
    hero_highlight: string | null;
    hero_description: string | null;
    hero_image_path: string | null;
    story_heading: string | null;
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
    {
        name: 'Sarah Mitchell',
        role: 'Founder & CEO',
        image_path: 'https://ui-avatars.com/api/?name=Sarah+Mitchell&background=1e293b&color=fff&size=128',
    },
    {
        name: 'James Rodriguez',
        role: 'Operations Director',
        image_path: 'https://ui-avatars.com/api/?name=James+Rodriguez&background=334155&color=fff&size=128',
    },
    {
        name: 'Emily Chen',
        role: 'Customer Experience Lead',
        image_path: 'https://ui-avatars.com/api/?name=Emily+Chen&background=475569&color=fff&size=128',
    },
    {
        name: 'Michael Thompson',
        role: 'Fleet Manager',
        image_path: 'https://ui-avatars.com/api/?name=Michael+Thompson&background=1e293b&color=fff&size=128',
    },
];

const AVATAR_BG = ['1e293b', '334155', '475569', '0f172a'];

export default function About({ aboutUsSettings }: { aboutUsSettings?: AboutUsSettings | null }) {
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
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
        );
        document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const s = aboutUsSettings?.is_active !== false ? aboutUsSettings : undefined;

    const stats = s?.stats?.length ? s.stats : DEFAULT_STATS;
    const values = s?.values?.length ? s.values : DEFAULT_VALUES;
    const team = s?.team_members?.length ? s.team_members : DEFAULT_TEAM;
    const heroImage = s?.hero_image_path ? `/storage/${s.hero_image_path}` : null;
    const storyImage = s?.story_image_path
        ? `/storage/${s.story_image_path}`
        : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
    const showMission = Boolean(s?.mission_text || s?.vision_text);

    function memberImage(member: TeamMember, index: number) {
        if (member.image_path) {
            return member.image_path.startsWith('http')
                ? member.image_path
                : `/storage/${member.image_path}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${AVATAR_BG[index % AVATAR_BG.length]}&color=fff&size=128`;
    }

    return (
        <GuestLayout>
            <Head title="About Us" />

            {/* Hero */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0">
                    {heroImage && (
                        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                    )}
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[128px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
                </div>
                <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-down">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                        </span>
                        <span className="text-sm font-medium text-slate-300">{s?.hero_badge || 'Driving Excellence Since 2014'}</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 animate-fade-in-up">
                        {s?.hero_title || 'Your Journey,'}{' '}
                        <span className="bg-gradient-to-r from-brand-400 via-amber-400 to-brand-400 bg-clip-text text-transparent">
                            {s?.hero_highlight || 'Our Passion'}
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {s?.hero_description || "We're more than a car rental company — we're your trusted partner for every mile of your journey."}
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section className="relative -mt-20 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, i) => (
                            <div
                                key={stat.label}
                                data-animate
                                className="opacity-0 translate-y-12 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 text-center transition-all duration-700 hover:shadow-2xl hover:-translate-y-1"
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className="text-3xl sm:text-4xl font-extrabold text-brand-600 mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            {showMission && (
                <section className="py-20 sm:py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16" data-animate>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold mb-6">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Our Mission & Vision
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                                What Drives Us Forward
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            <div data-animate className="opacity-0 translate-y-12 transition-all duration-700">
                                <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 border border-slate-100 h-full">
                                    <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-5">
                                        <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
                                    <p className="text-slate-600 leading-relaxed">{s?.mission_text}</p>
                                </div>
                            </div>
                            <div data-animate className="opacity-0 translate-y-12 transition-all duration-700" style={{ transitionDelay: '0.15s' }}>
                                <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 border border-slate-100 h-full">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-5">
                                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
                                    <p className="text-slate-600 leading-relaxed">{s?.vision_text}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Our Story */}
            <section className="py-20 sm:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div data-animate className="opacity-0 translate-y-12 transition-all duration-700">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold mb-6">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                                </svg>
                                Our Story
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                {s?.story_heading || 'Built on a Passion for the Open Road'}
                            </h2>
                            <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
                                {s?.story_content || `West Car Rental was founded with a simple mission: to provide travelers with reliable, affordable vehicles and exceptional service. What started as a small family-owned operation has grown into a trusted name in car rentals across the region.\n\nToday, we operate from 4 convenient locations with a fleet of over 500 vehicles, serving thousands of satisfied customers every year. Our commitment to quality, transparency, and customer satisfaction remains at the heart of everything we do.`}
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                                            {['SM', 'JR', 'EC', 'MT'][i]}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold text-slate-900">Trusted by thousands</span>
                                    <span className="text-slate-500 block">of happy customers</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div data-animate className="opacity-0 translate-y-12 transition-all duration-700" style={{ transitionDelay: '0.2s' }}>
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60">
                                    <img
                                        src={storyImage}
                                        alt="Our fleet"
                                        className="w-full h-80 sm:h-96 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                                </div>
                                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 hidden sm:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-900">10+ Years</div>
                                            <div className="text-xs text-slate-500">of excellence</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 sm:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16" data-animate>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold mb-6">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            Our Values
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            What Drives Us Every Day
                        </h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                            Our core values shape every interaction and every journey we facilitate.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, i) => (
                            <div
                                key={value.title}
                                data-animate
                                className="opacity-0 translate-y-12 group p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500"
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className={`w-14 h-14 rounded-xl ${value.color} ring-1 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={value.icon} />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{value.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20 sm:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16" data-animate>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold mb-6">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Our Team
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            Meet the People Behind the Wheel
                        </h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                            A dedicated team committed to making your rental experience exceptional.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {team.map((member, i) => (
                            <div
                                key={member.name}
                                data-animate
                                className="opacity-0 translate-y-12 group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className="aspect-square overflow-hidden bg-slate-100">
                                    <img
                                        src={memberImage(member, i)}
                                        alt={member.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-5 text-center">
                                    <h3 className="font-bold text-slate-900">{member.name}</h3>
                                    <p className="text-sm text-slate-500">{member.role || 'Team Member'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-white py-16 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div data-animate className="opacity-0 translate-y-12 transition-all duration-700">
                        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 p-10 sm:p-14 text-center">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-60 h-60 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to experience the difference?</h2>
                                <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
                                    Browse our fleet and find the perfect vehicle for your next adventure.
                                </p>
                                <Link
                                    href={route('fleet')}
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50 transition-all duration-200 shadow-lg shadow-brand-800/20 hover:-translate-y-0.5"
                                >
                                    Explore Our Fleet
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}
