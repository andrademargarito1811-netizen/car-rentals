import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

function SectionCard({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                </div>
                <div>
                    <h2 className="text-base font-bold text-surface-900 dark:text-white">{title}</h2>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

export default function AdminUsersCreate() {
    const route = useRoute();
    const [preview, setPreview] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        role: 'admin',
        status: 'active',
        profile_photo: null as File | null,
        send_welcome_email: true,
    });

    const [nameValue, setNameValue] = useState('');

    const d = data;

    const passwordStrength = useMemo(() => {
        const pw = d.password;
        if (!pw) return { label: 'None', color: 'bg-surface-300', textColor: 'text-surface-500', width: '0%' };
        let score = 0;
        if (pw.length >= 8) score += 25;
        if (pw.length >= 12) score += 10;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 25;
        if (/\d/.test(pw)) score += 20;
        if (/[^a-zA-Z0-9]/.test(pw)) score += 20;
        if (score >= 90) return { label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600', width: '100%' };
        if (score >= 70) return { label: 'Strong', color: 'bg-emerald-400', textColor: 'text-emerald-600', width: '80%' };
        if (score >= 50) return { label: 'Medium', color: 'bg-amber-400', textColor: 'text-amber-600', width: '60%' };
        if (score >= 25) return { label: 'Weak', color: 'bg-orange-400', textColor: 'text-orange-600', width: '40%' };
        return { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600', width: '20%' };
    }, [d.password]);

    const formComplete = useMemo(() => {
        const required = ['name', 'email', 'password', 'password_confirmation'];
        const filled = required.filter(f => (d as any)[f] && String((d as any)[f]).trim() !== '').length;
        return Math.round((filled / required.length) * 100);
    }, [d]);

    const initials = useMemo(() => {
        if (!d.name) return '?';
        return d.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }, [d.name]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('admin.users.store'), { forceFormData: true });
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setData('profile_photo', file);
            setPreview(URL.createObjectURL(file));
        }
    }

    function fieldProps(field: keyof typeof data) {
        return {
            value: String(data[field] ?? ''),
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                setData(field, e.target.value as never);
            },
        };
    }

    function err(field: keyof typeof errors) {
        const msg = errors[field];
        return msg ? (
            <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-fade-in">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {msg}
            </p>
        ) : null;
    }

    return (
        <>
            <Head title="Create Account" />
            <AuthenticatedLayout
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-surface-900 dark:from-brand-950 dark:via-brand-900 dark:to-surface-950 p-5 sm:p-6">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-400/10 rounded-full blur-3xl animate-float-orb" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-400/10 rounded-full blur-3xl animate-float-orb-delayed" />
                        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-accent-300/5 rounded-full blur-2xl animate-slow-spin" />

                        <div className="flex items-center gap-2 mb-3 text-xs font-medium text-brand-200/70 animate-fade-in-down">
                            <Link href={route('admin.users.index')} className="hover:text-accent-300 transition-colors">Accounts</Link>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-white/60">Add New</span>
                        </div>

                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10 ring-1 ring-white/20 animate-bounce-in">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4.5 19.5a6 6 0 0112 0v.75h-12v-.75z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create Account</h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent-400/20 text-accent-300 ring-1 ring-accent-400/30 animate-fade-in">New User</span>
                                </div>
                                <p className="text-sm text-brand-200/80 mt-0.5">Fill in the details below to create a new account</p>
                            </div>
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm ring-1 ring-white/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-soft-pulse" />
                                    <span className="text-[11px] font-medium text-brand-200/80">{formComplete < 100 ? 'Incomplete' : 'Ready'}</span>
                                </div>
                                <div className="h-8 w-px bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-brand-300/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span className="text-xs font-medium text-brand-200/60">{formComplete}% complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6 page-enter">
                    <div className="px-4 lg:px-8">
                        <form onSubmit={submit}>
                            <div className="flex flex-col xl:flex-row gap-6">

                                {/* ─── Left column: Form ─── */}
                                <div className="flex-1 min-w-0 space-y-6">

                                    <Link href={route('admin.users.index')}
                                        className="inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Accounts
                                    </Link>

                                    {/* Profile Photo + Welcome Email */}
                                    <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-surface-800/40 dark:to-surface-800/10 border border-amber-200/70 dark:border-surface-700/40">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16 shrink-0 rounded-full border-2 border-dashed border-amber-300 dark:border-surface-600/60 bg-amber-50/70 dark:bg-surface-800/50 group cursor-pointer overflow-hidden transition-all duration-300 hover:border-brand-400 hover:shadow-glow-blue">
                                                <input type="file" onChange={onFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                {preview ? (
                                                    <img src={preview} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                        <svg className="w-6 h-6 text-amber-700 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="sm:hidden">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Profile Photo</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-amber-900 dark:text-white">Profile Photo</p>
                                                <p className="text-xs text-amber-600/80 dark:text-surface-500 mt-0.5">JPG, PNG or WebP. Max 2MB.</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                                </svg>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('send_welcome_email', !d.send_welcome_email)}
                                                    className={`relative inline-flex h-6 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                                                        d.send_welcome_email ? 'bg-brand-600' : 'bg-amber-300 dark:bg-surface-600'
                                                    }`}
                                                >
                                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-amber-50 shadow-md transition-transform duration-300 ${d.send_welcome_email ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                                <span className="text-xs font-medium text-amber-800 dark:text-surface-400 whitespace-nowrap">
                                                    {d.send_welcome_email ? 'Welcome email on' : 'Welcome email off'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Information */}
                                    <SectionCard
                                        title="Personal Information"
                                        subtitle="Name, contact details and demographic information"
                                        icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
                                    >
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="label-text">Full Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={nameValue}
                                                    onChange={e => {
                                                        setNameValue(e.target.value);
                                                        setData('name', e.target.value);
                                                    }}
                                                    placeholder="John Doe"
                                                    className="input-field" />
                                                {err('name')}
                                            </div>
                                            <div>
                                                <label className="label-text">Username</label>
                                                <input type="text" {...fieldProps('username')} placeholder="" className="input-field" />
                                                {err('username')}
                                            </div>
                                            <div>
                                                <label className="label-text">Email Address <span className="text-red-500">*</span></label>
                                                <input type="email" {...fieldProps('email')} placeholder="john@example.com" className="input-field" />
                                                {err('email')}
                                            </div>
                                            <div>
                                                <label className="label-text">Phone</label>
                                                <input type="text" {...fieldProps('phone')} placeholder="+1 (555) 123-4567" className="input-field" />
                                                {err('phone')}
                                            </div>
                                            <div>
                                                <label className="label-text">Date of Birth</label>
                                                <input type="date" {...fieldProps('date_of_birth')} className="input-field" />
                                                {err('date_of_birth')}
                                            </div>
                                            <div>
                                                <label className="label-text">Gender</label>
                                                <select {...fieldProps('gender')} className="input-field">
                                                    <option value="">Prefer not to say</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                {err('gender')}
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="label-text">Address</label>
                                                <textarea {...fieldProps('address')} placeholder="123 Main St, City, State" rows={2} className="input-field resize-none" />
                                                {err('address')}
                                            </div>
                                        </div>
                                    </SectionCard>

                                    {/* Account Security */}
                                    <SectionCard
                                        title="Account Security"
                                        subtitle="Password, role assignment and account status"
                                        icon="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                                    >
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="label-text">Password <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        {...fieldProps('password')}
                                                        placeholder=""
                                                        className="input-field pr-9"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-700 dark:text-surface-400 hover:text-amber-900 dark:hover:text-white transition-colors"
                                                    >
                                                        {showPassword ? (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {err('password')}
                                                {d.password && (
                                                    <div className="mt-2">
                                                        <div className="w-full h-1 bg-amber-100/60 dark:bg-surface-700/50 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`} style={{ width: passwordStrength.width }} />
                                                        </div>
                                                        <p className={`text-[10px] font-semibold mt-0.5 ${passwordStrength.textColor}`}>{passwordStrength.label}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="label-text">Confirm Password <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        {...fieldProps('password_confirmation')}
                                                        placeholder=""
                                                        className="input-field pr-9"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-700 dark:text-surface-400 hover:text-amber-900 dark:hover:text-white transition-colors"
                                                    >
                                                        {showConfirmPassword ? (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {err('password_confirmation')}
                                            </div>
                                            <div>
                                                <label className="label-text">Role</label>
                                                <select {...fieldProps('role')} className="input-field">
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                {err('role')}
                                            </div>
                                            <div>
                                                <label className="label-text">Status</label>
                                                <select {...fieldProps('status')} className="input-field">
                                                    <option value="active">Active</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                                {err('status')}
                                            </div>
                                        </div>
                                    </SectionCard>

                                    {/* Submit */}
                                    <div className="flex items-center justify-between">
                                        <Link href={route('admin.users.index')}
                                            className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-white transition-colors font-medium">
                                            Cancel
                                        </Link>
                                        <button type="submit" className="btn-primary" disabled={processing}>
                                            {processing ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                    Creating...
                                                </span>
                                            ) : 'Create Account'}
                                        </button>
                                    </div>
                                </div>

                                {/* ─── Right column: Live Preview ─── */}
                                <div className="w-full xl:w-80 2xl:w-96 shrink-0">
                                    <div className="xl:sticky xl:top-6 space-y-4">
                                        <div className="card overflow-hidden">
                                            <div className="bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 px-5 py-6 text-center">
                                                {preview ? (
                                                    <div className="w-20 h-20 rounded-full mx-auto ring-4 ring-white/20 overflow-hidden">
                                                        <img src={preview} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-20 h-20 rounded-full mx-auto ring-4 ring-white/20 bg-brand-400/30 flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-white">{initials}</span>
                                                    </div>
                                                )}
                                                <h3 className="text-lg font-bold text-white mt-3 truncate">
                                                    {d.name || 'New User'}
                                                </h3>
                                                {d.username && (
                                                    <p className="text-sm text-brand-200 truncate">@{d.username}</p>
                                                )}
                                                <div className="flex items-center justify-center gap-2 mt-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                        d.role === 'admin'
                                                            ? 'bg-accent-400/20 text-accent-200 ring-1 ring-accent-400/30'
                                                            : 'bg-white/10 text-brand-200 ring-1 ring-white/10'
                                                    }`}>
                                                        {d.role === 'admin' ? (
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                                                            </svg>
                                                        )}
                                                        {d.role}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                        d.status === 'active'
                                                            ? 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/30'
                                                            : 'bg-red-400/20 text-red-200 ring-1 ring-red-400/30'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                        {d.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="px-5 py-4 space-y-3">
                                                {d.email && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <svg className="w-4 h-4 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                        </svg>
                                                        <span className="text-surface-600 dark:text-surface-400 truncate">{d.email}</span>
                                                    </div>
                                                )}
                                                {d.phone && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <svg className="w-4 h-4 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                                        </svg>
                                                        <span className="text-surface-600 dark:text-surface-400">{d.phone}</span>
                                                    </div>
                                                )}
                                                {d.date_of_birth && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <svg className="w-4 h-4 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                        </svg>
                                                        <span className="text-surface-600 dark:text-surface-400">{new Date(d.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                    </div>
                                                )}
                                                {d.gender && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <svg className="w-4 h-4 text-surface-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                                                        </svg>
                                                        <span className="text-surface-600 dark:text-surface-400 capitalize">{d.gender.replace(/_/g, ' ')}</span>
                                                    </div>
                                                )}
                                                {d.address && (
                                                    <div className="flex items-start gap-3 text-sm">
                                                        <svg className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                        </svg>
                                                        <span className="text-surface-600 dark:text-surface-400">{d.address}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="px-5 py-3 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-700/50">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-surface-500 dark:text-surface-400">Password</span>
                                                    {d.password ? (
                                                        <span className={`font-semibold ${passwordStrength.textColor}`}>{passwordStrength.label}</span>
                                                    ) : (
                                                        <span className="text-surface-400">Not set</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-xs mt-1.5">
                                                    <span className="text-surface-500 dark:text-surface-400">Welcome Email</span>
                                                    <span className={`font-semibold ${d.send_welcome_email ? 'text-emerald-600' : 'text-surface-400'}`}>
                                                        {d.send_welcome_email ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                                <div className="mt-3 w-full h-1 bg-amber-100/60 dark:bg-surface-700/50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-brand-500 to-accent-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${formComplete}%` }} />
                                                </div>
                                                <p className="text-[10px] text-surface-400 text-center mt-1">{formComplete}% complete</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </form>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
