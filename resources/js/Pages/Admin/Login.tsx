import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface LoginProps {
    canResetPassword?: boolean;
    status?: string;
}

export default function AdminLogin({ canResetPassword, status }: LoginProps) {
    const route = useRoute();
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('admin.login'), {
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <>
            <Head title="Admin Sign In" />
            <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Link href={route('admin.login')} className="inline-flex items-center gap-2 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/25">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                        <p className="text-surface-400 mt-1">Sign in to manage your rental fleet</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-8">
                        {status && (
                            <div className="mb-4 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-surface-700 mb-1.5">Email</label>
                                <input id="email" type="email" value={form.data.email}
                                    onChange={e => form.setData('email', e.target.value)}
                                    required autoFocus autoComplete="username"
                                    className="w-full rounded-xl border-2 border-surface-200 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-accent-500 focus:ring-accent-500/20 focus:ring-4 transition-all outline-none"
                                    placeholder="admin@example.com" />
                                {form.errors.email && <p className="mt-1.5 text-sm text-red-600">{form.errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-surface-700 mb-1.5">Password</label>
                                <input id="password" type="password" value={form.data.password}
                                    onChange={e => form.setData('password', e.target.value)}
                                    required autoComplete="current-password"
                                    className="w-full rounded-xl border-2 border-surface-200 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 focus:border-accent-500 focus:ring-accent-500/20 focus:ring-4 transition-all outline-none"
                                    placeholder="Enter your password" />
                                {form.errors.password && <p className="mt-1.5 text-sm text-red-600">{form.errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.data.remember}
                                        onChange={e => form.setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-surface-300 text-accent-600 focus:ring-accent-500/20" />
                                    <span className="text-sm text-surface-600">Remember me</span>
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')}
                                        className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            <button type="submit" className="w-full rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 hover:bg-accent-700 focus:ring-4 focus:ring-accent-500/20 transition-all disabled:opacity-60" disabled={form.processing}>
                                {form.processing ? 'Authenticating...' : 'Sign In to Admin'}
                            </button>
                        </form>
                    </div>

                    <p className="text-center mt-6">
                        <Link href={route('login')} className="text-sm text-surface-500 hover:text-surface-300 transition-colors">
                            &larr; Back to Customer Login
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
