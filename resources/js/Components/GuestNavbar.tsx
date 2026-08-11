import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { footerLogoUrl } from '@/lib/utils';

interface GuestNavbarProps {
    canLogin?: boolean;
    canRegister?: boolean;
}

export default function GuestNavbar({ canLogin = false, canRegister = true }: GuestNavbarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { footerSettings } = usePage().props as unknown as { footerSettings: { contact_phone: string; contact_email: string; brand_name: string; brand_tagline: string; logo_path: string | null } | null };
    const phone = footerSettings?.contact_phone || '+1 (800) 555-WEST';
    const email = footerSettings?.contact_email || 'info@westcarsales.com';
    const phoneDigits = phone.replace(/[^\d+]/g, '');
    const brandName = footerSettings?.brand_name || 'West Car Rental';
    const brandTagline = footerSettings?.brand_tagline || 'Crafted for the Open Road';
    const logoUrl = footerLogoUrl(footerSettings?.logo_path);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const navLinks = [
        { href: route('cars.index'), label: 'Home', routeName: 'cars.index', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
        { href: route('fleet'), label: 'Fleet', routeName: 'fleet', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1h2m10 1l2-1V8a1 1 0 00-1-1h-4' },
        { href: route('reservations'), label: 'Reservation', routeName: 'reservations', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { href: route('bookings.lookup'), label: 'Track Reservation', routeName: 'bookings.lookup', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
        { href: route('locations'), label: 'Locations', routeName: 'locations', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { href: route('about'), label: 'About Us', routeName: 'about', icon: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z' },
        { href: route('contact'), label: 'Contact', routeName: 'contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ];

    const isActive = (routeName: string) => {
        try {
            return route().current(routeName);
        } catch {
            return false;
        }
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled
                    ? 'bg-white/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] border-b border-surface-100/50'
                    : 'bg-brand-900'
            }`}>
                {/* Accent line */}
                <div className={`h-[3px] bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-60'}`} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-[72px] lg:h-[80px] gap-4 lg:gap-8">

                        {/* Logo */}
                        <Link href={route('cars.index')} className="flex items-center gap-3 group shrink-0">
                            <img
                                src={logoUrl}
                                alt={brandName}
                                className="h-14 lg:h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="hidden sm:flex flex-col">
                                <span className={`text-xl lg:text-2xl font-extrabold tracking-tight leading-none transition-colors duration-300 whitespace-nowrap ${
                                    scrolled ? 'text-brand-900' : 'text-white'
                                }`}>
                                    {brandName}
                                </span>
                                <span className={`text-[10px] lg:text-[11px] font-bold tracking-[0.2em] uppercase leading-none mt-1 transition-colors duration-300 ${
                                    scrolled ? 'text-accent-500' : 'text-accent-400'
                                }`}>
                                    {brandTagline}
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden lg:flex items-center">
                            <div className={`flex items-center gap-0.5 p-1 rounded-2xl transition-all duration-300 ${
                                scrolled
                                    ? 'bg-surface-100'
                                    : 'bg-white/10'
                            }`}>
                                {navLinks.map((link) => {
                                    const active = isActive(link.routeName);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-xl transition-all duration-300 whitespace-nowrap ${
                                                active
                                                    ? scrolled
                                                        ? 'text-brand-900 bg-white shadow-sm'
                                                        : 'text-white bg-white/20'
                                                    : scrolled
                                                        ? 'text-surface-500 hover:text-surface-800 hover:bg-white'
                                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            <svg className={`w-3.5 h-3.5 shrink-0 ${
                                                active
                                                    ? scrolled ? 'text-accent-500' : 'text-accent-400'
                                                    : ''
                                            }`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                                            </svg>
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="hidden sm:flex items-center gap-2">
                            {canLogin && (
                                <Link
                                    href={route('login')}
                                    className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap ${
                                        scrolled
                                            ? 'text-surface-600 hover:text-brand-900 hover:bg-surface-50'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    Sign in
                                </Link>
                            )}
                            {canRegister && (
                                <Link
                                    href={route('reservations')}
                                    className="relative group px-4 py-2 text-sm font-bold text-brand-900 bg-gradient-to-r from-accent-400 to-accent-500 rounded-xl hover:from-accent-300 hover:to-accent-400 transition-all duration-300 shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40 hover:-translate-y-0.5 overflow-hidden whitespace-nowrap"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Get Started
                                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                </Link>
                            )}
                        </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className={`lg:hidden relative p-2.5 rounded-xl transition-all duration-300 ${
                                    mobileOpen
                                        ? 'bg-white text-brand-900'
                                        : scrolled
                                            ? 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                <div className="w-5 h-4 relative flex flex-col justify-between">
                                    <span className={`w-full h-[2px] rounded-full transition-all duration-300 origin-center ${
                                        mobileOpen ? 'rotate-45 translate-y-[5px] bg-brand-900' : 'bg-current'
                                    }`} />
                                    <span className={`w-full h-[2px] rounded-full transition-all duration-300 ${
                                        mobileOpen ? 'opacity-0 scale-x-0 bg-brand-900' : 'bg-current'
                                    }`} />
                                    <span className={`w-full h-[2px] rounded-full transition-all duration-300 origin-center ${
                                        mobileOpen ? '-rotate-45 -translate-y-[5px] bg-brand-900' : 'bg-current'
                                    }`} />
                                </div>
                            </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
                    mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <div className={`lg:hidden fixed top-0 right-0 z-50 h-full w-[300px] bg-white shadow-2xl transition-transform duration-500 ease-out ${
                mobileOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between p-5 border-b border-surface-100 bg-brand-900">
                        <div className="flex items-center gap-3">
                            <img
                                src={logoUrl}
                                alt={brandName}
                                className="h-12 w-auto object-contain"
                            />
                            <div className="flex flex-col">
                                <span className="text-base font-extrabold text-white leading-none whitespace-nowrap">{brandName}</span>
                                <span className="text-[9px] font-bold text-accent-400 tracking-[0.2em] uppercase leading-none mt-0.5">{brandTagline}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Nav Links */}
                    <div className="flex-1 overflow-y-auto py-4 px-4">
                        <div className="space-y-1.5">
                            {navLinks.map((link, i) => {
                                const active = isActive(link.routeName);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                            active
                                                ? 'bg-brand-50 text-brand-900 border border-brand-100'
                                                : 'text-surface-600 hover:bg-surface-50 hover:text-brand-900'
                                        }`}
                                        style={{ transitionDelay: mobileOpen ? `${i * 50}ms` : '0ms' }}
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                                            active
                                                ? 'bg-accent-400/15 text-accent-600'
                                                : 'bg-surface-100 text-surface-400'
                                        }`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                                            </svg>
                                        </div>
                                        {link.label}
                                        {active && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-500" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile Contact */}
                    <div className="px-4 py-3 border-t border-surface-100">
                        <div className="flex flex-col gap-2">
                            <a
                                href={`tel:${phoneDigits}`}
                                className="flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-brand-900 transition-colors"
                            >
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {phone}
                            </a>
                            <a
                                href={`mailto:${email}`}
                                className="flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-brand-900 transition-colors"
                            >
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {email}
                            </a>
                        </div>
                    </div>

                    {/* Mobile Footer Actions */}
                    <div className="p-4 border-t border-surface-100 space-y-2.5">
                        {canLogin && (
                            <Link
                                href={route('login')}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-center w-full px-5 py-3 text-sm font-semibold text-surface-700 bg-surface-100 rounded-xl hover:bg-surface-200 transition-colors"
                            >
                                Sign in
                            </Link>
                        )}
                        {canRegister && (
                            <Link
                                href={route('reservations')}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-bold text-brand-900 bg-gradient-to-r from-accent-400 to-accent-500 rounded-xl shadow-lg shadow-accent-500/25"
                            >
                                Get Started
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
