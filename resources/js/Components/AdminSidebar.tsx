import { useState, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import DropdownLink from '@/Components/DropdownLink';
import {
    LayoutDashboard, Truck, Calendar, FileText, Tag, Percent, Image,
    Layout, MapPin, Mail,     MessageCircle, Users, Car,
    ScrollText, Receipt, ChevronDown, Star, FileClock, UserCheck,
} from 'lucide-react';
import { footerLogoUrl } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    admin?: boolean;
    section: string;
    group?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Truck, Calendar, FileText, Tag, Percent, Image,
    Layout, MapPin, Mail, MessageCircle, Users, Car, ScrollText, Receipt,
    Star, FileClock, UserCheck,
};

const navItems: NavItem[] = [
    { section: 'Main', label: 'Dashboard', href: 'dashboard', icon: 'LayoutDashboard' },
    { section: 'Main', label: 'Reservation', href: 'admin.reservations.index', icon: 'FileText', admin: true },
    { section: 'Main', label: 'Booking Schedule', href: 'admin.cars.schedule', icon: 'Calendar', admin: true },
    { section: 'Main', label: 'Live Chat', href: 'admin.chats.index', icon: 'MessageCircle', admin: true },
    { section: 'Management', label: 'Vehicle', href: 'admin.cars.index', icon: 'Truck', admin: true, group: 'Catalog' },
    { section: 'Management', label: 'Vehicle Classes', href: 'admin.vehicle-classes.index', icon: 'Car', admin: true, group: 'Catalog' },
    { section: 'Management', label: 'Account Management', href: 'admin.users.index', icon: 'Users', admin: true, group: 'Commerce' },
    { section: 'Management', label: 'Guests', href: 'admin.guests.index', icon: 'UserCheck', admin: true, group: 'Commerce' },
    { section: 'Management', label: 'Coupon Discount', href: 'admin.coupons.index', icon: 'Tag', admin: true, group: 'Commerce' },
    { section: 'Management', label: 'Tax & Surcharges', href: 'admin.tax.index', icon: 'Percent', admin: true, group: 'Commerce' },
    { section: 'Management', label: 'Extra Charges', href: 'admin.extra-charges.index', icon: 'Receipt', admin: true, group: 'Commerce' },
    { section: 'Management', label: 'Invoice Settings', href: 'admin.invoice-settings.index', icon: 'Receipt', group: 'Commerce' },
    { section: 'Management', label: 'Locations Settings', href: 'admin.locations.index', icon: 'MapPin', admin: true, group: 'Site Settings' },
    { section: 'Management', label: 'Page Customization', href: 'admin.hero-settings', icon: 'Image', admin: true, group: 'Site Settings' },
    { section: 'Management', label: 'Reviews', href: 'admin.reviews.index', icon: 'Star', admin: true, group: 'Support' },
    { section: 'Management', label: 'Contact Messages', href: 'admin.contact-messages.index', icon: 'Mail', group: 'Support' },
    { section: 'Management', label: 'Agreements', href: 'admin.agreements.index', icon: 'ScrollText', group: 'Support' },
    { section: 'Management', label: 'Audit Logs', href: 'admin.audit-logs.index', icon: 'FileClock', admin: true, group: 'Support' },
];

interface AdminSidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    sidebarOpen: boolean;
    onCloseSidebar: () => void;
    dark: boolean;
    onToggleDark: () => void;
}

export default function AdminSidebar({ collapsed, onToggleCollapse, sidebarOpen, onCloseSidebar, dark, onToggleDark }: AdminSidebarProps) {
    const { auth, unreadMessageCount, chatUnreadCount, footerSettings } = usePage().props as any;
    const brandName = footerSettings?.brand_name || 'West Car Rental';
    const brandTagline = footerSettings?.brand_tagline || 'Crafted for the Open Road';
    const logoUrl = footerLogoUrl(footerSettings?.logo_path);
    const isAdmin = auth?.user?.role === 'admin';
    const unreadCount = (unreadMessageCount as number) || 0;
    const chatUnread = (chatUnreadCount as number) || 0;
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => {
            const next = { ...prev };
            if (next[group] === undefined) next[group] = false;
            else next[group] = !next[group];
            return next;
        });
    };

    const isGroupExpanded = (group: string) => expandedGroups[group] !== false;

    const isActive = (item: NavItem) => {
        try {
            return route().current(getItemRoute(item));
        } catch {
            return false;
        }
    };

    const getItemRoute = (item: NavItem) =>
        item.label === 'Dashboard' && isAdmin ? 'admin.dashboard' : item.href;

    const isVisible = (item: NavItem) => !('admin' in item) || !item.admin || isAdmin;

    const mainItems = useMemo(() => navItems.filter(item => item.section === 'Main' && isVisible(item)), [isAdmin]);
    const managementItems = useMemo(() => navItems.filter(item => item.section === 'Management' && isVisible(item)), [isAdmin]);

    const groupedManagement = useMemo(() => {
        return managementItems.reduce<{ group: string; items: NavItem[] }[]>((acc, item) => {
            const g = item.group || 'Other';
            const existing = acc.find(e => e.group === g);
            if (existing) existing.items.push(item);
            else acc.push({ group: g, items: [item] });
            return acc;
        }, []);
    }, [managementItems]);

    const renderNavItem = (item: NavItem) => {
        const active = isActive(item);
        const Icon = iconMap[item.icon];
        return (
            <Link
                key={item.label}
                href={route(getItemRoute(item))}
                onClick={onCloseSidebar}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    collapsed ? 'justify-center' : ''
                } ${
                    active
                        ? 'bg-gradient-to-r from-brand-50 to-transparent dark:from-brand-900/30 dark:to-transparent text-brand-800 dark:text-brand-200 shadow-sm ring-1 ring-brand-200/50 dark:ring-brand-700/40'
                        : item.label === 'Live Chat'
                            ? 'text-surface-600 dark:text-surface-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 bg-emerald-50/30 dark:bg-emerald-900/5'
                            : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-white'
                }`}
            >
                {(active || item.label === 'Live Chat') && (
                    <>
                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${
                            active
                                ? 'bg-gradient-to-b from-accent-400 to-accent-500 shadow-sm shadow-accent-400/50'
                                : 'bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-400/50'
                        }`} />
                        <span className={`absolute inset-0 rounded-xl ring-1 ring-inset pointer-events-none ${
                            active
                                ? 'ring-accent-400/20 dark:ring-accent-400/10'
                                : 'ring-emerald-400/15 dark:ring-emerald-400/10'
                        }`} />
                    </>
                )}
                {Icon && (
                    <Icon className={`w-5 h-5 shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5 ${
                        active
                            ? 'text-brand-600 dark:text-brand-400'
                            : item.label === 'Live Chat'
                                ? 'text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300'
                                : 'text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300'
                    }`} />
                )}
                <span className={`${collapsed ? 'hidden' : ''}`}>{item.label}</span>
                {item.label === 'Contact Messages' && unreadCount > 0 && (
                    <>
                        <span className={`ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 ${collapsed ? 'hidden' : ''}`}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                        <span className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-brand-900 ${collapsed ? '' : 'hidden'}`} />
                    </>
                )}
                {item.label === 'Live Chat' && chatUnread > 0 && (
                    <>
                        <span className={`ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 ${collapsed ? 'hidden' : ''}`}>
                            {chatUnread > 99 ? '99+' : chatUnread}
                        </span>
                        <span className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-brand-900 animate-pulse ${collapsed ? '' : 'hidden'}`} />
                    </>
                )}
            </Link>
        );
    };

    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-full ${
                collapsed ? 'w-[72px]' : 'w-80'
            } bg-white/80 dark:bg-brand-900/80 backdrop-blur-xl border-r border-surface-100 dark:border-surface-800 shadow-xl flex flex-col transition-all duration-300 ease-out lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Logo area */}
            <div className="relative flex items-center h-24 lg:h-28 px-5 shrink-0 group">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-400/40 to-transparent" />
                <Link href={route('admin.dashboard')} className={`flex items-center gap-3 group min-w-0 ${collapsed ? 'justify-center flex-1' : 'flex-1'}`} title={collapsed ? brandName : undefined}>
                    <div className="relative">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-white dark:bg-brand-800 border-2 border-surface-100 dark:border-surface-600 group-hover:border-accent-400 flex items-center justify-center shadow-sm transition-all duration-300 overflow-hidden shrink-0">
                            <img
                                src={logoUrl}
                                alt={brandName}
                                className="h-9 lg:h-11 w-auto object-contain"
                            />
                        </div>
                        <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className={`min-w-0 ${collapsed ? 'hidden' : ''}`}>
                        <span className="text-base lg:text-lg font-bold text-surface-900 dark:text-white tracking-tight leading-tight block truncate">{brandName}</span>
                        <span className="text-[10px] lg:text-xs font-medium text-accent-600 tracking-[0.15em] uppercase leading-tight block">{brandTagline}</span>
                    </div>
                </Link>
                <button onClick={onCloseSidebar} className="lg:hidden p-1.5 text-surface-400 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <button onClick={onToggleCollapse} className={`hidden lg:flex items-center justify-center p-1.5 text-surface-400 hover:text-surface-900 dark:hover:text-white rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200 shrink-0 ${
                    collapsed
                        ? 'absolute right-1 top-1/2 -translate-y-1/2 z-10 opacity-0 hover:opacity-100 focus:opacity-100 bg-white/90 dark:bg-brand-800/90 shadow-md border border-surface-200 dark:border-surface-700 group-hover:opacity-100'
                        : ''
                }`} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                    <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-6 scrollbar-hide">
                {/* Main section */}
                <div>
                    <div className={`flex items-center gap-2 px-3 mb-3 ${collapsed ? 'hidden' : ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-surface-300 dark:bg-surface-600" />
                        <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500">Main</span>
                    </div>
                    <div className="space-y-1">
                        {mainItems.map(renderNavItem)}
                    </div>
                </div>

                {/* Management section with collapsible groups */}
                <div>
                    <div className={`flex items-center gap-2 px-3 mb-3 ${collapsed ? 'hidden' : ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-surface-300 dark:bg-surface-600" />
                        <span className="flex-1 h-px bg-gradient-to-r from-surface-200 dark:from-surface-700 to-transparent" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500">Management</span>
                    </div>
                    <div className="space-y-2">
                        {groupedManagement.map(({ group, items }) => (
                            <div key={group}>
                                <button
                                    onClick={() => toggleGroup(group)}
                                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-all duration-200 ${collapsed ? 'hidden' : ''}`}
                                >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isGroupExpanded(group) ? 'rotate-0' : '-rotate-90'}`} />
                                    {group}
                                </button>
                                <div className={`space-y-1 ${!isGroupExpanded(group) && !collapsed ? 'hidden' : ''}`}>
                                    {items.map(renderNavItem)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Bottom section */}
            <div className="relative shrink-0 overflow-visible">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-surface-200 dark:via-surface-700 to-transparent" />
                <div className="px-3 py-3 space-y-1.5">
                    <button
                        onClick={onToggleDark}
                        className={`flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-white transition-all duration-200 group ${
                            collapsed ? 'justify-center' : 'gap-3'
                        }`}
                    >
                        <div className={`w-5 h-5 shrink-0 flex items-center justify-center transition-all duration-300 ${dark ? 'text-accent-400' : 'text-surface-400'}`}>
                            {dark ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364 2.364l-1.591 1.591M21 12h-2.25m-.364 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.227L5.636 6.036M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                </svg>
                            )}
                        </div>
                        <span className={`text-left ${collapsed ? 'hidden' : ''}`}>{dark ? 'Light Mode' : 'Dark Mode'}</span>
                        <span className={`ml-auto w-9 h-5 rounded-full transition-colors duration-300 relative flex items-center ${
                            dark ? 'bg-accent-400/30' : 'bg-surface-200'
                        }`}>
                            <span className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 absolute ${
                                dark ? 'right-0.5' : 'left-0.5'
                            }`} />
                        </span>
                    </button>

                    <Dropdown
                        align="left"
                        width="48"
                        up
                        trigger={
                            <button type="button" className={`flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors duration-200 ${
                                collapsed ? 'justify-center' : 'gap-3'
                            }`}>
                                <div className="relative shrink-0">
                                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                                        {auth.user.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-surface-900" />
                                </div>
                                <span className={`truncate font-medium ${collapsed ? 'hidden' : ''}`}>{auth.user.name}</span>
                                {!collapsed && (
                                    <svg className="h-4 w-4 text-surface-400 dark:text-surface-500 ml-auto shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        }
                    >
                        <DropdownLink href={route('profile.edit')}>Profile</DropdownLink>
                        <DropdownLink href={route('logout')} method="post" as="button">
                            Log Out
                        </DropdownLink>
                    </Dropdown>
                </div>
                <div className="h-1 bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500 opacity-60" />
            </div>
        </aside>
    );
}
