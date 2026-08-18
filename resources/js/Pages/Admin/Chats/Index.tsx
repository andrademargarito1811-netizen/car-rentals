import { useState, useEffect, useRef, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { useChatBroadcast } from '@/Hooks/useChatBroadcast';
import { Search, Send, ArrowLeft, Check, CheckCheck, X, MessageCircle, Plus, ChevronRight, Clock, Bot } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Message {
    id: number;
    conversation_id: number;
    sender_id: number | null;
    sender_type: string;
    sender: User | null;
    body: string;
    is_internal?: boolean;
    read_at?: string | null;
    created_at: string;
}

interface Conversation {
    id: number;
    user: User | null;
    admin?: User | null;
    admin_id?: number | null;
    guest_token: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    status: string;
    unread_count?: number;
    notes_count?: number;
    has_mention?: number;
    messages?: Message[];
    latest_message?: Message | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    created_at: string;
    updated_at: string;
}

interface ChatsIndexProps {
    conversations: {
        data: Conversation[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

const QUICK_REPLIES = [
    'Thank you for contacting West Car Rental. How can I help you today?',
    'I\'ll look into this for you and get back to you shortly.',
    'Let me check our availability and get back to you.',
    'We appreciate your patience. Is there anything else I can help with?',
    'Thank you for your inquiry. Let me connect you with the right department.',
];

const NOTE_TEMPLATES = [
    'Escalated to [team/department] for further review.',
    'Called customer — no answer. Will try again later.',
    'Resolved via phone — customer confirmed.',
    'Waiting on supplier for vehicle availability.',
    'Refund initiated — pending approval.',
    'Follow-up needed in [X] days.',
];

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateGroup(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDate.getTime() === today.getTime()) return 'Today';
    if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function csrfToken(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

function agentColor(name: string): string {
    const AGENT_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#14b8a6', '#06b6d4', '#3b82f6', '#22c55e'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash = hash & hash;
    }
    return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length];
}

function renderMessageBody(text: string): React.ReactNode {
    const parts = text.split(/(@[\w\s-]+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return <span key={i} className="text-brand-600 dark:text-brand-400 font-semibold">{part}</span>;
        }
        return part;
    });
}

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function guestBgColor(token: string): string {
    const hue = hashString(token) % 360;
    return `hsl(${hue}, 55%, 60%)`;
}

const GUEST_AVATARS = ['cat', 'dog', 'bear', 'bunny', 'fox', 'panda'];

function statusRingColor(status: string): string {
    switch (status) {
        case 'active': return 'ring-emerald-400';
        case 'away': return 'ring-amber-400';
        default: return 'ring-surface-300 dark:ring-surface-600';
    }
}

function statusBgDot(status: string): string {
    switch (status) {
        case 'active': return 'bg-emerald-400';
        case 'away': return 'bg-amber-400';
        default: return 'bg-surface-400';
    }
}

function statusLabel(status: string): string {
    switch (status) {
        case 'active': return 'Active';
        case 'away': return 'Away';
        default: return 'Offline';
    }
}

function applyMessageToConversationList(
    list: Conversation[],
    msg: Message,
    extra?: { guest_name?: string | null; guest_email?: string | null },
): Conversation[] {
    const exists = list.some((c) => c.id === msg.conversation_id);

    if (!exists) {
        const newConv: Conversation = {
            id: msg.conversation_id,
            user: null,
            guest_token: `guest-${msg.conversation_id}`,
            guest_name: extra?.guest_name ?? null,
            guest_email: extra?.guest_email ?? null,
            status: 'active',
            created_at: msg.created_at,
            updated_at: msg.created_at,
            unread_count: 0,
            notes_count: msg.is_internal ? 1 : 0,
        };
        if (!msg.is_internal) {
            newConv.latest_message = msg;
        }
        return [newConv, ...list];
    }

    return list
        .map((c) => {
            if (c.id !== msg.conversation_id) return c;
            const updated: Conversation = { ...c, updated_at: msg.created_at };
            if (extra?.guest_name || extra?.guest_email) {
                updated.guest_name = extra.guest_name ?? c.guest_name;
                updated.guest_email = extra.guest_email ?? c.guest_email;
            }
            if (msg.is_internal) {
                updated.notes_count = (c.notes_count ?? 0) + 1;
            } else {
                updated.latest_message = msg;
            }
            return updated;
        })
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export default function ChatsIndex({ conversations }: ChatsIndexProps) {
    const route = useRoute();
    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [guestTyping, setGuestTyping] = useState(false);
    const [typingSenderName, setTypingSenderName] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [unreadDeltas, setUnreadDeltas] = useState<Record<number, number>>({});
    const [pulsingIds, setPulsingIds] = useState<Set<number>>(new Set());
    const [conversationsList, setConversationsList] = useState(conversations.data);
    const [showMobileList, setShowMobileList] = useState(true);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [noteMode, setNoteMode] = useState(false);
    const noteModeRef = useRef(false);
    const [showNotes, setShowNotes] = useState(true);
    const [admins, setAdmins] = useState<{ id: number; name: string; is_online?: boolean }[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const seenIds = useRef(new Set<number>());
    const seenSidebarIds = useRef(new Set<number>());
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectedIdRef = useRef(selectedId);
    const pulseTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const quickReplyRef = useRef<HTMLDivElement>(null);

    const filteredConvs = search
        ? (searchResults ?? conversationsList)
        : conversationsList;

    const selectedConv = conversationsList.find((c) => c.id === selectedId) ?? null;

    const displayName = selectedConv?.user?.name ?? selectedConv?.guest_name ?? 'Guest';
    const displayEmail = selectedConv?.user?.email ?? selectedConv?.guest_email ?? 'Guest visitor';
    const customerAvatarBg = selectedConv?.user
        ? 'bg-gradient-to-br from-brand-500 to-brand-600'
        : guestBgColor(selectedConv?.guest_token ?? '');
    const customerAvatarSrc = !selectedConv?.user && selectedConv?.guest_token
        ? `/images/avatars/${GUEST_AVATARS[hashString(selectedConv.guest_token) % GUEST_AVATARS.length]}.svg`
        : null;

    selectedIdRef.current = selectedId;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    // Debounced server-side search across message bodies
    useEffect(() => {
        if (!search) {
            setSearchResults(null);
            setSearchLoading(false);
            return;
        }
        const timer = setTimeout(() => {
            setSearchLoading(true);
            fetch(`/chat/conversations/search?q=${encodeURIComponent(search)}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then((r) => r.json())
                .then((res) => setSearchResults(res.data ?? null))
                .catch(() => {})
                .finally(() => setSearchLoading(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (quickReplyRef.current && !quickReplyRef.current.contains(e.target as Node)) {
                setShowQuickReplies(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addMessage = useCallback((msg: Message) => {
        if (!msg || seenIds.current.has(msg.id)) return;
        seenIds.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
    }, []);

    const handleNewMessage = useCallback((e: { id: number; conversation_id: number; sender_id: number | null; sender_type: string; sender_name: string; body: string; created_at: string; is_internal?: boolean; mentioned_admin_ids?: number[]; guest_name?: string | null; guest_email?: string | null }) => {
        const msg: Message = {
            id: e.id,
            conversation_id: e.conversation_id,
            sender_id: e.sender_id,
            sender_type: e.sender_type,
            sender: e.sender_name ? { id: e.sender_id ?? 0, name: e.sender_name, email: '' } : null,
            body: e.body,
            created_at: e.created_at,
            is_internal: e.is_internal,
        };
        addMessage(msg);
    }, [addMessage]);

    useChatBroadcast(selectedId, handleNewMessage);

    useEffect(() => {
        if (!window.Echo) return;
        let channel: any = null;
        let cleanup: (() => void) | null = null;
        const pusher = (window.Echo as any).connector?.pusher;
        const doSubscribe = () => {
            try {
                channel = window.Echo!.private('admin.chats');
                channel.listen('.message.sent', (e: { id: number; conversation_id: number; body: string; sender_id: number | null; sender_type: string; created_at: string; is_internal?: boolean; guest_name?: string | null; guest_email?: string | null }) => {
                    if (!seenSidebarIds.current.has(e.id)) {
                        seenSidebarIds.current.add(e.id);
                        const msg: Message = {
                            id: e.id,
                            conversation_id: e.conversation_id,
                            sender_id: e.sender_id ?? null,
                            sender_type: e.sender_type,
                            sender: null,
                            body: e.body,
                            is_internal: e.is_internal,
                            created_at: e.created_at,
                        };
                        setConversationsList((prev) =>
                            applyMessageToConversationList(prev, msg, {
                                guest_name: e.guest_name,
                                guest_email: e.guest_email,
                            }),
                        );
                    }

                    if (e.conversation_id === selectedIdRef.current) return;

                    setUnreadDeltas((prev) => ({
                        ...prev,
                        [e.conversation_id]: (prev[e.conversation_id] ?? 0) + 1,
                    }));



                    setPulsingIds((prev) => {
                        const next = new Set(prev);
                        next.add(e.conversation_id);
                        return next;
                    });

                    const pulseTimer = setTimeout(() => {
                        setPulsingIds((prev) => {
                            const next = new Set(prev);
                            next.delete(e.conversation_id);
                            return next;
                        });
                        pulseTimers.current.delete(e.conversation_id);
                    }, 3000);
                    pulseTimers.current.set(e.conversation_id, pulseTimer);
                });
                cleanup = () => {
                    try { channel.stopListening('.message.sent'); window.Echo!.leave('admin.chats'); } catch {}
                };
            } catch {}
        };

        if (pusher?.connection?.state === 'connected') {
            doSubscribe();
        } else if (pusher) {
            const onConnected = () => doSubscribe();
            pusher.connection.bind('connected', onConnected);
            return () => {
                pusher.connection.unbind('connected', onConnected);
                if (cleanup) cleanup();
                for (const t of pulseTimers.current.values()) clearTimeout(t);
                pulseTimers.current.clear();
            };
        }

        return () => {
            if (cleanup) cleanup();
            for (const t of pulseTimers.current.values()) clearTimeout(t);
            pulseTimers.current.clear();
        };
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        setUnreadDeltas((prev) => {
            const next = { ...prev };
            delete next[selectedId];
            return next;
        });
        setPulsingIds((prev) => {
            const next = new Set(prev);
            next.delete(selectedId);
            return next;
        });
        const pt = pulseTimers.current.get(selectedId);
        if (pt) { clearTimeout(pt); pulseTimers.current.delete(selectedId); }
    }, [selectedId]);

    useEffect(() => {
        if (!selectedId || !window.Echo) return;
        const channel = window.Echo.private(`conversation.${selectedId}`);
        channel.listen('.user.typing', (e: { typing: boolean; sender_name?: string }) => {
            setGuestTyping(e.typing);
            if (e.sender_name) setTypingSenderName(e.sender_name);
        });
        channel.listen('.messages.read', () => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.sender_type === 'admin'
                        ? { ...m, read_at: m.read_at ?? new Date().toISOString() }
                        : m,
                ),
            );
        });
        return () => {
            channel.stopListening('.user.typing');
            channel.stopListening('.messages.read');
        };
    }, [selectedId]);

    useEffect(() => {
        if (!selectedId) return;
        seenIds.current.clear();
        setMessages([]);
        setGuestTyping(false);
        setLoadingMessages(true);

        fetch(`/chat/conversations/${selectedId}/messages`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((data: { data?: Message[] }) => {
                const msgs = data.data ?? [];
                for (const m of msgs) seenIds.current.add(m.id);
                setMessages(msgs);
            })
            .catch(() => {})
            .finally(() => setLoadingMessages(false));

        fetch('/chat/messages/read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ conversation_id: selectedId }),
        })
            .then(() => {
                setConversationsList((prev) =>
                    prev.map((c) =>
                        c.id === selectedId ? { ...c, unread_count: 0 } : c,
                    ),
                );
                router.reload({ only: ['chatUnreadCount'] });
            })
            .catch(() => {});
    }, [selectedId]);

    const filteredAdmins = admins
        .filter((a) => a.name.toLowerCase().includes(mentionQuery.toLowerCase()))
        .sort((a, b) => (b.is_online ? 1 : 0) - (a.is_online ? 1 : 0));

    const selectMention = useCallback(
        (admin: { id: number; name: string }) => {
            const ta = textareaRef.current;
            if (!ta) return;
            const cursorPos = ta.selectionStart;
            const textBefore = body.slice(0, cursorPos);
            const lastAtIndex = textBefore.lastIndexOf('@');
            if (lastAtIndex !== -1) {
                const newBody =
                    body.slice(0, lastAtIndex) + `@${admin.name} ` + body.slice(cursorPos);
                setBody(newBody);
                setShowMentions(false);
                requestAnimationFrame(() => {
                    const newPos = lastAtIndex + admin.name.length + 2;
                    ta.setSelectionRange(newPos, newPos);
                    ta.focus();
                });
            }
        },
        [body],
    );

    useEffect(() => {
        fetch('/admin/chats/admins')
            .then((r) => r.json())
            .then((data) => setAdmins(data.data ?? []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetch('/admin/chats/heartbeat', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken() } }).catch(() => {});
        const interval = setInterval(() => {
            fetch('/admin/chats/heartbeat', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken() } }).catch(() => {});
            fetch('/admin/chats/admins')
                .then((r) => r.json())
                .then((data) => setAdmins(data.data ?? []))
                .catch(() => {});
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const sendTyping = useCallback((typing: boolean) => {
        if (!selectedId) return;
        fetch('/chat/typing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ conversation_id: selectedId, typing }),
        }).catch(() => {});
    }, [selectedId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setBody(val);
        const cursorPos = e.target.selectionStart;
        const textBefore = val.slice(0, cursorPos);
        const lastAtIndex = textBefore.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const query = textBefore.slice(lastAtIndex + 1);
            if (query.length > 0 && !query.includes(' ')) {
                setMentionQuery(query);
                setShowMentions(true);
                setMentionIndex(0);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
        if (typingTimer.current === null) {
            sendTyping(true);
        }
        if (typingTimer.current) {
            clearTimeout(typingTimer.current);
        }
        typingTimer.current = setTimeout(() => {
            typingTimer.current = null;
            sendTyping(false);
        }, 2000);
    };

    const sendMessage = async () => {
        const text = body.trim();
        if (!text || sending || !selectedId) return;
        setSending(true);

        try {
            const res = await fetch('/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ conversation_id: selectedId, body: text, is_internal: noteModeRef.current }),
            });

            if (!res.ok) {
                throw new Error('Failed to send');
            }

            if (typingTimer.current) {
                clearTimeout(typingTimer.current);
                typingTimer.current = null;
            }
            sendTyping(false);

            const data = await res.json();
            if (data.message) {
                addMessage(data.message);
                const sent: Message = data.message;
                if (!seenSidebarIds.current.has(sent.id)) {
                    seenSidebarIds.current.add(sent.id);
                    setConversationsList((prev) => applyMessageToConversationList(prev, sent));
                }
            }
            setBody('');
        } catch {
        } finally {
            setSending(false);
            setNoteMode(false);
            noteModeRef.current = false;
        }

        try {
            const res = await fetch(`/chat/conversations/${selectedId}/messages`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = (await res.json()) as { data?: Message[] };
            const fetched = data.data ?? [];
            for (const m of fetched) {
                addMessage(m);
            }
        } catch {
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && filteredAdmins.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex((i) => Math.min(i + 1, filteredAdmins.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex((i) => Math.max(i - 1, 0));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectMention(filteredAdmins[mentionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setShowMentions(false);
                return;
            }
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const totalUnseen = conversationsList.reduce((sum, conv) => {
        return sum + Number(conv.unread_count ?? 0) + (unreadDeltas[conv.id] ?? 0);
    }, 0);

    const handleSelectConv = (id: number) => {
        setSelectedId(id);
        setShowMobileList(false);
    };

    const handleBackToList = () => {
        setShowMobileList(true);
    };

    const handleQuickReply = (text: string) => {
        setBody(text);
        setShowQuickReplies(false);
    };

    const handleAssign = async (convId: number) => {
        try {
            const res = await fetch(`/admin/chats/${convId}/assign`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setConversationsList((prev) =>
                    prev.map((c) =>
                        c.id === convId
                            ? { ...c, admin_id: data.admin_id, admin: { id: data.admin_id, name: data.admin_name, email: '' } }
                            : c,
                    ),
                );
            }
        } catch {}
    };

    const getLastMessage = (conv: Conversation): string | null => {
        if (conv.latest_message && conv.latest_message.body) {
            return conv.latest_message.body;
        }
        return null;
    };

    function shouldShowDateDivider(index: number, msgs: Message[]): boolean {
        if (index === 0) return true;
        const prev = new Date(msgs[index - 1].created_at);
        const curr = new Date(msgs[index].created_at);
        return (
            prev.getFullYear() !== curr.getFullYear() ||
            prev.getMonth() !== curr.getMonth() ||
            prev.getDate() !== curr.getDate()
        );
    }

    function groupMessages(msgs: Message[]): Message[][] {
        if (msgs.length === 0) return [];
        const groups: Message[][] = [[msgs[0]]];
        for (let i = 1; i < msgs.length; i++) {
            const prev = msgs[i - 1];
            const curr = msgs[i];
            const diff = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
            const sameSender = prev.sender_type === curr.sender_type && prev.is_internal === curr.is_internal;
            const withinWindow = diff < 5 * 60 * 1000;
            const sameDay = new Date(prev.created_at).toDateString() === new Date(curr.created_at).toDateString();
            if (sameSender && withinWindow && sameDay) {
                groups[groups.length - 1].push(curr);
            } else {
                groups.push([curr]);
            }
        }
        return groups;
    }

    const sidebarWidth = 'w-[340px]';

    return (
        <>
            <Head title="Live Chat" />

            <style>{`
                @keyframes msg-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5); }
                    70% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-msg-pulse {
                    animation: msg-pulse 1.5s ease-in-out 3;
                }
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                }
                .dark .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #475569;
                }
                .skeleton-bubble {
                    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s ease-in-out infinite;
                    border-radius: 0.75rem;
                }
                .dark .skeleton-bubble {
                    background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
                    background-size: 200% 100%;
                }
            `}</style>

            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Live Chat' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Support
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight inline-flex items-center gap-3">
                                    Live Chat
                                    {totalUnseen > 0 && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-300 ring-1 ring-red-400/30 shadow-sm">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            {totalUnseen}
                                        </span>
                                    )}
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    Respond to customer inquiries in real-time.
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
                                <MessageCircle className="w-3.5 h-3.5" />
                                {conversationsList.length} active
                            </span>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10">
                        <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm flex overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
                            {/* Left sidebar — conversation list */}
                            <div className={`${sidebarWidth} shrink-0 border-r border-surface-100 dark:border-surface-700/60 flex flex-col bg-surface-50/30 dark:bg-brand-900/10 ${
                                showMobileList ? 'flex' : 'hidden'
                            } lg:flex`}>
                                {/* Search */}
                                <div className="shrink-0 px-4 py-3 border-b border-surface-100 dark:border-surface-700/40">
                                    <div className="relative">
                                        {searchLoading ? (
                                            <div className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                                        )}
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search conversations..."
                                            className="w-full h-9 pl-9 pr-8 text-xs bg-surface-100 dark:bg-brand-900/50 border-0 rounded-lg outline-none focus:ring-1 focus:ring-brand-500/40 placeholder:text-surface-400 dark:placeholder:text-surface-500 dark:text-white transition-all"
                                        />
                                        {search && (
                                            <button
                                                onClick={() => setSearch('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* Conversation count */}
                                <div className="shrink-0 px-4 py-2 border-b border-surface-100 dark:border-surface-700/40">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                                        {search ? `${filteredConvs.length} match${filteredConvs.length !== 1 ? 'es' : ''}` : 'All conversations'}
                                    </p>
                                </div>
                                {/* Scrollable conversation list */}
                                <div className="flex-1 overflow-y-auto scrollbar-thin">
                                    {filteredConvs.length === 0 ? (
                                        <div className="flex items-center justify-center h-full p-6">
                                            <div className="text-center">
                                                <MessageCircle className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                                                <p className="text-xs text-surface-400 dark:text-surface-500">
                                                    {search ? 'No conversations match your search' : 'No conversations yet'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {filteredConvs.map((conv) => {
                                                const isSelected = conv.id === selectedId;
                                                const isGuest = !conv.user;
                                                const baseUnread = Number(conv.unread_count ?? 0);
                                                const delta = unreadDeltas[conv.id] ?? 0;
                                                const unread = baseUnread + delta;
                                                const isPulsing = pulsingIds.has(conv.id);
                                                const avatarBg = isGuest
                                                    ? guestBgColor(conv.guest_token ?? '')
                                                    : 'bg-gradient-to-br from-brand-500 to-brand-600';
                                                const guestAvatarSrc = isGuest ? `/images/avatars/${GUEST_AVATARS[hashString(conv.guest_token ?? '') % GUEST_AVATARS.length]}.svg` : undefined;
                                                const lastMsg = getLastMessage(conv);
                                                return (
                                                    <button
                                                        key={conv.id}
                                                        onClick={() => handleSelectConv(conv.id)}
                                                        className={`flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 border-b border-surface-100/50 dark:border-surface-700/20 ${
                                                            isSelected
                                                                ? 'bg-brand-50 dark:bg-brand-700/30 border-l-2 border-l-brand-600 dark:border-l-brand-400'
                                                                : 'hover:bg-surface-50 dark:hover:bg-brand-700/10 border-l-2 border-l-transparent'
                                                        } ${isPulsing ? 'animate-msg-pulse' : ''}`}
                                                    >
                                                        <div className="relative shrink-0 mt-0.5">
                                                            <div className={`relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white ${conv.user ? 'bg-gradient-to-br from-brand-500 to-brand-600' : ''}`}
                                                                style={!conv.user ? { backgroundColor: guestBgColor(conv.guest_token ?? '') } : undefined}
                                                            >
                                                                {conv.user ? (
                                                                    conv.user.name.charAt(0).toUpperCase()
                                                                ) : (
                                                                    <>
                                                                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                                                            {(conv.guest_token ?? 'G').charAt(0).toUpperCase()}
                                                                        </span>
                                                                        <img src={guestAvatarSrc} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                    </>
                                                                )}
                                                            </div>
                                                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-brand-800 ${statusBgDot(conv.status)}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-sm font-semibold text-surface-900 dark:text-white truncate inline-flex items-center gap-1.5">
                                                                    {conv.user?.name ?? conv.guest_name ?? 'Guest'}
                                                                    {conv.has_mention !== undefined && conv.has_mention > 0 && (
                                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-semibold rounded-full bg-brand-50 dark:bg-brand-900/25 text-brand-600 dark:text-brand-400 shrink-0">
                                                                            @mentioned
                                                                        </span>
                                                                    )}
                                                                    {conv.admin && (
                                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-semibold rounded-full bg-purple-50 dark:bg-purple-900/25 text-purple-600 dark:text-purple-400 shrink-0">
                                                                            {conv.admin.name}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className="text-[10px] text-surface-400 dark:text-surface-500 shrink-0">
                                                                    {formatShortTime(conv.updated_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
                                                                {conv.user?.email ?? conv.guest_email ?? 'Guest visitor'}
                                                                {(conv.contact_email || conv.contact_phone) && (
                                                                    <span className="inline-flex items-center gap-1 ml-1.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                        </svg>
                                                                        Contact
                                                                    </span>
                                                                )}
                                                            </p>
                                                            {lastMsg ? (
                                                                <p className="text-[11px] text-surface-400 dark:text-surface-500 truncate mt-1 leading-relaxed">
                                                                    {lastMsg}
                                                                </p>
                                                            ) : (
                                                                <p className="text-[11px] text-surface-300 dark:text-surface-600 italic mt-1">
                                                                    No messages yet
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                                                            {(conv.notes_count ?? 0) > 0 && (
                                                                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-amber-400 dark:bg-amber-500 text-white text-[9px] font-bold leading-none shadow-sm" title={`${conv.notes_count ?? 0} note${(conv.notes_count ?? 0) !== 1 ? 's' : ''}`}>
                                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </span>
                                                            )}
                                                            {unread > 0 && (
                                                                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand-600 dark:bg-brand-400 text-white text-[9px] font-bold leading-none">
                                                                    {unread > 99 ? '99+' : unread}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                {/* Floating summary badge */}
                                {totalUnseen > 0 && (
                                    <div className="shrink-0 px-4 py-2 border-t border-surface-100 dark:border-surface-700/40">
                                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-brand-600/10 dark:bg-brand-400/10 text-brand-700 dark:text-brand-400 text-xs font-semibold">
                                            <span>{totalUnseen} unread</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right pane — message thread */}
                            <div className={`flex-1 flex flex-col min-w-0 ${
                                !showMobileList ? 'flex' : 'hidden'
                            } lg:flex`}>
                                {!selectedConv ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center p-8">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 dark:from-brand-400/5 dark:to-accent-400/5 flex items-center justify-center mx-auto mb-5 ring-1 ring-brand-500/10 dark:ring-brand-400/10">
                                                <MessageCircle className="w-10 h-10 text-brand-400 dark:text-brand-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Select a conversation</h3>
                                            <p className="text-sm text-surface-500 dark:text-surface-400 max-w-xs mx-auto leading-relaxed">
                                                Choose a customer from the sidebar to start chatting. You'll see new messages appear in real-time.
                                            </p>
                                            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-surface-400 dark:text-surface-500">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                                    Active
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                                    Away
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-surface-400" />
                                                    Offline
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Conversation header */}
                                        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-700/60 bg-white dark:bg-brand-800">
                                            <button
                                                onClick={handleBackToList}
                                                className="lg:hidden p-1 -ml-1 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-brand-700 transition-colors"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <div className={`relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold shrink-0 text-white ${selectedConv.user ? 'bg-gradient-to-br from-brand-500 to-brand-600' : ''}`}
                                                style={!selectedConv.user ? { backgroundColor: guestBgColor(selectedConv.guest_token ?? '') } : undefined}
                                            >
                                                {selectedConv.user ? (
                                                    selectedConv.user.name.charAt(0).toUpperCase()
                                                ) : (
                                                    <>
                                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                                            {displayName.charAt(0).toUpperCase()}
                                                        </span>
                                                        <img src={`/images/avatars/${GUEST_AVATARS[hashString(selectedConv.guest_token ?? '') % GUEST_AVATARS.length]}.svg`} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold text-surface-900 dark:text-white truncate">{displayName}</p>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold rounded-full shrink-0 ${
                                                        selectedConv.status === 'active'
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                                            : selectedConv.status === 'away'
                                                                ? 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400'
                                                                : 'bg-surface-100 dark:bg-surface-700/30 text-surface-500 dark:text-surface-400'
                                                    }`}>
                                                        <span className={`w-1 h-1 rounded-full ${
                                                            selectedConv.status === 'active' ? 'bg-emerald-500' :
                                                            selectedConv.status === 'away' ? 'bg-amber-500' : 'bg-surface-400'
                                                        }`} />
                                                        {statusLabel(selectedConv.status)}
                                                    </span>
                                                    {selectedConv.admin && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold rounded-full bg-purple-50 dark:bg-purple-900/25 text-purple-700 dark:text-purple-400 shrink-0">
                                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                            </svg>
                                                            {selectedConv.admin.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate flex items-center gap-1">
                                                    {displayEmail}
                                                    {(selectedConv.contact_email || selectedConv.contact_phone) && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            {selectedConv.contact_email && selectedConv.contact_phone
                                                                ? 'Email & Phone'
                                                                : selectedConv.contact_email
                                                                    ? 'Email'
                                                                    : 'Phone'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {!selectedConv.admin_id && (
                                                    <button
                                                        onClick={() => handleAssign(selectedConv.id)}
                                                        className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800/50 transition-colors shrink-0"
                                                        title="Assign to me"
                                                    >
                                                        Assign to me
                                                    </button>
                                                )}
                                                <div className="hidden sm:flex items-center gap-2 text-[10px] text-surface-400 dark:text-surface-500 shrink-0">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{messages.length} msgs</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Messages area */}
                                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-surface-50/50 dark:bg-brand-900/30 scrollbar-thin">
                                            {loadingMessages ? (
                                                <div className="flex flex-col gap-4 px-2">
                                                    {[80, 60, 40, 70].map((width, i) => (
                                                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                                            <div
                                                                className="skeleton-bubble h-10"
                                                                style={{ width: `${width}%`, maxWidth: '70%' }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : messages.length === 0 && !guestTyping ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                                    <div className="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mb-4">
                                                        <MessageCircle className="w-6 h-6 text-surface-400 dark:text-surface-500" />
                                                    </div>
                                                    <p className="text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">No messages yet</p>
                                                    <p className="text-xs text-surface-400 dark:text-surface-500 max-w-xs">
                                                        Send a message below to start the conversation with {displayName}.
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    {groupMessages(messages).map((group, gi) => {
                                                        const first = group[0];
                                                        const last = group[group.length - 1];
                                                        const isAdmin = first.sender_type === 'admin' && !first.is_internal;
                                                        const isSystem = first.sender_type === 'system';
                                                        const isNote = first.is_internal === true;
                                                        const showDivider = shouldShowDateDivider(
                                                            messages.indexOf(first),
                                                            messages,
                                                        );

                                                        if (!showNotes && isNote) return null;

                                                        if (isSystem) {
                                                            return (
                                                                <div key={`g-${gi}`}>
                                                                    {showDivider && (
                                                                        <div className="flex items-center gap-3 py-2">
                                                                            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700/50" />
                                                                            <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider shrink-0">
                                                                                {formatDateGroup(first.created_at)}
                                                                            </span>
                                                                            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700/50" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-center my-3">
                                                                        <div className="max-w-[85%] bg-accent-50 dark:bg-brand-700/60 text-surface-700 dark:text-surface-300 rounded-xl px-4 py-3 border border-accent-200/40 dark:border-accent-700/15 shadow-sm">
                                                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                                                <Bot className="w-3.5 h-3.5 text-accent-500 dark:text-accent-400" />
                                                                                <span className="text-[9px] font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-400">Auto-reply</span>
                                                                            </div>
                                                                            {group.map((msg) => (
                                                                                <p key={msg.id} className="text-xs leading-relaxed whitespace-pre-wrap mb-1 last:mb-0">{renderMessageBody(msg.body)}</p>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        if (isNote) {
                                                            return (
                                                                <div key={`g-${gi}`}>
                                                                    {showDivider && (
                                                                        <div className="flex items-center gap-3 py-2">
                                                                            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700/50" />
                                                                            <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider shrink-0">
                                                                                {formatDateGroup(first.created_at)}
                                                                            </span>
                                                                            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700/50" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-center my-3">
                                                                        <div className="max-w-[85%] bg-amber-50 dark:bg-amber-900/20 text-surface-700 dark:text-surface-200 rounded-xl px-4 py-3 border border-amber-200/40 dark:border-amber-700/20 shadow-sm">
                                                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                </svg>
                                                                                <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Internal note</span>
                                                                            </div>
                                                                            {group.map((msg) => (
                                                                                <p key={msg.id} className="text-xs leading-relaxed whitespace-pre-wrap mb-1 last:mb-0">{renderMessageBody(msg.body)}</p>
                                                                            ))}
                                                                            {group.length > 0 && (
                                                                                <p className="text-[9px] text-surface-400 dark:text-surface-500 mt-1.5 flex items-center gap-1">
                                                                                    <span>{formatTime(group[group.length - 1].created_at)}</span>
                                                                                    {group[group.length - 1].sender && (
                                                                                        <span className="inline-flex items-center gap-1">
                                                                                            &middot;
                                                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agentColor(group[group.length - 1].sender!.name) }} />
                                                                                            {group[group.length - 1].sender!.name}
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div key={`g-${gi}`}>
                                                                {showDivider && (
                                                                    <div className="flex items-center gap-3 py-2">
                                                                        <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700/50" />
                                                                        <span className="text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider shrink-0">
                                                                            {formatDateGroup(first.created_at)}
                                                                        </span>
                                                                        <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700/50" />
                                                                    </div>
                                                                )}
                                                                <div className={`flex items-end gap-2 mb-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                                    {!isAdmin && (
                                                                        <div className="relative w-7 h-7 shrink-0 mb-1">
                                                                            <div className={`absolute inset-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${customerAvatarBg}`}>
                                                                                {displayName.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            {customerAvatarSrc && (
                                                                                <img src={customerAvatarSrc} alt="" className="absolute inset-0 w-full h-full rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div className="max-w-[75%] sm:max-w-[70%] space-y-1">
                                                                        {group.map((msg, mi) => {
                                                                            const isLast = mi === group.length - 1;
                                                                            return (
                                                                                <div key={msg.id}>
                                                                                    <div className={`px-4 py-2.5 ${
                                                                                        isAdmin
                                                                                            ? 'bg-brand-600 text-white rounded-2xl rounded-br-md'
                                                                                            : 'bg-white dark:bg-brand-700 text-surface-900 dark:text-white shadow-sm rounded-2xl rounded-bl-md border border-surface-100 dark:border-surface-600'
                                                                                    } ${!isLast ? (isAdmin ? 'rounded-br-sm' : 'rounded-bl-sm') : ''}`}>
                                                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageBody(msg.body)}</p>
                                                                                    </div>
                                                                                    {isLast && (
                                                                                        <p className={`flex items-center gap-1 text-[10px] mt-0.5 px-1 ${
                                                                                            isAdmin ? 'justify-end text-surface-400' : 'text-surface-400 dark:text-surface-500'
                                                                                        }`}>
                                                                                            <span title={new Date(msg.created_at).toLocaleString()}>
                                                                                                {formatTime(msg.created_at)}
                                                                                            </span>
                                                                                            {msg.sender && (
                                                                                                <span className="inline-flex items-center gap-1">
                                                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agentColor(msg.sender.name) }} />
                                                                                                    {msg.sender.name}
                                                                                                </span>
                                                                                            )}
                                                                                            {!msg.sender && msg.sender_type === 'guest' && <span> &middot; {displayName}</span>}
                                                                                            {!msg.sender && msg.sender_type === 'system' && <span> &middot; Auto-reply</span>}
                                                                                            {isAdmin && msg.read_at && (
                                                                                                <span className="inline-flex items-center">
                                                                                                    <CheckCheck className="w-3 h-3 text-blue-500" />
                                                                                                </span>
                                                                                            )}
                                                                                            {isAdmin && !msg.read_at && (
                                                                                                <Check className="w-3 h-3 text-surface-400 dark:text-surface-500" />
                                                                                            )}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {guestTyping && (
                                                        <div className="flex justify-start pl-9">
                                                            <div className="bg-white dark:bg-brand-700 border border-surface-100 dark:border-surface-600 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                                                                <p className="text-[11px] text-surface-500 dark:text-surface-400 mb-1.5 font-medium">
                                                                    {typingSenderName || displayName} is typing
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

                                        {/* Input area */}
                                        <div className="shrink-0 border-t border-surface-100 dark:border-surface-700 p-4 bg-white dark:bg-brand-800">
                                            {showQuickReplies && (
                                                <div ref={quickReplyRef} className="mb-3 p-3 rounded-xl bg-surface-50 dark:bg-brand-900/50 border border-surface-100 dark:border-surface-700 shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Quick replies</span>
                                                        <button onClick={() => setShowQuickReplies(false)} className="p-0.5 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        {QUICK_REPLIES.map((reply, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleQuickReply(reply)}
                                                                className="text-left text-[11px] px-3 py-2 rounded-lg bg-white dark:bg-brand-800 text-surface-700 dark:text-surface-300 hover:bg-brand-50 dark:hover:bg-brand-700 hover:text-brand-700 dark:hover:text-brand-300 border border-surface-100 dark:border-surface-700 transition-colors leading-relaxed"
                                                            >
                                                                {reply}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {noteMode && (
                                                <div className="mb-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/20 shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Note templates</span>
                                                        <button onClick={() => setNoteMode(false)} className="p-0.5 rounded text-amber-500 hover:text-amber-700 dark:hover:text-amber-300">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        {NOTE_TEMPLATES.map((tmpl, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setBody(tmpl)}
                                                                className="text-left text-[11px] px-3 py-2 rounded-lg bg-white dark:bg-brand-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-900 dark:hover:text-amber-200 border border-amber-200/50 dark:border-amber-700/30 transition-colors leading-relaxed"
                                                            >
                                                                {tmpl}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-end gap-2">
                                                <button
                                                    onClick={() => setShowQuickReplies((prev) => !prev)}
                                                    className="shrink-0 w-[44px] h-[44px] rounded-xl bg-surface-100 dark:bg-brand-900/50 hover:bg-surface-200 dark:hover:bg-brand-700/50 text-surface-500 dark:text-surface-400 flex items-center justify-center transition-all duration-200 active:scale-95 border border-surface-200 dark:border-surface-600"
                                                    title="Quick replies"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const next = !noteMode;
                                                        setNoteMode(next);
                                                        noteModeRef.current = next;
                                                    }}
                                                    className={`shrink-0 w-[44px] h-[44px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 border ${
                                                        noteMode
                                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                                                            : 'bg-surface-100 dark:bg-brand-900/50 hover:bg-surface-200 dark:hover:bg-brand-700/50 text-surface-500 dark:text-surface-400 border-surface-200 dark:border-surface-600'
                                                    }`}
                                                    title="Internal note"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setShowNotes((prev) => !prev)}
                                                    className={`shrink-0 w-[44px] h-[44px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 border ${
                                                        showNotes
                                                            ? 'bg-amber-50 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700'
                                                            : 'bg-surface-100 dark:bg-brand-900/50 hover:bg-surface-200 dark:hover:bg-brand-700/50 text-surface-400 dark:text-surface-500 border-surface-200 dark:border-surface-600'
                                                    }`}
                                                    title={showNotes ? 'Hide notes' : 'Show notes'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                                    </svg>
                                                </button>
                                                <div className="flex-1 relative">
                                                    {showMentions && filteredAdmins.length > 0 && (
                                                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-brand-800 rounded-xl border border-surface-200 dark:border-surface-600 shadow-xl overflow-hidden z-50">
                                                            <div className="max-h-[160px] overflow-y-auto py-1">
                                                                {filteredAdmins.map((admin, i) => (
                                                                    <button
                                                                        key={admin.id}
                                                                        onClick={() => selectMention(admin)}
                                                                        onMouseEnter={() => setMentionIndex(i)}
                                                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                                                                            i === mentionIndex
                                                                                ? 'bg-brand-50 dark:bg-brand-700/50 text-brand-700 dark:text-brand-300'
                                                                                : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-brand-700/30'
                                                                        }`}
                                                                    >
                                                                        <span className="relative shrink-0">
                                                                            <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-600 flex items-center justify-center text-[10px] font-bold text-brand-600 dark:text-brand-200">
                                                                                {admin.name.charAt(0).toUpperCase()}
                                                                            </span>
                                                                            {admin.is_online && (
                                                                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white dark:border-brand-800" />
                                                                            )}
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5">
                                                                            <span>{admin.name}</span>
                                                                            {admin.is_online && <span className="text-[9px] text-emerald-500 font-medium">Online</span>}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {noteMode && (
                                                        <span className="absolute -top-5 left-3 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                                                            Internal note (only admins will see this)
                                                        </span>
                                                    )}
                                                    <textarea
                                                        ref={textareaRef}
                                                        value={body}
                                                        onChange={handleInputChange}
                                                        onKeyDown={handleKeyDown}
                                                        placeholder={noteMode ? 'Write an internal note...' : 'Type your reply...'}
                                                        rows={1}
                                                        className={`w-full min-h-[44px] max-h-[120px] px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none resize-none transition-all dark:text-white placeholder:text-surface-400 ${
                                                            noteMode
                                                                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/50'
                                                                : 'bg-surface-50 dark:bg-brand-900/50 border-surface-200 dark:border-surface-600'
                                                        }`}
                                                    />
                                                </div>
                                                <button
                                                    onClick={sendMessage}
                                                    disabled={!body.trim() || sending}
                                                    className={`shrink-0 px-5 h-[44px] rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 active:scale-95 ${
                                                        noteMode
                                                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                            : 'bg-brand-600 hover:bg-brand-700 text-white'
                                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                >
                                                    {sending ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            {noteMode ? 'Note' : 'Send'}
                                                            {noteMode ? (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            ) : (
                                                                <Send className="w-4 h-4" />
                                                            )}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
