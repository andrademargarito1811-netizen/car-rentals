import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

export function useBookingBroadcast() {
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.private('admin.bookings');

                channel.listen('.booking.created', (e: any) => {
                    const name = e.customer_name ?? 'A guest';
                    const car = e.car ?? 'a vehicle';
                    const ref = e.reference_code ?? `#${e.id}`;

                    toast.success(`New booking: ${ref}`, {
                        description: `${name} booked ${car}`,
                        duration: 6000,
                        action: {
                            label: 'View',
                            onClick: () => router.visit(`/admin/bookings/${e.id}`),
                        },
                    });

                    router.reload({ only: ['bookings'] });
                });

                channel.listen('.booking.updated', () => {
                    router.reload({ only: ['bookings'] });
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
