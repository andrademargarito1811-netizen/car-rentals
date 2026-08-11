import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Badge } from '@/Components/ui/badge';

interface ReviewItem {
    id: number;
    booking_id: number;
    rating: number;
    comment: string | null;
    is_approved: boolean;
    created_at: string;
    car: { id: number; name: string; image_path: string | null } | null;
    user: { id: number; name: string; email: string } | null;
    guest: { first_name: string; last_name: string; email: string } | null;
    customer_name: string;
    customer_email: string | null;
}

interface ReviewsIndexProps {
    reviews: {
        data: ReviewItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search: string | null;
        status: string | null;
        rating: string | null;
        sort_field: string;
        sort_direction: string;
    };
    stats: {
        total: number;
        approved: number;
        pending: number;
        avg_rating: number;
    };
}

const FILTER_TABS = [
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Approved' },
    { key: 'pending', label: 'Pending' },
];

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-3.5 h-3.5 ${star <= rating ? 'text-amber-400' : 'text-surface-200 dark:text-surface-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ))}
            <span className="ml-1.5 text-xs font-bold text-surface-700 dark:text-surface-300">{rating}.0</span>
        </div>
    );
}

export default function ReviewsIndex({ reviews, filters, stats }: ReviewsIndexProps) {
    const route = useRoute();
    const [search, setSearch] = useState(filters?.search || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get(route('admin.reviews.index'), {
                search,
                status: filters?.status || '',
                rating: filters?.rating || '',
                sort_field: filters?.sort_field || 'created_at',
                sort_direction: filters?.sort_direction || 'desc',
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    function applyFilter(key: string, value: string) {
        router.get(route('admin.reviews.index'), {
            search,
            status: key === 'status' ? value : (filters?.status || ''),
            rating: key === 'rating' ? value : (filters?.rating || ''),
            sort_field: filters?.sort_field || 'created_at',
            sort_direction: filters?.sort_direction || 'desc',
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function toggleApproval(review: ReviewItem) {
        router.patch(route('admin.reviews.update', review.id), {
            is_approved: !review.is_approved,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    const hasActiveFilters = filters?.search || filters?.rating || filters?.status;
    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Reviews" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Reviews' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Moderation
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Customer Reviews
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    Approve, hide, or remove customer reviews before they appear publicly.
                                </p>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        <div className="grid gap-4 sm:grid-cols-4">
                            {[
                                { label: 'Total Reviews', value: stats.total, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
                                { label: 'Approved', value: stats.approved, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Pending', value: stats.pending, gradient: 'from-amber-500/20 to-amber-600/10', iconGradient: 'from-amber-500 to-amber-600', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Avg Rating', value: stats.avg_rating ? `${stats.avg_rating} / 5` : '—', gradient: 'from-blue-500/20 to-blue-600/10', iconGradient: 'from-blue-500 to-blue-600', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0l-3-3m3 3l3-3' },
                            ].map((stat) => (
                                <div key={stat.label} className="animate-fade-in-up">
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30 opacity-100`} />
                                        <div className="relative p-4 sm:p-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg shadow-black/10 text-white`}>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                                    </svg>
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

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">Reviews</span>
                                {hasActiveFilters && <span className="text-[11px] text-surface-400 dark:text-surface-500">({reviews.data.length} result{reviews.data.length !== 1 ? 's' : ''})</span>}
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search customer or comment..."
                                        className="w-56 h-9 pl-9 pr-3 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200" />
                                    {search && (
                                        <button onClick={() => setSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={filters?.rating || ''}
                                    onChange={e => applyFilter('rating', e.target.value)}
                                    className="h-9 text-xs bg-white dark:bg-brand-800/80 border border-surface-200 dark:border-surface-700/60 rounded-lg text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 px-3 min-w-[110px]">
                                    <option value="">All Ratings</option>
                                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100/70 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 w-fit">
                                {FILTER_TABS.map((tab) => {
                                    const isActive = (filters?.status || 'all') === tab.key;
                                    return (
                                        <Link key={tab.key}
                                            href={tab.key === 'all' ? route('admin.reviews.index', { search: filters?.search || '', rating: filters?.rating || '' }) : route('admin.reviews.index', { status: tab.key, search: filters?.search || '', rating: filters?.rating || '' })}
                                            preserveState
                                            preserveScroll
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-white dark:bg-brand-800 shadow-sm text-brand-700 dark:text-brand-300 ring-1 ring-surface-200 dark:ring-surface-700'
                                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                                            }`}
                                        >
                                            {tab.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="animate-fade-in-up rounded-xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Vehicle</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Customer</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Rating</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Comment</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Status</th>
                                                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Date</th>
                                                <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-100 dark:border-surface-700/50">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviews.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-20 text-center">
                                                        <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-7 h-7 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-surface-500 dark:text-surface-400 font-medium">No reviews found</p>
                                                        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Try adjusting your search or filter criteria.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                reviews.data.map((review) => (
                                                    <tr key={review.id}
                                                        className="group relative transition-all duration-200 hover:bg-gradient-to-r hover:from-brand-500/[0.04] hover:to-transparent dark:hover:from-brand-400/[0.06] dark:hover:to-transparent border-b border-surface-100/80 dark:border-surface-700/30 last:border-b-0">
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center text-surface-500 dark:text-surface-400 shrink-0">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                    </svg>
                                                                </span>
                                                                <span className="font-semibold text-surface-900 dark:text-white text-sm">{review.car?.name || 'Unknown vehicle'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                                                                    {(review.customer_name || '?').charAt(0).toUpperCase()}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-surface-900 dark:text-white text-sm truncate max-w-[150px]">{review.customer_name || 'Anonymous'}</p>
                                                                    {review.customer_email && <p className="text-xs text-surface-500 dark:text-surface-400 truncate max-w-[180px]">{review.customer_email}</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4"><Stars rating={review.rating} /></td>
                                                        <td className="px-5 py-4 max-w-xs">
                                                            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">{review.comment || '—'}</p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <Badge variant={review.is_approved ? 'default' : 'secondary'} className={review.is_approved ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-700/40' : 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-700/40'}>
                                                                {review.is_approved ? 'Approved' : 'Pending'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs text-surface-500 dark:text-surface-400 font-mono whitespace-nowrap">{formatDate(review.created_at)}</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {review.is_approved ? (
                                                                    <button onClick={() => toggleApproval(review)}
                                                                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 ring-1 ring-amber-200/60 dark:ring-amber-700/40 transition-all duration-200"
                                                                        title="Hide from public">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                                        </svg>
                                                                        Hide
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => toggleApproval(review)}
                                                                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 ring-1 ring-emerald-200/60 dark:ring-emerald-700/40 transition-all duration-200"
                                                                        title="Approve and publish">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        Approve
                                                                    </button>
                                                                )}
                                                                <button onClick={() => { setDeletingReview(review); setShowDeleteModal(true); }}
                                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-surface-400 dark:text-surface-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                                                                    title="Delete review">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {reviews.links && reviews.links.length > 3 && (
                                    <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-700/50 bg-surface-50/30 dark:bg-surface-800/20">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {reviews.links.map((link) => {
                                                const label = link.label
                                                    .replace('&laquo;', '‹')
                                                    .replace('&raquo;', '›')
                                                    .replace('&lsaquo;', '‹')
                                                    .replace('&rsaquo;', '›');
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
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            {showDeleteModal && deletingReview && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-white dark:bg-brand-800 rounded-2xl shadow-2xl shadow-black/20 border border-surface-100 dark:border-surface-700/60 animate-fade-in-up overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="relative p-6 sm:p-7 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">Delete Review</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                                Are you sure you want to delete the review from
                            </p>
                            <p className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-6">
                                &ldquo;{deletingReview.customer_name || 'Anonymous'}&rdquo;?
                            </p>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mb-6">
                                This action cannot be undone. The review will be permanently removed.
                            </p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700/60 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-all duration-200">
                                    Cancel
                                </button>
                                <button onClick={() => {
                                    router.delete(route('admin.reviews.destroy', deletingReview.id), {
                                        onSuccess: () => setShowDeleteModal(false),
                                        preserveScroll: true,
                                    });
                                }}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
