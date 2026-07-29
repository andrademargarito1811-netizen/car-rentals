import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import SlidePanel from '@/Components/SlidePanel';

interface ContactMessage {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    subject: string;
    reservation_number: string | null;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface ContactMessagesIndexProps {
    messages: {
        data: ContactMessage[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filter?: string;
}

const FILTER_TABS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
];

export default function ContactMessagesIndex({ messages, filter = 'all' }: ContactMessagesIndexProps) {
    const route = useRoute();
    const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingMessage, setDeletingMessage] = useState<ContactMessage | null>(null);

    function openView(message: ContactMessage) {
        setViewingMessage({ ...message, is_read: true });
        setShowPanel(true);
        if (!message.is_read) {
            router.patch(route('admin.contact-messages.read', message.id), {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }

    function closePanel() {
        setShowPanel(false);
        setViewingMessage(null);
    }

    function formatDate(dateStr: string) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    const unreadCount = messages.data.filter((m) => !m.is_read).length;
    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Contact Messages" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Contact Messages' }]}
                header={
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${headerGradient} p-6 sm:p-8`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Communication
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Contact Messages
                                </h1>
                                <p className="text-white/60 max-w-xl">
                                    View and manage messages received from the contact form.
                                </p>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10 space-y-8">

                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: 'Total', value: messages.data.length, gradient: 'from-brand-500/20 to-brand-700/10', iconGradient: 'from-brand-500 to-brand-600', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
                                { label: 'Unread', value: unreadCount, gradient: 'from-amber-500/20 to-amber-600/10', iconGradient: 'from-amber-500 to-amber-600', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
                                { label: 'Read', value: messages.data.filter((m) => m.is_read).length, gradient: 'from-emerald-500/20 to-emerald-600/10', iconGradient: 'from-emerald-500 to-emerald-600', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                            ].map((stat) => (
                                <div key={stat.label} className="animate-fade-in-up">
                                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} dark:opacity-30 opacity-100`} />
                                        <div className="relative p-4 sm:p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg shadow-black/10 text-white relative z-10`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                                        </svg>
                                                    </div>
                                                    <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${stat.iconGradient} opacity-20 blur-md`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{stat.label}</p>
                                                    <p className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">{stat.value}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500 shrink-0">Messages</span>
                                <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                            </div>

                            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-100/70 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60 w-fit">
                                {FILTER_TABS.map((tab) => {
                                    const isActive = filter === tab.key;
                                    return (
                                        <Link key={tab.key}
                                            href={tab.key === 'all' ? route('admin.contact-messages.index') : route('admin.contact-messages.index', { filter: tab.key })}
                                            preserveState
                                            preserveScroll
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-white dark:bg-brand-800 shadow-sm text-brand-700 dark:text-brand-300 ring-1 ring-surface-200 dark:ring-surface-700'
                                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                                            }`}
                                        >
                                            {tab.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            {messages.data.length === 0 ? (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 p-12 sm:p-16 animate-fade-in-up">
                                    <div className="text-center max-w-sm mx-auto">
                                        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700/50 flex items-center justify-center mx-auto mb-5">
                                            <svg className="w-8 h-8 text-surface-400 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">No messages yet</h3>
                                        <p className="text-sm text-surface-500 dark:text-surface-400">Messages from the contact form will appear here.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-700/60 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-surface-100 dark:border-surface-700/60 bg-surface-50/70 dark:bg-brand-900/30">
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Status</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">From</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Subject</th>
                                                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Date</th>
                                                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-100 dark:divide-surface-700/40">
                                                {messages.data.map((msg, i) => (
                                                    <tr key={msg.id} className={`animate-fade-in-up stagger-${(i % 6) + 1} group hover:bg-surface-50/50 dark:hover:bg-brand-900/20 transition-colors duration-150 ${!msg.is_read ? 'bg-brand-50/40 dark:bg-brand-900/30' : ''}`}>
                                                        <td className="px-5 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${
                                                                msg.is_read
                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                                                    : 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${msg.is_read ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                                                {msg.is_read ? 'Read' : 'New'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                                    {msg.first_name.charAt(0)}{msg.last_name.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className={`font-semibold truncate ${msg.is_read ? 'text-surface-900 dark:text-white' : 'text-surface-900 dark:text-white'}`}>
                                                                        {msg.first_name} {msg.last_name}
                                                                    </p>
                                                                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{msg.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 max-w-xs">
                                                            <div className="min-w-0">
                                                                <p className={`font-semibold truncate ${!msg.is_read ? 'text-surface-900 dark:text-white' : 'text-surface-900 dark:text-white'}`}>
                                                                    {msg.subject}
                                                                </p>
                                                                <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{msg.message}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs text-surface-500 dark:text-surface-400 font-mono">{formatDate(msg.created_at)}</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button onClick={() => openView(msg)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all duration-200"
                                                                    title="View Message">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                </button>
                                                                <button onClick={() => { setDeletingMessage(msg); setShowDeleteModal(true); }}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                                                    title="Delete Message">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {messages.links && messages.links.length > 3 && (
                                        <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-surface-100 dark:border-surface-700/40">
                                            {messages.links.map((link) => {
                                                const label = link.label
                                                    .replace('&laquo;', '\u2039')
                                                    .replace('&raquo;', '\u203A')
                                                    .replace('&lsaquo;', '\u2039')
                                                    .replace('&rsaquo;', '\u203A');
                                                return (
                                                    <Link key={link.label}
                                                        href={link.url || '#'}
                                                        preserveState
                                                        preserveScroll
                                                        className={`inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                            link.active
                                                                ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/20 ring-1 ring-brand-500/30'
                                                                : 'text-surface-600 dark:text-surface-300 bg-white dark:bg-brand-800/60 hover:bg-surface-100 dark:hover:bg-surface-700/60 hover:text-surface-900 dark:hover:text-white hover:shadow-sm ring-1 ring-surface-200 dark:ring-surface-600/30'
                                                        } ${!link.url ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                                                        dangerouslySetInnerHTML={{ __html: label }} />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            {showDeleteModal && deletingMessage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-white dark:bg-brand-800 rounded-2xl shadow-2xl shadow-black/20 border border-surface-100 dark:border-surface-700/60 animate-fade-in-up overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="relative p-6 sm:p-7 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">Delete Message</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                                Are you sure you want to delete the message from
                            </p>
                            <p className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-6">
                                &ldquo;{deletingMessage.first_name} {deletingMessage.last_name}&rdquo;?
                            </p>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mb-6">
                                This action cannot be undone. The message will be permanently removed.
                            </p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700/60 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-all duration-200">
                                    Cancel
                                </button>
                                <button onClick={() => {
                                    router.delete(route('admin.contact-messages.destroy', deletingMessage.id), {
                                        onSuccess: () => setShowDeleteModal(false),
                                        preserveScroll: true,
                                    });
                                }}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SlidePanel
                show={showPanel}
                onClose={closePanel}
                title={viewingMessage ? `Message from ${viewingMessage.first_name} ${viewingMessage.last_name}` : 'Message'}
            >
                {viewingMessage && (
                    <div className="space-y-6">
                        <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">First Name</p>
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{viewingMessage.first_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Last Name</p>
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{viewingMessage.last_name}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Email</p>
                                <a href={`mailto:${viewingMessage.email}`} className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline">{viewingMessage.email}</a>
                            </div>
                            {viewingMessage.phone && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Phone</p>
                                    <a href={`tel:${viewingMessage.phone}`} className="text-sm font-semibold text-surface-900 dark:text-white">{viewingMessage.phone}</a>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Subject</p>
                                <p className="text-sm font-semibold text-surface-900 dark:text-white">{viewingMessage.subject}</p>
                            </div>
                            {viewingMessage.reservation_number && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Reservation Number</p>
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{viewingMessage.reservation_number}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Date</p>
                                <p className="text-sm text-surface-600 dark:text-surface-400">{formatDate(viewingMessage.created_at)}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">Message</p>
                            <div className="bg-surface-50/70 dark:bg-brand-900/30 rounded-xl border border-surface-100 dark:border-surface-700/50 p-5">
                                <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{viewingMessage.message}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-700/60">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded ${
                                viewingMessage.is_read
                                    ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${viewingMessage.is_read ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                {viewingMessage.is_read ? 'Read' : 'Unread'}
                            </span>
                        </div>
                    </div>
                )}
            </SlidePanel>
        </>
    );
}
