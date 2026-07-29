import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import CouponForm from '@/Components/CouponForm';

interface CouponType {
    id: number;
    name: string;
}

interface CreateProps {
    couponTypes: CouponType[];
}

export default function Create({ couponTypes }: CreateProps) {
    const route = useRoute();
    const { data, setData, post, processing, errors } = useForm({
        issued_by: '',
        start_date: '',
        end_date: '',
        min_order: '',
        max_uses: '',
        coupon_type_id: '',
        min_rate: '',
        is_active: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('admin.coupons.store'));
    }

    return (
        <>
            <Head title="Create Coupon" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Coupons', href: 'admin.coupons.index' }, { label: 'Add Coupon' }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative">
                            <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Coupon Management
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1">
                                Create Coupon
                            </h1>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 max-w-3xl">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Back link */}
                            <Link href={route('admin.coupons.index')}
                                className="inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Coupons
                            </Link>

                            <CouponForm
                                couponTypes={couponTypes}
                                data={data}
                                setData={setData}
                                errors={errors}
                                processing={processing}
                                onCancel={() => window.history.back()}
                            />
                        </form>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
