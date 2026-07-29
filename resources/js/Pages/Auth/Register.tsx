import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

export default function Register() {
    const route = useRoute();
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('register'), {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }

    return (
        <GuestLayout>
            <Head title="Create Account" />
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
                        <h1 className="text-2xl font-bold text-surface-900">Create your account</h1>
                        <p className="text-surface-500 mt-1">Join us and start your journey</p>
                    </div>

                    <div className="card p-8">
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="label-text">Full Name</label>
                                <input id="name" type="text" value={form.data.name}
                                    onChange={e => form.setData('name', e.target.value)}
                                    required autoFocus autoComplete="name"
                                    className="input-field" placeholder="John Doe" />
                                {form.errors.name && <p className="mt-1.5 text-sm text-red-600">{form.errors.name}</p>}
                            </div>

                            <div>
                                <label className="label-text">Email</label>
                                <input id="email" type="email" value={form.data.email}
                                    onChange={e => form.setData('email', e.target.value)}
                                    required autoComplete="username"
                                    className="input-field" placeholder="you@example.com" />
                                {form.errors.email && <p className="mt-1.5 text-sm text-red-600">{form.errors.email}</p>}
                            </div>

                            <div>
                                <label className="label-text">Password</label>
                                <input id="password" type="password" value={form.data.password}
                                    onChange={e => form.setData('password', e.target.value)}
                                    required autoComplete="new-password"
                                    className="input-field" placeholder="Create a password" />
                                {form.errors.password && <p className="mt-1.5 text-sm text-red-600">{form.errors.password}</p>}
                            </div>

                            <div>
                                <label className="label-text">Confirm Password</label>
                                <input id="password_confirmation" type="password" value={form.data.password_confirmation}
                                    onChange={e => form.setData('password_confirmation', e.target.value)}
                                    required autoComplete="new-password"
                                    className="input-field" placeholder="Confirm your password" />
                            </div>

                            <button type="submit" className="btn-primary w-full" disabled={form.processing}>
                                {form.processing ? 'Creating account...' : 'Create Account'}
                            </button>

                            <p className="text-center text-sm text-surface-500">
                                Already have an account?{' '}
                                <Link href={route('login')} className="text-brand-800 hover:text-brand-700 font-medium transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
