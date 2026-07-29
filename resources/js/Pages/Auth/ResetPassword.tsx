import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface ResetPasswordProps {
    email: string;
    token: string;
}

export default function ResetPassword({ email, token }: ResetPasswordProps) {
    const route = useRoute();
    const form = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('password.store'), {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }

    return (
        <GuestLayout>
            <Head title="Reset Password" />
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
                        <h1 className="text-2xl font-bold text-surface-900">Reset password</h1>
                        <p className="text-surface-500 mt-1">Enter your new password below</p>
                    </div>

                    <div className="card p-8">
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="label-text">Email</label>
                                <input id="email" type="email" value={form.data.email}
                                    onChange={e => form.setData('email', e.target.value)}
                                    required autoFocus autoComplete="username"
                                    className="input-field" />
                            </div>

                            <div>
                                <label className="label-text">Password</label>
                                <input id="password" type="password" value={form.data.password}
                                    onChange={e => form.setData('password', e.target.value)}
                                    required autoComplete="new-password"
                                    className="input-field" placeholder="Enter new password" />
                                {form.errors.password && <p className="mt-1.5 text-sm text-red-600">{form.errors.password}</p>}
                            </div>

                            <div>
                                <label className="label-text">Confirm Password</label>
                                <input id="password_confirmation" type="password" value={form.data.password_confirmation}
                                    onChange={e => form.setData('password_confirmation', e.target.value)}
                                    required autoComplete="new-password"
                                    className="input-field" placeholder="Confirm new password" />
                            </div>

                            <button type="submit" className="btn-primary w-full" disabled={form.processing}>
                                {form.processing ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
