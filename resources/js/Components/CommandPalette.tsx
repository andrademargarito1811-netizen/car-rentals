import { useEffect, useState, useCallback, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, LayoutDashboard, Truck, Calendar, FileText, Tag, Percent, Image, Layout, CircleHelp, CalendarRange, MapPin, Mail, MessageCircle, Users, Car, Command } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    section: string;
    group?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Truck, Calendar, FileText, Tag, Percent, Image,
    Layout, CircleHelp, CalendarRange, MapPin, Mail, MessageCircle, Users, Car,
};

const navItems: NavItem[] = [
    { section: 'Main', label: 'Dashboard', href: 'dashboard', icon: 'LayoutDashboard' },
    { section: 'Main', label: 'Vehicle', href: 'admin.cars.index', icon: 'Truck' },
    { section: 'Main', label: 'Booking Schedule', href: 'admin.cars.schedule', icon: 'Calendar' },
    { section: 'Main', label: 'Reservation', href: 'admin.reservations.index', icon: 'FileText' },
    { section: 'Main', label: 'Live Chat', href: 'admin.chats.index', icon: 'MessageCircle' },
    { section: 'Management', label: 'Account Management', href: 'admin.users.index', icon: 'Users', group: 'Commerce' },
    { section: 'Management', label: 'Coupon Discount', href: 'admin.coupons.index', icon: 'Tag', group: 'Commerce' },
    { section: 'Management', label: 'Tax & Surcharges', href: 'admin.tax.index', icon: 'Percent', group: 'Commerce' },
    { section: 'Management', label: 'Vehicle Classes', href: 'admin.vehicle-classes.index', icon: 'Car', group: 'Settings' },
    { section: 'Management', label: 'Hero Settings', href: 'admin.hero-settings', icon: 'Image', group: 'Settings' },
    { section: 'Management', label: 'Footer Settings', href: 'admin.footer-settings', icon: 'Layout', group: 'Settings' },
    { section: 'Management', label: 'FAQ Management', href: 'admin.faqs.index', icon: 'CircleHelp', group: 'Settings' },
    { section: 'Management', label: 'Reservation Settings', href: 'admin.reservation-settings', icon: 'CalendarRange', group: 'Settings' },
    { section: 'Management', label: 'Locations Settings', href: 'admin.locations.index', icon: 'MapPin', group: 'Settings' },
    { section: 'Management', label: 'Contact Messages', href: 'admin.contact-messages.index', icon: 'Mail', group: 'Support' },
];

export default function CommandPalette() {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'admin';
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = navItems.filter(item => {
        if ('admin' in item && item.admin && !isAdmin) return false;
        const q = query.toLowerCase();
        return !q || item.label.toLowerCase().includes(q) || item.section.toLowerCase().includes(q) || (item.group && item.group.toLowerCase().includes(q));
    });

    const navigate = useCallback((href: string) => {
        setOpen(false);
        setQuery('');
        router.visit(route(href));
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [open]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && filtered[selectedIndex]) {
            navigate(filtered[selectedIndex].href);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className="fixed left-1/2 top-[15%] z-[61] w-full max-w-lg -translate-x-1/2 rounded-2xl bg-white dark:bg-brand-800 border border-surface-200 dark:border-surface-700 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=closed]:slide-out-to-top-[8%] data-[state=open]:slide-in-from-top-[8%] duration-200"
                    onKeyDown={handleKeyDown}
                >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                        <Search className="w-5 h-5 text-surface-400 dark:text-surface-500 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search pages..."
                            className="flex-1 bg-transparent text-sm text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 outline-none"
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-700 rounded-md">
                            <Command className="w-3 h-3" />
                            K
                        </kbd>
                    </div>
                    <div className="max-h-80 overflow-y-auto py-2 px-2">
                        {filtered.length === 0 ? (
                            <div className="py-8 text-center text-sm text-surface-400 dark:text-surface-500">
                                No results found for "{query}"
                            </div>
                        ) : (
                            filtered.map((item, i) => {
                                const Icon = iconMap[item.icon];
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => navigate(item.href)}
                                        onMouseEnter={() => setSelectedIndex(i)}
                                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                            i === selectedIndex
                                                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200'
                                                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/40'
                                        }`}
                                    >
                                        {Icon && <Icon className="w-4 h-4 shrink-0" />}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate">{item.label}</span>
                                            <span className="text-[10px] text-surface-400 dark:text-surface-500 shrink-0">{item.section}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2.5 border-t border-surface-100 dark:border-surface-700 text-[10px] text-surface-400 dark:text-surface-500">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-[9px] font-semibold">↑↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-[9px] font-semibold">↵</kbd>
                            Open
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-[9px] font-semibold">Esc</kbd>
                            Close
                        </span>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
