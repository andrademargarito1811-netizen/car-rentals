import { Link } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="flex items-center gap-1.5 text-xs font-medium mb-4">
            <Link
                href={route('admin.dashboard')}
                className="flex items-center gap-1 text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
            >
                <Home className="w-3.5 h-3.5" />
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-surface-300 dark:text-surface-600" />
                    {item.href ? (
                        <Link
                            href={route(item.href)}
                            className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-surface-900 dark:text-white font-semibold">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
