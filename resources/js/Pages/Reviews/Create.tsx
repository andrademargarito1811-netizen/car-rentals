import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface ReviewCreateProps {
    booking: {
        reference_code: string;
        status: string;
        car: {
            brand: string;
            model: string;
            year: number;
            image_path?: string;
        };
        guest?: {
            first_name: string;
            last_name: string;
        };
        user?: {
            name: string;
        };
    };
}

export default function ReviewCreate({ booking }: ReviewCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        rating: 0,
        comment: '',
    });

    const [hoveredStar, setHoveredStar] = useState(0);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('reviews.store', booking.reference_code));
    }

    const customerName = booking.guest
        ? `${booking.guest.first_name} ${booking.guest.last_name}`
        : booking.user?.name ?? 'Valued Customer';

    return (
        <>
            <Head title="Leave a Review" />
            <GuestLayout>
                <div className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-400 rounded-full blur-3xl" />
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 py-16 sm:py-24">
                        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <svg className="w-10 h-10 text-accent-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                                    Rate Your Experience
                                </h1>
                                <p className="text-white/70 text-lg">
                                    We'd love to hear about your rental with {booking.car.brand} {booking.car.model}
                                </p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
                                <form onSubmit={submit} className="space-y-8">
                                    {/* Car Info */}
                                    <div className="text-center pb-6 border-b border-surface-200">
                                        <p className="text-sm text-surface-500 mb-1">Reservation {booking.reference_code}</p>
                                        <h2 className="text-xl font-bold text-surface-900">
                                            {booking.car.brand} {booking.car.model} ({booking.car.year})
                                        </h2>
                                    </div>

                                    {/* Star Rating */}
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 mb-3 text-center">
                                            Your Rating
                                        </label>
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onMouseEnter={() => setHoveredStar(star)}
                                                    onMouseLeave={() => setHoveredStar(0)}
                                                    onClick={() => setData('rating', star === data.rating ? 0 : star)}
                                                    className="transition-transform hover:scale-110 focus:outline-none"
                                                >
                                                    <svg
                                                        className={`w-10 h-10 sm:w-12 sm:h-12 ${
                                                            star <= (hoveredStar || data.rating)
                                                                ? 'text-accent-400'
                                                                : 'text-surface-200'
                                                        }`}
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                        {data.rating > 0 && (
                                            <p className="text-center text-sm text-surface-500 mt-2">
                                                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][data.rating]}
                                            </p>
                                        )}
                                        {errors.rating && (
                                            <p className="text-center text-sm text-red-500 mt-2">{errors.rating}</p>
                                        )}
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label htmlFor="comment" className="block text-sm font-semibold text-surface-700 mb-2">
                                            Your Review <span className="text-surface-400 font-normal">(optional)</span>
                                        </label>
                                        <textarea
                                            id="comment"
                                            rows={4}
                                            value={data.comment}
                                            onChange={(e) => setData('comment', e.target.value)}
                                            placeholder="Share your experience with this vehicle..."
                                            className="input-field w-full resize-none"
                                        />
                                        {errors.comment && <p className="text-sm text-red-500 mt-1">{errors.comment}</p>}
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={processing || data.rating === 0}
                                        className="btn-accent w-full py-3"
                                    >
                                        {processing ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </GuestLayout>
        </>
    );
}
