export type NotificationCategory = 'booking' | 'payment' | 'review' | 'message' | 'other';

const TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
    'booking.created': 'booking',
    'booking.status_changed': 'booking',
    'booking.extended': 'booking',
    'payment.received': 'payment',
    'review.submitted': 'review',
    'contact.message': 'message',
};

export function categoryOf(type: string): NotificationCategory {
    return TYPE_TO_CATEGORY[type] ?? 'other';
}

export const CATEGORY_META: Record<NotificationCategory, { label: string; chip: string; icon: string }> = {
    booking: {
        label: 'Booking',
        chip: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-700/50',
        icon: 'car',
    },
    payment: {
        label: 'Payment',
        chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50',
        icon: 'banknote',
    },
    review: {
        label: 'Review',
        chip: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/50',
        icon: 'star',
    },
    message: {
        label: 'Message',
        chip: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700/50',
        icon: 'mail',
    },
    other: {
        label: 'Update',
        chip: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:ring-violet-700/50',
        icon: 'bell',
    },
};

export const TYPE_FILTERS: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'booking.created', label: 'Bookings' },
    { key: 'booking.status_changed', label: 'Status Changes' },
    { key: 'booking.extended', label: 'Extensions' },
    { key: 'payment.received', label: 'Payments' },
    { key: 'review.submitted', label: 'Reviews' },
    { key: 'contact.message', label: 'Messages' },
];
