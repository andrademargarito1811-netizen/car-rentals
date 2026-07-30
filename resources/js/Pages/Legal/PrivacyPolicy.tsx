import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function PrivacyPolicy() {
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
            <Head title="Privacy Policy" />

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
                        Privacy{' '}
                        <span className="bg-gradient-to-r from-brand-400 via-amber-400 to-brand-400 bg-clip-text text-transparent">
                            Policy
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-4">
                        How we collect, use, and protect your personal information.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div data-animate className="opacity-0 translate-y-12 transition-all duration-700 space-y-8 text-slate-600 leading-relaxed">
                        <p>
                            West Car Rentals ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
                        </p>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Personal Information</h3>
                            <p className="mb-4">We may collect personally identifiable information such as:</p>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li>Name, email address, phone number, and mailing address</li>
                                <li>Driver's license number and other identification details</li>
                                <li>Payment information (processed securely through our payment partners)</li>
                                <li>Date of birth and age verification</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Non-Personal Information</h3>
                            <p className="mb-4">We automatically collect certain non-personal information when you visit our website:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Browser type and version</li>
                                <li>IP address and device information</li>
                                <li>Pages visited and time spent on our site</li>
                                <li>Referring website addresses</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
                            <p className="mb-4">We use the collected information for the following purposes:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>To process and manage your vehicle reservations</li>
                                <li>To communicate with you about your bookings and inquiries</li>
                                <li>To improve our website and customer service</li>
                                <li>To send promotional offers and updates (with your consent)</li>
                                <li>To comply with legal obligations and prevent fraud</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Information Sharing</h2>
                            <p className="mb-4">We do not sell your personal information. We may share your information with:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Service providers who assist in our business operations (payment processing, customer support)</li>
                                <li>Law enforcement or regulatory authorities when required by law</li>
                                <li>Business partners with your explicit consent</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
                            <p>
                                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted using industry-standard SSL technology.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Your Rights</h2>
                            <p className="mb-4">You have the right to:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Access your personal information held by us</li>
                                <li>Request correction of inaccurate information</li>
                                <li>Request deletion of your information (subject to legal requirements)</li>
                                <li>Opt out of marketing communications at any time</li>
                                <li>Withdraw consent where processing is based on consent</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Cookies</h2>
                            <p>
                                Our website uses cookies to enhance your browsing experience. You can control cookie settings through your browser preferences. Please refer to our Cookie Policy for more detailed information.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at{' '}
                                <a href="mailto:privacy@westcarsales.com" className="text-brand-600 hover:text-brand-700 underline">privacy@westcarsales.com</a>{' '}
                                or call us at +1 (800) 555-WEST.
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
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Have questions about privacy?</h2>
                                <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
                                    We're here to help. Reach out to our support team anytime.
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
