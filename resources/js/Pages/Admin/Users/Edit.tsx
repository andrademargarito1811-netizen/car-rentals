import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface AdminUsersEditProps {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        status: string;
        phone: string | null;
        address: string | null;
    };
}

export default function AdminUsersEdit({ user }: AdminUsersEditProps) {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const isSelf = auth?.user?.id === user.id;

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        password: '',
        role: user.role,
        status: user.status,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    }

    return (
        <>
            <Head title={`Edit: ${user.name}`} />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Users', href: 'admin.users.index' }, { label: 'Edit User' }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative">
                            <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Account Management
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1">
                                Edit Account
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <p className="text-white/60 text-sm">{user.name}</p>
                                <span className="text-white/40">\u00B7</span>
                                <p className="text-white/60 text-sm">{user.email}</p>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 max-w-3xl">
                        <form onSubmit={submit} className="space-y-8">
                            <Link href={route('admin.users.index')}
                                className="inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Accounts
                            </Link>

                            {/* Self-edit warning */}
                            {isSelf && (
                                <div className="card !rounded-2xl border-amber-200/80 dark:border-amber-700/30 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10 dark:to-transparent" />
                                    <div className="relative flex items-start gap-3 p-5">
                                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm text-amber-700 dark:text-amber-300">
                                            <p className="font-semibold">You are editing your own account.</p>
                                            <p className="text-amber-600/80 dark:text-amber-400/80 mt-0.5">Role and status changes are disabled for your own account to prevent lockout.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Profile Information */}
                            <div className="card p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-surface-900 dark:text-white">Profile Information</h2>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">Update account details.</p>
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="label-text">Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="input-field" />
                                        {errors.name && <p className="text-sm text-red-500 mt-1.5">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="label-text">Email Address <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="input-field" />
                                        {errors.email && <p className="text-sm text-red-500 mt-1.5">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="label-text">New Password</label>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            placeholder="Leave blank to keep current"
                                            className="input-field" />
                                        {errors.password && <p className="text-sm text-red-500 mt-1.5">{errors.password}</p>}
                                    </div>

                                    <div>
                                        <label className="label-text">Phone</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            placeholder="+1 (555) 123-4567"
                                            className="input-field" />
                                        {errors.phone && <p className="text-sm text-red-500 mt-1.5">{errors.phone}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="label-text">Address</label>
                                        <textarea
                                            value={data.address}
                                            onChange={e => setData('address', e.target.value)}
                                            placeholder="123 Main St, City, State"
                                            rows={2}
                                            className="input-field resize-none" />
                                        {errors.address && <p className="text-sm text-red-500 mt-1.5">{errors.address}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Role & Status */}
                            <div className="card p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-md shadow-accent-500/20 shrink-0">
                                        <svg className="w-5 h-5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-surface-900 dark:text-white">Role & Status</h2>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">Manage permissions and account state.</p>
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="label-text">Role</label>
                                        <select
                                            value={data.role}
                                            onChange={e => setData('role', e.target.value)}
                                            disabled={isSelf}
                                            className="input-field">
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {isSelf && <p className="text-xs text-surface-400 mt-1">Cannot change your own role.</p>}
                                        {errors.role && <p className="text-sm text-red-500 mt-1.5">{errors.role}</p>}
                                    </div>

                                    <div>
                                        <label className="label-text">Status</label>
                                        <select
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            disabled={isSelf}
                                            className="input-field">
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                        {isSelf && <p className="text-xs text-surface-400 mt-1">Cannot change your own status.</p>}
                                        {errors.status && <p className="text-sm text-red-500 mt-1.5">{errors.status}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-between">
                                <Link href={route('admin.users.index')}
                                    className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-white transition-colors font-medium">
                                    Cancel
                                </Link>
                                <button type="submit" className="btn-primary" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
