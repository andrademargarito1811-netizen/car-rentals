import { usePage } from '@inertiajs/react';

export default function TopContactBar() {
    const { footerSettings } = usePage().props as { footerSettings: { contact_phone: string; contact_email: string } | null };

    const phone = footerSettings?.contact_phone || '+1 (800) 555-WEST';
    const email = footerSettings?.contact_email || 'info@westcarsales.com';
    const phoneDigits = phone.replace(/[^\d+]/g, '');

    return (
        <div className="fixed top-[72px] lg:top-[80px] left-0 right-0 z-40 bg-accent-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center sm:justify-end gap-3 sm:gap-5 h-7">
                <a
                    href={`tel:${phoneDigits}`}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-900 hover:text-white transition-colors whitespace-nowrap"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {phone}
                </a>
                <span className="w-px h-2.5 bg-brand-900/20 hidden sm:block" />
                <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-900 hover:text-white transition-colors whitespace-nowrap"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {email}
                </a>
            </div>
        </div>
    );
}
