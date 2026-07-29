import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

export default function ConfirmPassword() {
    const route = useRoute();
    const form = useForm({ password: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(route('password.confirm'), {
            onFinish: () => form.reset(),
        });
    }

    return (
        <GuestLayout>
            <Head title="Confirm Password" />
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-surface-50 px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-surface-900">Confirm your password</h1>
                        <p className="text-surface-500 mt-1">This is a secure area. Please confirm your password to continue.</p>
                    </div>

                    <div className="card p-8">
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="label-text">Password</label>
                                <input id="password" type="password" value={form.data.password}
                                    onChange={e => form.setData('password', e.target.value)}
                                    required autoFocus autoComplete="current-password"
                                    className="input-field" placeholder="Enter your password" />
                                {form.errors.password && <p className="mt-1.5 text-sm text-red-600">{form.errors.password}</p>}
                            </div>

                            <button type="submit" className="btn-primary w-full" disabled={form.processing}>
                                {form.processing ? 'Confirming...' : 'Confirm'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
