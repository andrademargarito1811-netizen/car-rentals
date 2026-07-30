import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

export default function TermsOfService() {
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
            <Head title="Terms of Service" />

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
                        Terms of{' '}
                        <span className="bg-gradient-to-r from-brand-400 via-amber-400 to-brand-400 bg-clip-text text-transparent">
                            Service
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-4">
                        Please read these terms carefully before using our services.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div data-animate className="opacity-0 translate-y-12 transition-all duration-700 space-y-8 text-slate-600 leading-relaxed">
                        <p>
                            By accessing or using the West Car Rentals website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should not use our services.
                        </p>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Rental Eligibility</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>You must be at least 21 years of age to rent a vehicle (age requirements may vary by location)</li>
                                <li>A valid driver's license held for a minimum of one year is required</li>
                                <li>A valid credit card in the renter's name must be provided at pick-up</li>
                                <li>International renters must provide a valid passport and international driver's permit if required</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Reservations and Payments</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>All reservations are subject to vehicle availability</li>
                                <li>Rates are quoted in USD and include applicable taxes unless stated otherwise</li>
                                <li>A valid credit card is required to guarantee all reservations</li>
                                <li>Cancellation policies vary by rate type and will be disclosed at the time of booking</li>
                                <li>No-shows may be charged the full rental amount</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Vehicle Use</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Vehicles must not be used for illegal activities</li>
                                <li>Unauthorized drivers are strictly prohibited</li>
                                <li>Vehicles must not be driven off paved roads unless specifically permitted</li>
                                <li>Smoking is prohibited in all rental vehicles (a cleaning fee will apply)</li>
                                <li>Pets are allowed only with prior approval and may incur additional fees</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Insurance and Liability</h2>
                            <p className="mb-4">Renters are responsible for the vehicle during the rental period. Various insurance options are available:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Collision Damage Waiver (CDW) reduces financial liability for damage</li>
                                <li>Liability Insurance is included as required by law</li>
                                <li>Personal Accident Insurance is available upon request</li>
                                <li>Renter's personal insurance may provide coverage; please check with your provider</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Fuel Policy</h2>
                            <p>
                                Vehicles are provided with a full tank of fuel and must be returned with a full tank. If the vehicle is returned with less fuel, a refueling service charge will apply. Pre-purchase fuel options may be available at discounted rates.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Late Returns</h2>
                            <p>
                                A grace period of 29 minutes is provided. Returns beyond the grace period may incur additional hourly charges up to a full day's rental rate. Extensions must be authorized in advance.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Modifications to Terms</h2>
                            <p>
                                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website. Continued use of our services after any changes constitutes acceptance of the new terms.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Contact Information</h2>
                            <p>
                                For questions about these Terms of Service, please contact us at{' '}
                                <a href="mailto:support@westcarsales.com" className="text-brand-600 hover:text-brand-700 underline">support@westcarsales.com</a>{' '}
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
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to rent a car?</h2>
                                <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
                                    Browse our fleet and find the perfect vehicle for your journey.
                                </p>
                                <Link
                                    href={route('cars.index')}
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
