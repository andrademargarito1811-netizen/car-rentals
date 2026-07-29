import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export function useCarBooked(carId: number | string | undefined) {
    const [justBooked, setJustBooked] = useState(false);

    useEffect(() => {
        if (!carId || !window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.channel(`car.${carId}`);
                channel.listen('.booking.created', () => {
                    setJustBooked(true);
                });
                channel.listen('.booking.updated', () => {
                    router.reload({ only: ['booked_dates'] });
                });
                return () => {
                    channel.stopListening('.booking.created');
                    channel.stopListening('.booking.updated');
                    window.Echo!.leave(`car.${carId}`);
                };
            } catch {
                return undefined;
            }
        };

        let cleanup: (() => void) | undefined;

        if (pusher?.connection?.state === 'connected') {
            cleanup = subscribe();
        } else if (pusher?.connection) {
            const onConnected = () => { cleanup = subscribe(); };
            pusher.connection.bind('connected', onConnected);
            cleanup = () => pusher.connection.unbind('connected', onConnected);
        }

        return () => { if (cleanup) cleanup(); };
    }, [carId]);

    return justBooked;
}
