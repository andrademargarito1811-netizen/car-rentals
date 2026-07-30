import { useState, useEffect, useRef, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { useChatBroadcast } from '@/Hooks/useChatBroadcast';
import { useChat } from '@/Contexts/ChatContext';
import { Bot, Sparkles } from 'lucide-react';

interface FaqData {
    id: number;
    question: string;
    answer: string;
    category: string;
}

interface MessageData {
    id: number;
    conversation_id: number;
    sender_id: number | null;
    sender_type: string;
    sender_name?: string;
    sender?: { id: number; name: string };
    body: string;
    read_at?: string | null;
    created_at: string;
}

function getGuestToken(): string {
    let token = localStorage.getItem('guest_chat_token');
    if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem('guest_chat_token', token);
    }
    return token;
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getLastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

function csrfToken(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

export default function ChatWidget() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    const { open, openChat, closeChat } = useChat();
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [adminTyping, setAdminTyping] = useState(false);
    const [typingSenderName, setTypingSenderName] = useState('');
    const [faqs, setFaqs] = useState<FaqData[]>([]);
    const [faqLoading, setFaqLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [guestName, setGuestName] = useState(() => localStorage.getItem('guest_name') || '');
    const [guestEmail, setGuestEmail] = useState(() => localStorage.getItem('guest_email') || '');
    const [identitySubmitting, setIdentitySubmitting] = useState(false);
    const [identityError, setIdentityError] = useState('');
    const guestToken = !user ? getGuestToken() : null;
    const identityReady = !!user || !!guestName;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const seenIds = useRef(new Set<number>());
    const openRef = useRef(open);
    openRef.current = open;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (open) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, open]);

    useEffect(() => {
        if (!open || !identityReady) return;
        setFaqLoading(true);
        fetch('/chat/faqs', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((res) => setFaqs(res.data ?? []))
            .catch(() => {})
            .finally(() => setFaqLoading(false));
    }, [open, identityReady]);

    const markAsRead = useCallback(async (convId: number) => {
        try {
            await fetch('/chat/messages/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    conversation_id: convId,
                    guest_token: guestToken,
                }),
            });
        } catch {
        }
    }, [guestToken]);

    useEffect(() => {
        if (!open || !identityReady) return;
        setLoading(true);

        const params = new URLSearchParams();
        if (guestToken) params.set('guest_token', guestToken);

        fetch(`/chat/conversations?${params}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((res) => {
                const convs = res.data ?? [];
                if (convs.length > 0) {
                    const conv = convs[0];
                    setConversationId(conv.id);
                    markAsRead(conv.id);
                    return fetch(`/chat/conversations/${conv.id}/messages?${params}`, {
                        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    }).then((r) => r.json());
                }
                return null;
            })
            .then((res) => {
                if (res) {
                    const msgs = res.data ?? [];
                    seenIds.current = new Set(msgs.map((m: MessageData) => m.id));
                    setMessages(msgs);
                }
            })
            .finally(() => setLoading(false));
    }, [open, identityReady]);

    const addMessage = useCallback((msg: MessageData) => {
        if (!msg || seenIds.current.has(msg.id)) return;
        seenIds.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
    }, []);

    const handleNewMessage = useCallback((msg: MessageData) => {
        addMessage(msg);
        if (conversationId) markAsRead(conversationId);
    }, [addMessage, conversationId, markAsRead]);

    useChatBroadcast(user ? conversationId : null, handleNewMessage);

    const handleGuestMessage = useCallback((msg: MessageData) => {
        addMessage(msg);
        if (openRef.current) {
            if (conversationId) markAsRead(conversationId);
        } else {
            setUnreadCount((prev) => prev + 1);
        }
    }, [addMessage, conversationId, markAsRead]);

    // Persistent guest channel subscription — always active for real-time badge
    useEffect(() => {
        if (!guestToken || !window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const subscribe = () => {
            try {
                const channel = window.Echo!.channel(`guest-chat.${guestToken}`);
                channel.listen('.message.sent', (e: MessageData) => {
                    handleGuestMessage(e);
                });
                channel.listen('.user.typing', (e: { typing: boolean; sender_name?: string }) => {
                    if (openRef.current) {
                        setAdminTyping(e.typing);
                        if (e.sender_name) setTypingSenderName(e.sender_name);
                    }
                });
                channel.listen('.messages.read', () => {
                    if (openRef.current) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.sender_type === 'guest' || m.sender_type === 'user'
                                    ? { ...m, read_at: m.read_at ?? new Date().toISOString() }
                                    : m,
                            ),
                        );
                    }
                });

                return () => {
                    channel.stopListening('.message.sent');
                    channel.stopListening('.user.typing');
                    channel.stopListening('.messages.read');
                    window.Echo!.leave(`guest-chat.${guestToken}`);
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
    }, [guestToken, handleGuestMessage]);

    // Fetch initial unread count on mount (before chat is opened)
    useEffect(() => {
        if (!guestToken) return;
        const params = new URLSearchParams();
        params.set('guest_token', guestToken);
        fetch(`/chat/conversations?${params}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((res) => {
                const convs = res.data ?? [];
                if (convs.length > 0) {
                    const conv = convs[0];
                    setConversationId(conv.id);
                    return fetch(`/chat/conversations/${conv.id}/messages?${params}`, {
                        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    }).then((r) => r.json());
                }
                return null;
            })
            .then((res) => {
                if (res) {
                    const msgs = res.data ?? [];
                    const unread = msgs.filter(
                        (m: MessageData) => m.sender_type !== 'guest' && m.sender_type !== 'user' && !m.read_at,
                    ).length;
                    if (unread > 0) setUnreadCount(unread);
                }
            })
            .catch(() => {});
    }, []);

    // Reset unread badge and mark as read when chat opens
    useEffect(() => {
        if (!open || !conversationId) return;
        setUnreadCount(0);
        markAsRead(conversationId);
    }, [open, conversationId, markAsRead]);

    useEffect(() => {
        if (adminTyping) {
            setTimeout(scrollToBottom, 50);
        }
    }, [adminTyping]);

    const handleFaqClick = async (faq: FaqData) => {
        if (sending) return;
        setSending(true);

        try {
            const res = await fetch('/chat/faq-answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    faq_id: faq.id,
                    conversation_id: conversationId,
                    guest_token: guestToken,
                }),
            });

            if (!res.ok) throw new Error('Failed');

            const data = await res.json();
            if (data.guest_message) addMessage(data.guest_message);
            if (data.system_message) addMessage(data.system_message);
            setConversationId(data.conversation_id);
        } catch {
        } finally {
            setSending(false);
        }
    };

    const sendMessage = async () => {
        const text = body.trim();
        if (!text || sending) return;
        setSending(true);

        let responseData: Record<string, unknown> | null = null;

        try {
            const payload: Record<string, unknown> = { body: text };
            if (conversationId) payload.conversation_id = conversationId;
            if (guestToken) payload.guest_token = guestToken;

            const res = await fetch('/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error('Failed to send');
            }

            responseData = await res.json() as Record<string, unknown>;
            const msg = responseData.message as MessageData | undefined;
            if (msg) {
                addMessage(msg);
            }
            const autoReply = responseData.auto_reply as MessageData | undefined;
            if (autoReply) {
                addMessage(autoReply);
            }
            const newConvId = (responseData.conversation_id as number) ?? conversationId;
            setConversationId(newConvId);
            setBody('');
        } catch {
        } finally {
            setSending(false);
        }

        const fetchConvId = conversationId ?? (responseData?.conversation_id as number | undefined);
        if (fetchConvId) {
            const params = new URLSearchParams();
            if (guestToken) params.set('guest_token', guestToken);
            try {
                const res = await fetch(`/chat/conversations/${fetchConvId}/messages?${params}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                const d2 = (await res.json()) as { data?: MessageData[] };
                const fetched = d2.data ?? [];
                for (const m of fetched) {
                    addMessage(m);
                }
            } catch {
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const submitIdentity = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = (document.getElementById('chat-guest-name') as HTMLInputElement)?.value.trim();
        const email = (document.getElementById('chat-guest-email') as HTMLInputElement)?.value.trim();

        if (!name || !email) {
            setIdentityError('Please fill in both fields');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setIdentityError('Please enter a valid email address');
            return;
        }

        setIdentitySubmitting(true);
        setIdentityError('');

        try {
            const res = await fetch('/chat/guest-identity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    name,
                    email,
                    guest_token: guestToken,
                }),
            });

            if (!res.ok) throw new Error('Failed');

            const identityData = await res.json();

            setGuestName(name);
            setGuestEmail(email);
            localStorage.setItem('guest_name', name);
            localStorage.setItem('guest_email', email);

            const greetingBody = `Hi, I am ${name}`;
            const greetingPayload: Record<string, unknown> = {
                body: greetingBody,
                guest_token: guestToken,
            };
            if (identityData.conversation_id) {
                greetingPayload.conversation_id = identityData.conversation_id;
            }

            try {
                const greetRes = await fetch('/chat/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify(greetingPayload),
                });

                if (greetRes.ok) {
                    const greetData = await greetRes.json() as Record<string, unknown>;
                    const greetMsg = greetData.message as MessageData | undefined;
                    if (greetMsg) {
                        addMessage(greetMsg);
                    }
                    const newConvId = (greetData.conversation_id as number) ?? identityData.conversation_id;
                    if (newConvId) setConversationId(newConvId);
                }
            } catch {
            }
        } catch {
            setIdentityError('Something went wrong. Please try again.');
        } finally {
            setIdentitySubmitting(false);
        }
    };

    if (isAdmin) return null;

    const showFaqs = messages.length === 0 && !loading;

    return (
        <>
            {!open && (
                <button
                    onClick={openChat}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group"
                    title="Chat with us"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-md ring-2 ring-white dark:ring-brand-800 animate-scale-in">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            )}

            {open && (
                <div className="fixed bottom-0 right-0 z-50 w-full sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[560px] sm:rounded-2xl bg-white dark:bg-brand-800 shadow-2xl shadow-black/20 border border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Live Chat</p>
                                <p className="text-[10px] text-white/70">We typically reply in minutes</p>
                            </div>
                        </div>
                        <button onClick={closeChat} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {!identityReady ? (
                        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-surface-50/50 dark:bg-brand-900/30">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-600/30 dark:to-brand-700/30 flex items-center justify-center mb-5">
                                <svg className="w-7 h-7 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-surface-900 dark:text-white mb-1">Welcome!</h3>
                            <p className="text-xs text-surface-500 dark:text-surface-400 text-center mb-6 max-w-xs">
                                Please tell us a bit about yourself so we can help you better.
                            </p>
                            <form onSubmit={submitIdentity} className="w-full space-y-3">
                                <div>
                                    <label htmlFor="chat-guest-name" className="block text-[11px] font-semibold text-surface-600 dark:text-surface-400 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        id="chat-guest-name"
                                        type="text"
                                        defaultValue={guestName}
                                        placeholder="e.g. John Doe"
                                        className="w-full h-10 px-3.5 text-sm bg-white dark:bg-brand-900/50 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all dark:text-white placeholder:text-surface-400"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="chat-guest-email" className="block text-[11px] font-semibold text-surface-600 dark:text-surface-400 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        id="chat-guest-email"
                                        type="email"
                                        defaultValue={guestEmail}
                                        placeholder="e.g. john@example.com"
                                        className="w-full h-10 px-3.5 text-sm bg-white dark:bg-brand-900/50 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all dark:text-white placeholder:text-surface-400"
                                    />
                                </div>
                                {identityError && (
                                    <p className="text-[11px] text-red-500 font-medium">{identityError}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={identitySubmitting}
                                    className="w-full h-10 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                                >
                                    {identitySubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Start Chat
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface-50/50 dark:bg-brand-900/30">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : messages.length === 0 && !adminTyping ? (
                                    <div className="flex flex-col items-center justify-center text-center px-2 py-4">
                                        <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mb-4">
                                            <svg className="w-7 h-7 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-semibold text-surface-900 dark:text-white mb-1">Need help?</p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 mb-5 max-w-xs">
                                            Send us a message or pick a common question below.
                                        </p>
                                        {faqLoading ? (
                                            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                                        ) : faqs.length > 0 ? (
                                            <div className="w-full space-y-2">
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
                                                    <Sparkles className="w-3 h-3" />
                                                    Quick answers
                                                </div>
                                                {faqs.map((faq) => (
                                                    <button
                                                        key={faq.id}
                                                        onClick={() => handleFaqClick(faq)}
                                                        disabled={sending}
                                                        className="w-full text-left text-xs px-4 py-2.5 rounded-xl bg-white dark:bg-brand-700 text-surface-700 dark:text-surface-300 hover:bg-brand-50 dark:hover:bg-brand-600 hover:text-brand-700 dark:hover:text-brand-200 border border-surface-100 dark:border-surface-600 transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.98] leading-relaxed disabled:opacity-50"
                                                    >
                                                        {faq.question}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-surface-400 dark:text-surface-500">Loading questions...</p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {showFaqs && faqs.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pb-2">
                                                {faqs.slice(0, 3).map((faq) => (
                                                    <button
                                                        key={faq.id}
                                                        onClick={() => handleFaqClick(faq)}
                                                        disabled={sending}
                                                        className="text-[10px] px-2.5 py-1.5 rounded-full bg-white dark:bg-brand-700 text-surface-600 dark:text-surface-300 hover:bg-brand-50 dark:hover:bg-brand-600 hover:text-brand-700 dark:hover:text-brand-200 border border-surface-100 dark:border-surface-600 transition-all disabled:opacity-50 truncate max-w-[180px]"
                                                    >
                                                        {faq.question}
                                                    </button>
                                                ))}
                                                {faqs.length > 3 && (
                                                    <span className="text-[10px] text-surface-400 dark:text-surface-500 self-center">
                                                        +{faqs.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {messages.map((msg) => {
                                            const isMine = msg.sender_type === 'user' || msg.sender_type === 'guest';
                                            const isSystem = msg.sender_type === 'system';
                                            return (
                                                <div key={msg.id} className={`flex ${isMine || isSystem ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] ${isSystem ? 'max-w-[90%]' : ''}`}>
                                                        {isSystem && (
                                                            <div className="flex items-center gap-1 mb-1 px-1">
                                                                <Bot className="w-3 h-3 text-surface-400" />
                                                                <span className="text-[9px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                                                                    Auto-reply
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!isSystem && !isMine && (
                                                            <div className="flex items-center gap-1 mb-1 px-1">
                                                                <span className="text-[9px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                                                                    {msg.sender?.name
                                                                        ? `Support ${getLastName(msg.sender.name)}`
                                                                        : msg.sender_name
                                                                            ? `Support ${getLastName(msg.sender_name)}`
                                                                            : 'Support'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`px-4 py-2.5 rounded-2xl ${
                                                            isMine
                                                                ? 'bg-brand-600 text-white rounded-br-md'
                                                                : isSystem
                                                                    ? 'bg-accent-50 dark:bg-brand-700/80 text-surface-800 dark:text-surface-200 rounded-bl-md border border-accent-200/50 dark:border-accent-700/20 shadow-sm'
                                                                    : 'bg-white dark:bg-brand-700 text-surface-900 dark:text-white shadow-sm rounded-bl-md border border-surface-100 dark:border-surface-600'
                                                        }`}>
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                                            <p className={`flex items-center gap-1 text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-surface-400 dark:text-surface-500'}`}>
                                                                {isMine && (
                                                                    <span className="font-medium">{guestName}</span>
                                                                )}
                                                                {!isMine && !isSystem && (
                                                                    <span className="font-medium">
                                                                        {msg.sender?.name
                                                                            ? `Support ${getLastName(msg.sender.name)}`
                                                                            : msg.sender_name
                                                                                ? `Support ${getLastName(msg.sender_name)}`
                                                                                : 'Support'}
                                                                    </span>
                                                                )}
                                                                <span>{formatTime(msg.created_at)}</span>
                                                                {isSystem && (
                                                                    <span className="inline-flex items-center gap-0.5 text-accent-600 dark:text-accent-400">
                                                                        <Bot className="w-2.5 h-2.5" />
                                                                    </span>
                                                                )}
                                                                {isMine && msg.read_at && (
                                                                    <span className="inline-flex items-center">
                                                                        <svg className="w-3 h-3 -mr-0.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4 8-8" />
                                                                        </svg>
                                                                        <svg className="w-3 h-3 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4 8-8" />
                                                                        </svg>
                                                                    </span>
                                                                )}
                                                                {isMine && !msg.read_at && (
                                                                    <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4 8-8" />
                                                                    </svg>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {adminTyping && (
                                            <div className="flex justify-start">
                                                <div className="bg-white dark:bg-brand-700 text-surface-900 dark:text-white shadow-sm rounded-bl-md border border-surface-100 dark:border-surface-600 px-4 py-3 rounded-2xl">
                                                    <p className="text-[11px] text-surface-500 dark:text-surface-400 mb-1.5 font-medium">
                                                        {typingSenderName || 'Support'} is typing
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="shrink-0 border-t border-surface-100 dark:border-surface-700 p-4 bg-white dark:bg-brand-800">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type your message..."
                                        rows={1}
                                        className="flex-1 min-h-[44px] max-h-[120px] px-4 py-2.5 text-sm bg-surface-50 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none resize-none transition-all dark:text-white placeholder:text-surface-400"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!body.trim() || sending}
                                        className="shrink-0 w-[44px] h-[44px] rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 active:scale-95"
                                    >
                                        {sending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
