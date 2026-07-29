import { useEffect, useRef } from 'react';

interface ChatMessageEvent {
    id: number;
    conversation_id: number;
    sender_id: number | null;
    sender_type: string;
    sender_name: string;
    body: string;
    created_at: string;
    is_internal?: boolean;
    mentioned_admin_ids?: number[];
    guest_name?: string | null;
    guest_email?: string | null;
}

export function useChatBroadcast(
    conversationId: number | null,
    onMessage: (message: ChatMessageEvent) => void,
) {
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!conversationId || !window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;
        if (!pusher?.connection) return;

        const trySubscribe = () => {
            try {
                const channel = window.Echo!.private(`conversation.${conversationId}`);
                channel.listen('.message.sent', (e: ChatMessageEvent) => {
                    onMessage(e);
                });

                cleanupRef.current = () => {
                    try {
                        channel.stopListening('.message.sent');
                        window.Echo!.leave(`conversation.${conversationId}`);
                    } catch { /* ignore */ }
                };
            } catch { /* ignore */ }
        };

        if (pusher.connection.state === 'connected') {
            trySubscribe();
        } else {
            const onConnected = () => trySubscribe();
            pusher.connection.bind('connected', onConnected);
            cleanupRef.current = () => {
                pusher.connection.unbind('connected', onConnected);
            };
        }

        return () => {
            if (cleanupRef.current) cleanupRef.current();
            cleanupRef.current = null;
        };
    }, [conversationId, onMessage]);
}
