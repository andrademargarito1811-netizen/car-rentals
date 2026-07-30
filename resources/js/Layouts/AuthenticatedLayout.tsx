import { ReactNode, useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Toast from '@/Components/Toast';
import { Toaster } from '@/Components/ui/sonner';
import ChatWidget from '@/Components/ChatWidget';
import AdminSidebar from '@/Components/AdminSidebar';
import CommandPalette from '@/Components/CommandPalette';
import Breadcrumbs from '@/Components/Breadcrumbs';
import CookieConsent from '@/Components/CookieConsent';
import { useContactMessageBroadcast } from '@/Hooks/useContactMessageBroadcast';
import { useChatUnreadBroadcast } from '@/Hooks/useChatUnreadBroadcast';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface AuthenticatedLayoutProps {
    header?: ReactNode;
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AuthenticatedLayout({ header, children, breadcrumbs }: AuthenticatedLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useContactMessageBroadcast();
    useChatUnreadBroadcast();
    const [collapsed, setCollapsed] = useState(false);
    const [dark, setDark] = useState(() => {
        if (typeof window === 'undefined') return false;
        const stored = localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [dark]);

    const toggleDark = () => setDark((prev) => !prev);

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-brand-900 transition-colors duration-300">
                <Toast />
                <Toaster position="bottom-right" richColors closeButton />
                <CommandPalette />

                {/* Mobile overlay */}
                {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <AdminSidebar
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(p => !p)}
                sidebarOpen={sidebarOpen}
                onCloseSidebar={() => setSidebarOpen(false)}
                dark={dark}
                onToggleDark={toggleDark}
            />

            {/* Main content area */}
            <div className={`${collapsed ? 'lg:ml-[72px]' : 'lg:ml-80'} flex flex-col min-h-screen transition-all duration-300`}>
                {/* Mobile top bar */}
                <header className="sticky top-0 z-30 lg:hidden bg-white/95 dark:bg-brand-900/95 backdrop-blur-md border-b border-surface-100 dark:border-surface-700 shadow-sm">
                    <div className="flex items-center justify-between px-4 h-16">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <Link href={route('cars.index')} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-brand-800 border border-surface-100 dark:border-surface-600 flex items-center justify-center overflow-hidden">
                                <img src="/img/company_logo/company-logos-01.png" alt="West Car Rental" className="h-6 w-auto object-contain" />
                            </div>
                            <span className="text-sm font-bold text-surface-900 dark:text-white">West Car Rental</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleDark}
                                className="p-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg transition-colors"
                            >
                                {dark ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364 2.364l-1.591 1.591M21 12h-2.25m-.364 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.227L5.636 6.036M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Header (optional, passed from page) */}
                {header && (
                    <header>
                        <div className="px-6 lg:px-10 py-6">
                            {header}
                        </div>
                    </header>
                )}

                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div className="px-6 lg:px-10">
                        <Breadcrumbs items={breadcrumbs} />
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1">{children}</main>
            </div>
            <ChatWidget />
            <CookieConsent />
        </div>
    );
}