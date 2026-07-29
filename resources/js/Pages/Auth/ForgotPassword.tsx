import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const route = useRoute();
    const form = useForm({ email: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('password.email'));
    }

    return (
        <GuestLayout>
            <Head title="Forgot Password" />
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
                        <h1 className="text-2xl font-bold text-surface-900">Forgot password?</h1>
                        <p className="text-surface-500 mt-1">No problem. Enter your email and we'll send you a reset link.</p>
                    </div>

                    <div className="card p-8">
                        {status && (
                            <div className="mb-4 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="label-text">Email</label>
                                <input id="email" type="email" value={form.data.email}
                                    onChange={e => form.setData('email', e.target.value)}
                                    required autoFocus autoComplete="username"
                                    className="input-field" placeholder="you@example.com" />
                                {form.errors.email && <p className="mt-1.5 text-sm text-red-600">{form.errors.email}</p>}
                            </div>

                            <button type="submit" className="btn-primary w-full" disabled={form.processing}>
                                {form.processing ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <p className="text-center text-sm text-surface-500">
                                <Link href={route('login')} className="text-brand-800 hover:text-brand-700 font-medium transition-colors">
                                    Back to sign in
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
