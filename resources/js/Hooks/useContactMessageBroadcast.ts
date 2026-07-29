import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

export function useContactMessageBroadcast() {
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.private('admin.bookings');

                channel.listen('.contact.message.sent', (e: any) => {
                    const name = `${e.first_name ?? 'Someone'} ${e.last_name ?? ''}`.trim();

                    toast.info(`New message from ${name}`, {
                        description: e.subject ?? 'No subject',
                        duration: 6000,
                        action: {
                            label: 'View',
                            onClick: () => router.visit(route('admin.contact-messages.index')),
                        },
                    });

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
