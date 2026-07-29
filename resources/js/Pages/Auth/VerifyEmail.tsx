import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface VerifyEmailProps {
    status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
    const route = useRoute();
    const form = useForm({});
    const verificationLinkSent = status === 'verification-link-sent';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('verification.send'));
    }

    return (
        <GuestLayout>
            <Head title="Email Verification" />
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-surface-50 px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Link href={route('cars.index')} className="inline-flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-brand-800 flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                        </Link>
                        <h1 className="text-2xl font-bold text-surface-900">Verify your email</h1>
                    </div>

                    <div className="card p-8">
                        <p className="text-sm text-surface-600 mb-4">
                            Thanks for signing up! Please verify your email by clicking the link we sent you.
                        </p>

                        {verificationLinkSent && (
                            <div className="mb-4 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200">
                                A new verification link has been sent to your email.
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <button type="submit" className="btn-primary w-full" disabled={form.processing}>
                                {form.processing ? 'Sending...' : 'Resend Verification Email'}
                            </button>

                            <div className="text-center">
                                <Link href={route('logout')} method="post" as="button"
                                    className="text-sm text-surface-500 hover:text-surface-700 transition-colors">
                                    Log out
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
