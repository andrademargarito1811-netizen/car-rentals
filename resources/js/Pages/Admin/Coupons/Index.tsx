import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';
import CouponForm from '@/Components/CouponForm';

interface Coupon {
    id: number;
    code: string;
    issued_by: string | null;
    start_date: string | null;
    end_date: string | null;
    min_order: number | null;
    max_uses: number | null;
    user_count: number;
    min_rate: number | null;
    is_active: boolean;
    coupon_type: { id: number; name: string };
    created_at: string;
}

interface CouponType {
    id: number;
    name: string;
}

interface CouponsIndexProps {
    coupons: {
        data: Coupon[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    couponTypes: CouponType[];
}

function palauMs(date: string | null): number {
    if (!date) return 0;
    const dt = new Date(date);
    if (isNaN(dt.getTime())) return 0;
    return dt.getTime() + 9 * 60 * 60 * 1000;
}

function CountdownTimer({ endDate, expired }: { endDate: string; expired: boolean }) {
    const endMs = palauMs(endDate);
    const calc = () => {
        const diff = Math.max(0, endMs - Date.now());
        const totalSec = Math.floor(diff / 1000);
        const d = Math.floor(totalSec / 86400);
        const h = Math.floor((totalSec % 86400) / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return { d, h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') };
    };
    const [t, setT] = useState(calc);
    useEffect(() => {
        const interval = setInterval(() => setT(calc()), 1000);
        return () => clearInterval(interval);
    }, [endDate]);

    if (expired || t.d === 0 && t.h === '00' && t.m === '00' && t.s === '00') {
        return <span className="text-surface-400 dark:text-surface-500 font-semibold text-[10px]">Expired</span>;
    }

    return (
        <span className="tabular-nums tracking-tight font-bold">
            {t.d > 0 && <>{t.d}d </>}
            {t.h}:{t.m}:{t.s}
        </span>
    );
}

function formatDate(date: string): string {
    if (!date) return '\u2014';
    const dt = new Date(date);
    if (isNaN(dt.getTime())) return '\u2014';
    const palau = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[palau.getUTCMonth()]} ${palau.getUTCDate()}, ${palau.getUTCFullYear()}`;
}

function typeBadge(type: string) {
    const map: Record<string, string> = {
        Amount: 'badge-confirmed',
        Percentage: 'badge-active',
        'Per Day': 'badge-pending',
        'Day Free': 'badge-completed',
    };
    return map[type] || 'badge-completed';
}

export default function CouponsIndex({ coupons, couponTypes = [] }: CouponsIndexProps) {
    const route = useRoute();
    const [showCreate, setShowCreate] = useState(false);
    const [copiedCode, setCopiedCode] = useState<number | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        issued_by: '',
        start_date: '',
        end_date: '',
        min_order: '',
        max_uses: '',
        coupon_type_id: '',
        min_rate: '',
        is_active: true,
    });

    function closeCreate() {
        setShowCreate(false);
        reset();
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        post(route('admin.coupons.store'), {
            onSuccess: () => closeCreate(),
        });
    }

    const activeCount = coupons.data.filter((c) => c.is_active).length;
    const expiredCount = coupons.data.filter((c) => c.end_date && new Date(c.end_date) < new Date()).length;
    const totalUses = coupons.data.reduce((sum, c) => sum + c.user_count, 0);

    return (
        <>
            <Head title="Coupon Discount" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Coupons' }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Discount Management
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Coupon Discount
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    Create and manage promotional coupon codes for discounts.
                                </p>
                            </div>
                            <button onClick={() => setShowCreate(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-xl shadow-lg shadow-black/10 hover:bg-brand-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Coupon
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        {/* Stats bar */}
                        <div className="grid gap-4 sm:grid-cols-4">
                            {[
                                { label: 'Total Coupons', value: coupons.data.length, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
                                { label: 'Active', value: activeCount, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M5 13l4 4L19 7' },
                                { label: 'Expired', value: expiredCount, gradient: 'from-red-500/20 to-red-600/10', iconGradient: 'from-red-500 to-red-600', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
                                { label: 'Total Uses', value: totalUses, gradient: 'from-blue-500/20 to-blue-600/10', iconGradient: 'from-blue-500 to-blue-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                            ].map((stat, i) => (
                                <div key={stat.label} className={`animate-fade-in-up stagger-${i + 1}`}>
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30 opacity-100`} />
                                        <div className="relative p-4 sm:p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg shadow-black/10 text-white relative z-10`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                                        </svg>
                                                    </div>
                                                    <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${stat.iconGradient} opacity-20 blur-md`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{stat.label}</p>
                                                    <p className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">{stat.value}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Coupons grid */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">Coupons</span>
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                            </div>

                            {coupons.data.length === 0 ? (
                                <div className="card p-12 sm:p-16 animate-fade-in-up">
                                    <div className="text-center max-w-sm mx-auto">
                                        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-5">
                                            <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">No coupons found</h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Create your first coupon discount code to get started.</p>
                                        <button onClick={() => setShowCreate(true)}
                                            className="btn-primary !text-sm !px-5 !py-2.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Create Coupon
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {coupons.data.map((coupon, i) => {
                                        const expired = coupon.end_date ? new Date(coupon.end_date) < new Date() : false;
                                        const exhausted = coupon.max_uses !== null && coupon.user_count >= coupon.max_uses;
                                        const active = coupon.is_active && !expired && !exhausted;
                                        const usagePercent = coupon.max_uses !== null && coupon.max_uses > 0
                                            ? Math.min(Math.round((coupon.user_count / coupon.max_uses) * 100), 100)
                                            : 0;

                                        const nowMs = Date.now();
                                        const start = palauMs(coupon.start_date);
                                        const end = palauMs(coupon.end_date);
                                        const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) || 1;
                                        const elapsedDays = Math.floor((nowMs - start) / (1000 * 60 * 60 * 24));
                                        const remainingDays = Math.max(0, totalDays - elapsedDays);
                                        const timelinePct = Math.min(Math.max(Math.round((elapsedDays / totalDays) * 100), 0), 100);

                                        return (
                                            <div key={coupon.id} className={`card-hover animate-fade-in-up stagger-${(i % 6) + 1}`}>
                                                <div className="relative p-5 sm:p-6 flex flex-col h-full">

                                                    {/* Header: Code row + badges row */}
                                                    <div className="mb-3 space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                                                <span className="font-bold text-surface-900 dark:text-white font-mono tracking-wider">{coupon.code}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button onClick={() => { navigator.clipboard.writeText(coupon.code); setCopiedCode(coupon.id); setTimeout(() => setCopiedCode(null), 1500); }}
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-surface-400 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all duration-200"
                                                                    title="Copy code">
                                                                    {copiedCode === coupon.id ? (
                                                                        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                                    ) : (
                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                                                                    )}
                                                                </button>
                                                                <Link href={route('admin.coupons.edit', coupon.id)}
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-surface-400 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all duration-200"
                                                                    title="Edit coupon">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                    </svg>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                                                active
                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                                                    : 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400'
                                                            }`}>
                                                                {active ? 'Active' : 'Inactive'}
                                                            </span>
                                                            <span className={typeBadge(coupon.coupon_type.name)}>
                                                                {coupon.coupon_type.name}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Timeline + Countdown */}
                                                    {coupon.start_date && coupon.end_date ? (
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <div className="flex-1">
                                                                <div className="relative flex items-center">
                                                                    <div className="flex-1 h-[3px] bg-surface-100 dark:bg-surface-700/60 rounded-full relative">
                                                                        <div
                                                                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                                                                expired
                                                                                    ? 'bg-red-400'
                                                                                    : active
                                                                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                                                    : 'bg-surface-300 dark:bg-surface-600'
                                                                            }`}
                                                                            style={{ width: `${expired ? 100 : timelinePct}%` }}
                                                                        />
                                                                    </div>
                                                                    <div className={`absolute -top-0.5 w-3 h-3 rounded-full border-2 ${
                                                                        expired
                                                                            ? 'border-red-400 bg-red-50 dark:bg-red-900/30'
                                                                            : active
                                                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                                                                            : 'border-surface-300 dark:border-surface-600 bg-white dark:bg-brand-800'
                                                                    }`}
                                                                        style={{
                                                                            left: `${expired ? 100 : nowMs < start ? 0 : timelinePct}%`,
                                                                            transform: 'translateX(-50%)'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-[10px] text-surface-400">{formatDate(coupon.start_date)}</span>
                                                                    <span className="text-[10px] text-surface-400">{formatDate(coupon.end_date)}</span>
                                                                </div>
                                                            </div>
                                                            <div className={`shrink-0 rounded-lg px-2.5 py-1.5 text-center min-w-[64px] ${
                                                                expired
                                                                    ? 'bg-surface-100 dark:bg-surface-800/50'
                                                                    : remainingDays <= 7
                                                                    ? 'bg-red-50 dark:bg-red-900/20'
                                                                    : remainingDays <= 30
                                                                    ? 'bg-accent-50 dark:bg-accent-900/20'
                                                                    : 'bg-emerald-50 dark:bg-emerald-900/20'
                                                            }`}>
                                                                <span className={`text-xs font-bold tabular-nums leading-none ${
                                                                    expired
                                                                        ? 'text-surface-400'
                                                                        : remainingDays <= 7
                                                                        ? 'text-red-500'
                                                                        : remainingDays <= 30
                                                                        ? 'text-accent-600'
                                                                        : 'text-emerald-600'
                                                                }`}>
                                                                    <CountdownTimer endDate={coupon.end_date} expired={expired} />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 mb-3 text-surface-400 dark:text-surface-500">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-xs">No expiry</span>
                                                        </div>
                                                    )}

                                                    {/* Details bar */}
                                                    <div className="flex items-center gap-3 text-xs text-surface-500 mb-3 flex-wrap">
                                                        {coupon.issued_by && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
                                                                {coupon.issued_by}
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>
                                                            Min: {coupon.min_order !== null ? `$${Number(coupon.min_order).toFixed(2)}` : '\u2014'}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                                                            {coupon.min_rate !== null
                                                                ? `${coupon.min_rate}${coupon.coupon_type?.name === 'Percentage' ? '%' : coupon.coupon_type?.name === 'Day Free' ? 'd' : ''}`
                                                                : '\u2014'}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v18m9-18v18m3-16.5v15m-9-4.5h2.25m-4.5 0h1.5" /></svg>
                                                            Max: {coupon.max_uses !== null ? coupon.max_uses : '\u221E'}
                                                        </span>
                                                    </div>

                                                    {/* Usage bar */}
                                                    <div className="mt-auto pt-3 border-t border-surface-100 dark:border-surface-700/30">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Usage</span>
                                                            <span className="text-[10px] font-medium text-surface-500">
                                                                {coupon.user_count}
                                                                {coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ''}
                                                            </span>
                                                        </div>
                                                        {coupon.max_uses !== null ? (
                                                            <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700/60 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                        usagePercent >= 90
                                                                            ? 'bg-gradient-to-r from-red-500 to-red-400'
                                                                            : usagePercent >= 60
                                                                            ? 'bg-gradient-to-r from-accent-400 to-accent-500'
                                                                            : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                                    }`}
                                                                    style={{ width: `${usagePercent}%` }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700/60 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500" style={{ width: '100%' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {coupons.links && coupons.links.length > 3 && (
                                <div className="flex items-center justify-center gap-1.5 pt-2">
                                    {coupons.links.map((link) => {
                                        const label = link.label
                                            .replace('&laquo;', '\u2039')
                                            .replace('&raquo;', '\u203A')
                                            .replace('&lsaquo;', '\u2039')
                                            .replace('&rsaquo;', '\u203A');
                                        return (
                                            <Link key={link.label}
                                                href={link.url || '#'}
                                                preserveState
                                                preserveScroll
                                                className={`inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                    link.active
                                                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/20 ring-1 ring-brand-500/30'
                                                        : 'text-surface-600 dark:text-surface-300 bg-white dark:bg-brand-800/60 hover:bg-surface-100 dark:hover:bg-surface-700/60 hover:text-surface-900 dark:hover:text-white hover:shadow-sm ring-1 ring-surface-200 dark:ring-surface-600/30'
                                                } ${!link.url ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: label }} />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            <SlidePanel
                show={showCreate}
                onClose={closeCreate}
                title="Create Coupon"
            >
                <form onSubmit={submitCreate}>
                    <CouponForm
                        couponTypes={couponTypes}
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        onCancel={closeCreate}
                    />
                </form>
            </SlidePanel>
        </>
    );
}
