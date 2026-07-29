import { usePage, Link } from '@inertiajs/react';

interface LinkItem {
    label: string;
    url: string;
}

interface SocialLinkItem {
    platform: string;
    label: string;
    url: string;
}

interface FooterSettings {
    brand_name: string;
    brand_description: string | null;
    logo_path: string | null;
    newsletter_heading: string;
    newsletter_description: string | null;
    newsletter_placeholder: string;
    newsletter_active: boolean;
    contact_email: string;
    contact_phone: string;
    contact_hours: string;
    copyright_text: string;
    quick_links: LinkItem[];
    legal_links: LinkItem[];
    social_links: SocialLinkItem[];
    is_active: boolean;
}

const socialIcons: Record<string, string> = {
    facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    twitter: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
    instagram: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z',
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    youtube: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
};

export default function Footer() {
    const { footerSettings } = usePage().props as { footerSettings: FooterSettings | null };
    const currentYear = new Date().getFullYear();

    const s = footerSettings;

    if (!s || !s.is_active) {
        return null;
    }

    const logoUrl = s.logo_path
        ? (s.logo_path.startsWith('/') ? s.logo_path : `/storage/${s.logo_path}`)
        : '/img/company_logo/company-logos-01.png';

    return (
        <footer className="relative bg-brand-900 overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-400/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Newsletter Section */}
                {s.newsletter_active && (
                    <div className="py-12 border-b border-white/10">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="text-center lg:text-left">
                                <h3 className="text-2xl font-bold text-white mb-2">{s.newsletter_heading}</h3>
                                <p className="text-surface-400">{s.newsletter_description}</p>
                            </div>
                            <div className="flex w-full max-w-md">
                                <input
                                    type="email"
                                    placeholder={s.newsletter_placeholder}
                                    className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-l-2xl text-white placeholder-surface-400 focus:outline-none focus:border-accent-400/50 focus:bg-white/15 transition-all duration-300"
                                />
                                <button className="btn-accent !rounded-l-none !rounded-r-2xl !px-6 !py-3.5">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Footer */}
                <div className="py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-6 group">
                            <img src={logoUrl} alt={`${s.brand_name} Logo`} className="h-10 w-auto transition-transform duration-300 group-hover:scale-110" />
                            <span className="text-lg font-bold text-white">{s.brand_name}</span>
                        </Link>
                        {s.brand_description && (
                            <p className="text-surface-400 text-sm leading-relaxed max-w-xs mb-6">
                                {s.brand_description}
                            </p>
                        )}
                        {s.social_links && s.social_links.length > 0 && (
                            <div className="flex gap-3">
                                {s.social_links.filter(link => link.url && link.url !== '#').map((link) => (
                                    <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent-400 hover:text-brand-900 hover:border-accent-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d={socialIcons[link.platform] || socialIcons.facebook} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    {s.quick_links && s.quick_links.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Quick Links</h4>
                            <ul className="space-y-3">
                                {s.quick_links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.url} className="text-surface-400 hover:text-accent-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Contact</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-accent-400/10 flex items-center justify-center shrink-0 group-hover:bg-accent-400 transition-all duration-300">
                                    <svg className="w-4 h-4 text-accent-400 group-hover:text-brand-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-surface-400 group-hover:text-white transition-colors">{s.contact_email}</span>
                            </li>
                            <li className="flex items-start gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-accent-400/10 flex items-center justify-center shrink-0 group-hover:bg-accent-400 transition-all duration-300">
                                    <svg className="w-4 h-4 text-accent-400 group-hover:text-brand-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <span className="text-surface-400 group-hover:text-white transition-colors">{s.contact_phone}</span>
                            </li>
                            <li className="flex items-start gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-accent-400/10 flex items-center justify-center shrink-0 group-hover:bg-accent-400 transition-all duration-300">
                                    <svg className="w-4 h-4 text-accent-400 group-hover:text-brand-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-surface-400 group-hover:text-white transition-colors">{s.contact_hours}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    {s.legal_links && s.legal_links.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Legal</h4>
                            <ul className="space-y-3">
                                {s.legal_links.map((link) => (
                                    <li key={link.label}>
                                        <a href={link.url} className="text-surface-400 hover:text-accent-400 text-sm transition-colors duration-300">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-surface-500">
                        &copy; {currentYear} {s.copyright_text}
                    </p>
                </div>
            </div>
        </footer>
    );
}
