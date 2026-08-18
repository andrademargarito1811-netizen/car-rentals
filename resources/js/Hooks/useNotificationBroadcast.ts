import { useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

interface NotificationPayload {
    type: string;
    title: string;
    message: string;
    icon?: string;
    action_url?: string;
    reference_code?: string | null;
    review_id?: number | null;
    contact_message_id?: number | null;
    creator_id?: number | null;
}

const DEDUPE_WINDOW_MS = 8000;

export function useNotificationBroadcast() {
    const cleanupRef = useRef<(() => void) | null>(null);
    const recentToasts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const { auth } = usePage().props as { auth?: { user?: { id?: number } | null } };
    const currentUserId = auth?.user?.id;

    // A booking notification is broadcast once per recipient admin on the shared
    // channel, so each subscriber can receive the same event multiple times.
    // Suppress duplicate toasts for the same event within a short window.
    const isDuplicate = (data: NotificationPayload): boolean => {
        const id = data.reference_code ?? data.review_id ?? data.contact_message_id ?? `${data.title}:${data.message}`;
        const key = `${data.type}:${id}`;
        if (recentToasts.current.has(key)) return true;
        const timer = setTimeout(() => recentToasts.current.delete(key), DEDUPE_WINDOW_MS);
        recentToasts.current.set(key, timer);
        return false;
    };

    useEffect(() => {
        if (!window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.private('admin.bookings');

                channel.listen('.notification.received', (e: any) => {
                    const data: NotificationPayload | undefined = e as NotificationPayload;
                    if (!data?.title) return;

                    // Changes made by the current admin are already confirmed by the
                    // in-app success message, so don't also toast them about it.
                    if (
                        (data.type === 'booking.created' || data.type === 'booking.status_changed') &&
                        data.creator_id != null &&
                        data.creator_id === currentUserId
                    ) {
                        router.reload({ only: ['unreadNotificationCount', 'latestNotifications'] });
                        return;
                    }

                    // Ignore the duplicate broadcast for the same booking event.
                    if (isDuplicate(data)) {
                        router.reload({ only: ['unreadNotificationCount', 'latestNotifications'] });
                        return;
                    }

                    const title = data.title;
                    const message = data.message ?? '';

                    if (data.type === 'booking.created' || data.type === 'booking.status_changed') {
                        toast.success(title, {
                            description: message,
                            duration: 6000,
                            action: data.action_url ? {
                                label: 'View',
                                onClick: () => router.visit(data.action_url!),
                            } : undefined,
                        });
                    } else {
                        toast.info(title, {
                            description: message,
                            duration: 6000,
                            action: data.action_url ? {
                                label: 'View',
                                onClick: () => router.visit(data.action_url!),
                            } : undefined,
                        });
                    }

                    router.reload({ only: ['unreadNotificationCount', 'latestNotifications'] });
                });

                cleanupRef.current = () => {
                    channel.stopListening('.notification.received');
                    window.Echo!.leave('admin.bookings');
                };
            } catch {
                // Broadcast unavailable
            }
        };

        if (pusher?.connection?.state === 'connected') {
            subscribe();
        } else if (pusher?.connection) {
            const onConnected = () => subscribe();
            pusher.connection.bind('connected', onConnected);
            cleanupRef.current = () => {
                pusher.connection.unbind('connected', onConnected);
            };
        }

        return () => {
            if (cleanupRef.current) cleanupRef.current();
            cleanupRef.current = null;
            for (const t of recentToasts.current.values()) clearTimeout(t);
            recentToasts.current.clear();
        };
    }, [currentUserId]);
}
