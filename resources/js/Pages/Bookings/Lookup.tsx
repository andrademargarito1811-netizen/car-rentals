import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Lookup() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        booking_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('bookings.search'));
    };

    return (
        <>
            <Head title="Track Reservation" />
            <GuestLayout>
                <div className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-400 rounded-full blur-3xl" />
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 py-16 sm:py-24">
                        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
                            {/* Header */}
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <svg className="w-10 h-10 text-accent-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                                    Track Your Reservation
                                </h1>
                                <p className="text-white/70 text-lg">
                                    Enter your email and reservation number to view your booking details
                                </p>
                            </div>

                            {/* Form Card */}
                            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Email Field */}
                                    <div>
                                        <label htmlFor="email" className="label-text text-surface-700">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="input-field mt-2"
                                            placeholder="Enter your email address"
                                            required
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Reservation Number Field */}
                                    <div>
                                        <label htmlFor="booking_id" className="label-text text-surface-700">
                                            Reservation Number
                                        </label>
                                        <input
                                            id="booking_id"
                                            type="text"
                                            value={data.booking_id}
                                            onChange={(e) => setData('booking_id', e.target.value)}
                                            className="input-field mt-2"
                                            placeholder="e.g. 20260042A7K3M9"
                                            required
                                        />
                                        {errors.booking_id && (
                                            <p className="mt-2 text-sm text-red-600">{errors.booking_id}</p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full btn-accent py-4 text-base font-bold rounded-xl disabled:opacity-50 transition-all duration-300"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Searching...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                                </svg>
                                                Find Reservation
                                            </span>
                                        )}
                                    </button>
                                </form>

                                {/* Help Text */}
                                <div className="mt-8 pt-6 border-t border-surface-100">
                                    <p className="text-sm text-surface-500 text-center">
                                        Your reservation number was provided in your confirmation email.
                                        <br />
                                        Check your inbox for the subject line "Booking Confirmation".
                                    </p>
                                </div>
                            </div>

                            {/* Back Link */}
                            <div className="mt-8 text-center">
                                <a
                                    href={route('reservations')}
                                    className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Make a New Reservation
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </GuestLayout>
        </>
    );
}
