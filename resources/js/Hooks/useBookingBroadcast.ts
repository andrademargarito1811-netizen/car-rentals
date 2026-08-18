import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

export function useBookingBroadcast(reloadProps?: string[]) {
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!window.Echo) return;

        const only = reloadProps && reloadProps.length > 0 ? reloadProps : ['bookings'];

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.private('admin.bookings');

                channel.listen('.booking.created', () => {
                    router.reload({ only });
                });

                channel.listen('.booking.updated', () => {
                    router.reload({ only });
                });

                cleanupRef.current = () => {
                    channel.stopListening('.booking.created');
                    channel.stopListening('.booking.updated');
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
