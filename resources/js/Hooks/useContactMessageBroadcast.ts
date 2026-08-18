import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

export function useContactMessageBroadcast() {
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.private('admin.bookings');

                channel.listen('.contact.message.sent', () => {
                    router.reload({ only: ['unreadMessageCount', 'messages'] });
                });

                cleanupRef.current = () => {
                    channel.stopListening('.contact.message.sent');
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
