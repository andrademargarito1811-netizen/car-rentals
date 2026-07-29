import { useState, useEffect, useRef, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { toast } from 'sonner';
import { useChatBroadcast } from '@/Hooks/useChatBroadcast';

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
    messages: Message[];
    created_at: string;
    updated_at: string;
}

interface ChatShowProps {
    conversation: Conversation;
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

const NOTE_TEMPLATES = [
    'Escalated to [team/department] for further review.',
    'Called customer — no answer. Will try again later.',
    'Resolved via phone — customer confirmed.',
    'Waiting on supplier for vehicle availability.',
    'Refund initiated — pending approval.',
    'Follow-up needed in [X] days.',
];

function csrfToken(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
}

export default function ChatShow({ conversation }: ChatShowProps) {
    const route = useRoute();
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id as number | undefined;
    const [messages, setMessages] = useState<Message[]>(conversation.messages);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [guestTyping, setGuestTyping] = useState(false);
    const [typingSenderName, setTypingSenderName] = useState('');
    const [noteMode, setNoteMode] = useState(false);
    const noteModeRef = useRef(false);
    const [showNotes, setShowNotes] = useState(true);
    const [admins, setAdmins] = useState<{ id: number; name: string; is_online?: boolean }[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const seenIds = useRef(new Set<number>(conversation.messages.map((m) => m.id)));
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    const addMessage = useCallback((msg: Message) => {
        if (!msg || seenIds.current.has(msg.id)) return;
        seenIds.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
    }, []);

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

    useChatBroadcast(conversation.id, handleNewMessage);

    useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.private(`conversation.${conversation.id}`);
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
    }, [conversation.id]);

    useEffect(() => {
        fetch('/chat/messages/read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ conversation_id: conversation.id }),
        }).catch(() => {});
    }, [conversation.id]);

    const sendTyping = useCallback((typing: boolean) => {
        fetch('/chat/typing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ conversation_id: conversation.id, typing }),
        }).catch(() => {});
    }, [conversation.id]);

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
        if (!text || sending) return;
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
                body: JSON.stringify({ conversation_id: conversation.id, body: text, is_internal: noteModeRef.current }),
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
            }
            setBody('');
        } catch {
            // Message send failed silently
        } finally {
            setSending(false);
            setNoteMode(false);
            noteModeRef.current = false;
        }

        try {
            const res = await fetch(`/chat/conversations/${conversation.id}/messages`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = (await res.json()) as { data?: Message[] };
            const fetched = data.data ?? [];
            for (const m of fetched) {
                addMessage(m);
            }
        } catch {
            // Fail silently
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

    const [assigned, setAssigned] = useState(!!conversation.admin_id);

    const handleAssign = async () => {
        try {
            const res = await fetch(`/admin/chats/${conversation.id}/assign`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                setAssigned(true);
            }
        } catch {}
    };

    const displayName = conversation.user?.name ?? conversation.guest_name ?? 'Guest';
    const displayEmail = conversation.user?.email ?? conversation.guest_email ?? 'Guest visitor';

    return (
        <>
            <Head title={`Chat with ${displayName}`} />
            <AuthenticatedLayout
                header={
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={route('admin.chats.index')}
                                className="p-2 rounded-xl text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
                                        {displayName}
                                    </h1>
                                    {assigned && conversation.admin && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-purple-50 dark:bg-purple-900/25 text-purple-700 dark:text-purple-400 shrink-0">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                            {conversation.admin.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-surface-500 dark:text-surface-400">{displayEmail}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!assigned && (
                                <button
                                    onClick={handleAssign}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800/50 transition-colors"
                                >
                                    Assign to me
                                </button>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                            </span>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 max-w-4xl mx-auto">
                        <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
                            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-surface-50/50 dark:bg-brand-900/30">
                                {messages.length === 0 && !guestTyping ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <p className="text-sm text-surface-500 dark:text-surface-400">No messages yet. Start the conversation.</p>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg) => {
                                            const isAdmin = msg.sender_type === 'admin' && !msg.is_internal;
                                            const isNote = msg.is_internal === true;

                                            if (!showNotes && isNote) return null;

                                            if (isNote) {
                                                return (
                                                    <div key={msg.id} className="flex justify-center">
                                                        <div className="max-w-[85%] bg-amber-50 dark:bg-amber-900/20 text-surface-700 dark:text-surface-200 rounded-xl px-4 py-3 border border-amber-200/40 dark:border-amber-700/20 shadow-sm">
                                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Internal note</span>
                                                            </div>
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageBody(msg.body)}</p>
                                                            <p className="text-[9px] text-surface-400 dark:text-surface-500 mt-1.5 flex items-center gap-1">
                                                                <span>{formatDate(msg.created_at)} at {formatTime(msg.created_at)}</span>
                                                                {msg.sender && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        &middot;
                                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agentColor(msg.sender.name) }} />
                                                                        {msg.sender.name}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    <div className="max-w-[70%]">
                                                        <div className={`px-4 py-2.5 rounded-2xl ${
                                                            isAdmin
                                                                ? 'bg-brand-600 text-white rounded-br-md'
                                                                : 'bg-white dark:bg-brand-700 text-surface-900 dark:text-white shadow-sm rounded-bl-md border border-surface-100 dark:border-surface-600'
                                                        }`}>
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageBody(msg.body)}</p>
                                                        </div>
                                                        <p className={`flex items-center gap-1 text-[10px] mt-1 px-1 ${isAdmin ? 'text-right text-surface-400' : 'text-surface-400 dark:text-surface-500'}`}>
                                                            <span>{formatDate(msg.created_at)} at {formatTime(msg.created_at)}</span>
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
                                                                    <svg className="w-3 h-3 -mr-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4 8-8" />
                                                                    </svg>
                                                                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4 8-8" />
                                                                    </svg>
                                                                </span>
                                                            )}
                                                            {isAdmin && !msg.read_at && (
                                                                <svg className="w-3 h-3 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4 8-8" />
                                                                </svg>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {guestTyping && (
                                            <div className="flex justify-start">
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

                            <div className="shrink-0 border-t border-surface-100 dark:border-surface-700 p-4 bg-white dark:bg-brand-800">
                                {noteMode && (
                                    <div className="mb-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/20 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Note templates</span>
                                            <button onClick={() => { setNoteMode(false); noteModeRef.current = false; }} className="p-0.5 rounded text-amber-500 hover:text-amber-700 dark:hover:text-amber-300">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
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
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                    </svg>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
