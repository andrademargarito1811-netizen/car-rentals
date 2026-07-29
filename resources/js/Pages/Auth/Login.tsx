import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface LoginProps {
    canResetPassword?: boolean;
    status?: string;
}

export default function Login({ canResetPassword, status }: LoginProps) {
    const route = useRoute();
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('login'), {
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <GuestLayout>
            <Head title="Sign In" />
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
                        <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
                        <p className="text-surface-500 mt-1">Sign in to your account</p>
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

                            <div>
                                <label className="label-text">Password</label>
                                <input id="password" type="password" value={form.data.password}
                                    onChange={e => form.setData('password', e.target.value)}
                                    required autoComplete="current-password"
                                    className="input-field" placeholder="Enter your password" />
                                {form.errors.password && <p className="mt-1.5 text-sm text-red-600">{form.errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.data.remember}
                                        onChange={e => form.setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-surface-300 text-brand-800 focus:ring-brand-800/20" />
                                    <span className="text-sm text-surface-600">Remember me</span>
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')}
                                        className="text-sm text-brand-800 hover:text-brand-700 font-medium transition-colors">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            <button type="submit" className="btn-primary w-full" disabled={form.processing}>
                                {form.processing ? 'Signing in...' : 'Sign In'}
                            </button>

                            <p className="text-center text-sm text-surface-500">
                                Don't have an account?{' '}
                                <Link href={route('register')} className="text-brand-800 hover:text-brand-700 font-medium transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
