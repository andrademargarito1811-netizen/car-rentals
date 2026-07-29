import { Link } from '@inertiajs/react';

interface NavLinkProps {
    href: string;
    active?: boolean;
    children: React.ReactNode;
}

export default function NavLink({ href, active, children }: NavLinkProps) {
    const classes = active
        ? 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-brand-800 bg-brand-50 rounded-lg transition-colors duration-200'
        : 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-surface-500 rounded-lg hover:text-brand-800 hover:bg-brand-50 transition-colors duration-200 group';

    return (
        <Link href={href} className={classes}>
            {children}
            {!active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent-500 rounded-full transition-all duration-300 group-hover:w-4/5" />}
        </Link>
    );
}
