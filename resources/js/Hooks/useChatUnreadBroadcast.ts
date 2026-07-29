import { useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

export function useChatUnreadBroadcast() {
    const cleanupRef = useRef<(() => void) | null>(null);
    const toastIds = useRef<Map<number, string | number>>(new Map());
    const counts = useRef<Map<number, number>>(new Map());
    const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id as number | undefined;

    useEffect(() => {
        if (!window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.private('admin.chats');

                channel.listen('.admin.mentioned', (e: any) => {
                    if (currentUserId && e.mentioned_admin_ids?.includes(currentUserId)) {
                        toast.info(`You were mentioned by ${e.sender_name ?? 'Admin'}`, {
                            description: e.body?.slice(0, 120),
                            duration: 6000,
                            action: {
                                label: 'View',
                                onClick: () => router.visit(route('admin.chats.show', e.conversation_id)),
                            },
                        });
                    }
                });

                channel.listen('.message.sent', (e: any) => {
                    const isFromCustomer = e.sender_type !== 'admin' && e.sender_type !== 'system';
                    if (!isFromCustomer) return;

                    const convId = e.conversation_id;
                    const sender = e.sender_name ?? 'Guest';
                    const existingCount = counts.current.get(convId) ?? 0;
                    const newCount = existingCount + 1;
                    counts.current.set(convId, newCount);

                    // Clear existing timer for this conversation
                    const existingTimer = timers.current.get(convId);
                    if (existingTimer) clearTimeout(existingTimer);

                    // Dismiss existing toast for this conversation
                    const existingToastId = toastIds.current.get(convId);
                    if (existingToastId !== undefined) {
                        toast.dismiss(existingToastId);
                    }

                    // Show grouped or single toast
                    const label = newCount > 1
                        ? `${newCount} new messages from ${sender}`
                        : `New message from ${sender}`;

                    const newToastId = toast.info(label, {
                        description: e.body?.slice(0, 120) ?? 'New chat message',
                        duration: 6000,
                        action: {
                            label: 'View',
                            onClick: () => router.visit(route('admin.chats.show', convId)),
                        },
                    });

                    toastIds.current.set(convId, newToastId);

                    // Auto-clear tracking after toast would have been dismissed
                    const timer = setTimeout(() => {
                        counts.current.delete(convId);
                        toastIds.current.delete(convId);
                        timers.current.delete(convId);
                    }, 7000);
                    timers.current.set(convId, timer);

                    router.reload({ only: ['chatUnreadCount'] });
                });

                cleanupRef.current = () => {
                    channel.stopListening('.admin.mentioned');
                    channel.stopListening('.message.sent');
                    window.Echo!.leave('admin.chats');
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
            for (const t of timers.current.values()) clearTimeout(t);
            toastIds.current.clear();
            counts.current.clear();
            timers.current.clear();
        };
    }, []);
}
