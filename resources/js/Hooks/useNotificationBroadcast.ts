import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface NotificationPayload {
    type: string;
    title: string;
    message: string;
    icon?: string;
    action_url?: string;
}

export function useNotificationBroadcast() {
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.private('admin.bookings');

                channel.listen('.notification.received', (e: any) => {
                    const data: NotificationPayload | undefined = e as NotificationPayload;
                    if (!data?.title) return;

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
        };
    }, []);
}
