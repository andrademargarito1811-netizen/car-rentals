import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function CookiePolicy() {
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
            <Head title="Cookie Policy" />

            <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[128px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-sm font-medium text-slate-300">Last Updated: July 29, 2026</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                        Cookie{' '}
                        <span className="bg-gradient-to-r from-brand-400 via-amber-400 to-brand-400 bg-clip-text text-transparent">
                            Policy
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-4">
                        How we use cookies and similar technologies on our website.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div data-animate className="opacity-0 translate-y-12 transition-all duration-700 space-y-8 text-slate-600 leading-relaxed">
                        <p>
                            West Car Rentals ("we," "our," or "us") uses cookies and similar tracking technologies on our website. This Cookie Policy explains what cookies are, how we use them, and your choices regarding cookies.
                        </p>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What Are Cookies?</h2>
                            <p>
                                Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit a website. They help the website remember your preferences, enhance your browsing experience, and provide useful information to website operators.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Types of Cookies We Use</h2>

                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Essential Cookies</h3>
                            <p className="mb-4">
                                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies.
                            </p>

                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Performance Cookies</h3>
                            <p className="mb-4">
                                These cookies collect information about how visitors use our website, such as which pages are visited most often. This data helps us improve the performance and design of our site.
                            </p>

                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Functional Cookies</h3>
                            <p className="mb-4">
                                These cookies allow the website to remember choices you make (such as your language preference or location) and provide enhanced, personalized features.
                            </p>

                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Targeting/Advertising Cookies</h3>
                            <p>
                                These cookies are used to deliver advertisements more relevant to you and your interests. They may be set through our site by advertising partners to build a profile of your interests.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Third-Party Cookies</h2>
                            <p>
                                Some cookies are placed by third-party services that appear on our pages. These third parties may include analytics providers (such as Google Analytics) and advertising networks. We do not control these cookies, and you should check the third-party websites for more information about their cookie practices.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. How to Manage Cookies</h2>
                            <p className="mb-4">
                                Most web browsers allow you to control cookies through their settings. You can typically:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>View cookies stored on your device and delete them individually</li>
                                <li>Block all cookies or third-party cookies</li>
                                <li>Set your browser to notify you when a cookie is being set</li>
                                <li>Use private or incognito browsing modes</li>
                            </ul>
                            <p className="mt-4">
                                Please note that disabling certain cookies may affect the functionality and performance of our website.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Changes to This Policy</h2>
                            <p>
                                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Contact Us</h2>
                            <p>
                                If you have any questions about our use of cookies, please contact us at{' '}
                                <a href="mailto:privacy@westcarsales.com" className="text-brand-600 hover:text-brand-700 underline">privacy@westcarsales.com</a>{' '}
                                or call +1 (800) 555-WEST.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-16 sm:py-20 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div data-animate className="opacity-0 translate-y-12 transition-all duration-700">
                        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 p-10 sm:p-14 text-center">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-60 h-60 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Have questions about cookies?</h2>
                                <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
                                    Our support team is happy to help with any questions.
                                </p>
                                <Link
                                    href={route('contact')}
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50 transition-all duration-200 shadow-lg shadow-brand-800/20 hover:-translate-y-0.5"
                                >
                                    Contact Us
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
