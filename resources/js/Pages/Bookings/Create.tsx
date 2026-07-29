import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface BookingsCreateProps {
    car: {
        id: number;
        brand: string;
        model: string;
        year: number;
        daily_rate: number;
    };
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function BookingsCreate({ car }: BookingsCreateProps) {
    const route = useRoute();
    const form = useForm({
        car_id: car.id,
        start_date: '',
        end_date: '',
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('bookings.store'));
    }

    return (
        <>
            <Head title="Book a Car" />
            <AuthenticatedLayout header={<h2 className="text-2xl font-bold text-surface-900">Book {car.brand} {car.model}</h2>}>
                <div className="py-8 sm:py-12">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="card overflow-hidden">
                            <div className="p-8 sm:p-10">
                                <div className="mb-8 rounded-xl bg-brand-800/5 p-6 border border-brand-800/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-brand-800/10 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-surface-900">{car.brand} {car.model} ({car.year})</p>
                                            <p className="text-brand-800 font-semibold text-sm">{formatPrice(car.daily_rate)} per day</p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={submit} className="space-y-6">
                                    <input type="hidden" value={form.data.car_id} onChange={() => {}} />

                                    <div>
                                        <label className="label-text">Start Date</label>
                                        <input id="start_date" type="date" value={form.data.start_date}
                                            onChange={e => form.setData('start_date', e.target.value)}
                                            className="input-field" />
                                        {form.errors.start_date && <p className="mt-1.5 text-sm text-red-600">{form.errors.start_date}</p>}
                                    </div>

                                    <div>
                                        <label className="label-text">End Date</label>
                                        <input id="end_date" type="date" value={form.data.end_date}
                                            onChange={e => form.setData('end_date', e.target.value)}
                                            className="input-field" />
                                        {form.errors.end_date && <p className="mt-1.5 text-sm text-red-600">{form.errors.end_date}</p>}
                                    </div>

                                    <div>
                                        <label className="label-text">Notes (Optional)</label>
                                        <textarea id="notes" value={form.data.notes}
                                            onChange={e => form.setData('notes', e.target.value)}
                                            rows={4} className="input-field resize-none"
                                            placeholder="Any special requests..."></textarea>
                                        {form.errors.notes && <p className="mt-1.5 text-sm text-red-600">{form.errors.notes}</p>}
                                    </div>

                                    <div className="flex items-center justify-between pt-4">
                                        <Link href={route('cars.show', car.id)} className="text-sm text-surface-500 hover:text-surface-700 transition-colors font-medium">
                                            Cancel
                                        </Link>
                                        <button type="submit" className="btn-accent" disabled={form.processing}>
                                            {form.processing ? 'Booking...' : 'Confirm Booking'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
