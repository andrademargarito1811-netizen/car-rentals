import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function TermsAndConditions() {
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
            <Head title="Terms and Conditions" />

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
                        Terms and{' '}
                        <span className="bg-gradient-to-r from-brand-400 via-amber-400 to-brand-400 bg-clip-text text-transparent">
                            Conditions
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-4">
                        The terms and conditions governing the use of our website and services.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div data-animate className="opacity-0 translate-y-12 transition-all duration-700 space-y-8 text-slate-600 leading-relaxed">
                        <p>
                            Welcome to West Car Rentals. By accessing our website and using our services, you agree to be bound by the following terms and conditions. Please read them carefully before proceeding with any booking or transaction.
                        </p>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Definitions</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>"Company," "we," "us," or "our" refers to West Car Rentals</li>
                                <li>"Customer," "you," or "your" refers to the person renting the vehicle or using the website</li>
                                <li>"Vehicle" refers to the rental vehicle provided under the rental agreement</li>
                                <li>"Rental Agreement" refers to the contract signed at the time of vehicle pick-up</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Booking and Payment</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>All bookings are subject to vehicle availability and confirmation by West Car Rentals</li>
                                <li>A valid credit card is required to secure all reservations</li>
                                <li>Payment is due at the time of pick-up unless otherwise agreed</li>
                                <li>Prices are subject to change without notice until a booking is confirmed</li>
                                <li>All applicable taxes and fees will be disclosed prior to completing your booking</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Cancellation and Refunds</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Cancellations made 48 hours or more before pick-up are eligible for a full refund</li>
                                <li>Cancellations made within 48 hours may incur a cancellation fee equal to one day's rental</li>
                                <li>No-shows will be charged the full rental amount</li>
                                <li>Early returns do not qualify for refunds of unused rental days</li>
                                <li>Refunds are processed within 5-10 business days to the original payment method</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Customer Responsibilities</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>You must return the vehicle in the same condition as received, subject to normal wear and tear</li>
                                <li>You are responsible for all traffic violations, tolls, and parking fines incurred during the rental period</li>
                                <li>You must notify us immediately in case of an accident or damage</li>
                                <li>Smoking is strictly prohibited inside all vehicles</li>
                                <li>The vehicle must not be used to transport hazardous materials</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Limitation of Liability</h2>
                            <p className="mb-4">
                                To the fullest extent permitted by law, West Car Rentals shall not be liable for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Any indirect, incidental, or consequential damages arising from the rental</li>
                                <li>Loss or damage to personal property left in the vehicle</li>
                                <li>Any costs incurred due to vehicle breakdown, subject to our roadside assistance policy</li>
                                <li>Delays or cancellations caused by events beyond our reasonable control</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Governing Law</h2>
                            <p>
                                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the rental takes place. Any disputes arising from these terms shall be resolved in the courts of that jurisdiction.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Severability</h2>
                            <p>
                                If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Contact Information</h2>
                            <p>
                                For questions or concerns regarding these Terms and Conditions, please contact us at{' '}
                                <a href="mailto:support@westcarsales.com" className="text-brand-600 hover:text-brand-700 underline">support@westcarsales.com</a>{' '}
                                or call +1 (800) 555-WEST. You may also write to us at 123 Auto Drive, Motor City, MC 12345.
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
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
                                <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
                                    Book your vehicle today and experience the West Car Rentals difference.
                                </p>
                                <Link
                                    href={route('cars.index')}
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-semibold hover:bg-brand-50 transition-all duration-200 shadow-lg shadow-brand-800/20 hover:-translate-y-0.5"
                                >
                                    Browse Our Fleet
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
