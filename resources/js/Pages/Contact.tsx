import { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Turnstile } from '@marsidev/react-turnstile';

interface ContactSettings {
    contact_email: string;
    contact_phone: string;
    contact_hours: string;
    contact_address: string;
}

export default function Contact() {
    const { footerSettings, flash } = usePage().props as any;
    const settings: ContactSettings = footerSettings || {};
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        subject: '',
        reservation_number: '',
        message: '',
    });

    const contactMethods = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            label: 'Email Us',
            value: settings.contact_email || 'info@westcarsales.com',
            description: 'We reply within 24 hours',
            href: `mailto:${settings.contact_email || 'info@westcarsales.com'}`,
            color: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            ),
            label: 'Call Us',
            value: settings.contact_phone || '+1 (800) 555-WEST',
            description: settings.contact_hours || 'Mon-Sat, 8AM - 8PM EST',
            href: `tel:${(settings.contact_phone || '+18005559378').replace(/[^+\d]/g, '')}`,
            color: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            label: 'Visit Us',
            value: settings.contact_address || '123 Auto Drive, Motor City',
            description: 'Open for walk-ins',
            href: '#',
            color: 'bg-violet-500/10 text-violet-600 ring-violet-500/20',
        },
    ];

const socialIcons: Record<string, string> = {
    facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    twitter: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
    instagram: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z',
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    youtube: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
};

    useEffect(() => {
        if (flash?.success) {
            setSubmitted(true);
        }
    }, [flash]);

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

    return (
        <GuestLayout>
            <Head title="Contact Us" />

            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[128px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
                </div>
                <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-down">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-sm font-medium text-slate-300">Available 7 days a week</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 animate-fade-in-up">
                        Let's Start a{' '}
                        <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-brand-400 bg-clip-text text-transparent">
                            Conversation
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Have a question about our vehicles or services? Our team is ready to help you find the perfect rental.
                    </p>
                </div>
            </section>

            <section className="relative py-20 sm:py-28 bg-slate-50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
                        <div className="lg:col-span-3" data-animate>
                            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 lg:p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/60">
                                <div className="mb-10">
                                    <h2 className="text-3xl font-bold text-slate-900 mb-3">Send us a message</h2>
                                    <p className="text-slate-500">Fill out the form and we'll get back to you shortly.</p>
                                </div>
                                {submitted ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                                        <p className="text-slate-500">Thank you for reaching out. We'll get back to you shortly.</p>
                                    </div>
                                ) : (
                                <form className="space-y-6" onSubmit={(e) => {
                                    e.preventDefault();
                                    post(route('contact.store'));
                                }}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700">
                                                First Name <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                value={data.first_name}
                                                onChange={(e) => setData('first_name', e.target.value)}
                                                placeholder="John"
                                                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                                            />
                                            {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700">
                                                Last Name <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                value={data.last_name}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                placeholder="Doe"
                                                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                                            />
                                            {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                            Email Address <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="john@example.com"
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                                        />
                                        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                                        />
                                        {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="block text-sm font-semibold text-slate-700">
                                            Subject <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="What can we help you with?"
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                                        />
                                        {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="reservation" className="block text-sm font-semibold text-slate-700">
                                            Rental / Reservation Number
                                            <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="reservation"
                                            value={data.reservation_number}
                                            onChange={(e) => setData('reservation_number', e.target.value)}
                                            placeholder="e.g. RSV-001234"
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                                        />
                                        {errors.reservation_number && <p className="text-sm text-red-600">{errors.reservation_number}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="message" className="block text-sm font-semibold text-slate-700">
                                            Message <span className="text-red-400">*</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            rows={5}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            placeholder="Tell us about your rental needs..."
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 resize-none"
                                        />
                                        {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
                                    </div>
                                    <div className="pt-2">
                                        <Turnstile
                                            siteKey="1x00000000000000000000AA"
                                            onSuccess={(token) => setCaptchaToken(token)}
                                            onExpire={() => setCaptchaToken(null)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!captchaToken || processing}
                                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all duration-200 group ${
                                            captchaToken && !processing
                                                ? 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5 cursor-pointer'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Message
                                                <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </form>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div data-animate className="opacity-0 translate-y-12 transition-all duration-700">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Get in touch</h3>
                                <p className="text-slate-500 mb-8">Choose the most convenient way to reach us.</p>
                            </div>

                            <div className="space-y-4">
                                {contactMethods.map((method, i) => (
                                    <a
                                        key={method.label}
                                        href={method.href}
                                        data-animate
                                        className="opacity-0 translate-y-12 block group"
                                        style={{ transitionDelay: `${(i + 1) * 100}ms` }}
                                    >
                                        <div className="flex items-start gap-5 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300">
                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${method.color} ring-1 flex items-center justify-center`}>
                                                {method.icon}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-slate-900">{method.label}</span>
                                                    <svg className="w-4 h-4 text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-slate-700">{method.value}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{method.description}</p>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>

                            <div data-animate className="opacity-0 translate-y-12 transition-all duration-700" style={{ transitionDelay: '400ms' }}>
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                                    <h4 className="font-bold text-lg mb-2">Emergency Roadside?</h4>
                                    <p className="text-slate-400 text-sm mb-4">
                                        24/7 support for all active rentals. Call our emergency line anytime.
                                    </p>
                                    <a
                                        href="tel:+18005559378"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all duration-200 backdrop-blur-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        Call Emergency Line
                                    </a>
                                </div>
                            </div>

                            {footerSettings?.social_links && footerSettings.social_links.filter((link: any) => link.url && link.url !== '#').length > 0 && (
                            <div data-animate className="opacity-0 translate-y-12 transition-all duration-700" style={{ transitionDelay: '500ms' }}>
                                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                    <h4 className="font-semibold text-slate-900 mb-4">Follow Us</h4>
                                    <div className="flex gap-3">
                                        {footerSettings.social_links.filter((link: any) => link.url && link.url !== '#').map((social: any) => (
                                            <a
                                                key={social.platform}
                                                href={social.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"
                                                aria-label={social.label}
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d={socialIcons[social.platform] || socialIcons.facebook} />
                                                </svg>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-16 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div data-animate className="opacity-0 translate-y-12 transition-all duration-700">
                        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 p-10 sm:p-14 text-center">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-60 h-60 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to hit the road?</h2>
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
