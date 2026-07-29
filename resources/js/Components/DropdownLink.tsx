import { Link } from '@inertiajs/react';
import type { Method } from '@inertiajs/core';
import type { ElementType } from 'react';

interface DropdownLinkProps {
    href: string;
    children: React.ReactNode;
    method?: Method;
    as?: ElementType;
}

export default function DropdownLink({ href, children, method, as: asProp }: DropdownLinkProps) {
    return (
        <Link
            href={href}
            method={method}
            as={asProp}
            className="block w-full px-4 py-2 text-start text-sm leading-5 text-surface-700 dark:text-surface-300 transition duration-150 ease-in-out hover:bg-surface-100 dark:hover:bg-surface-700 focus:bg-surface-100 dark:focus:bg-surface-700 focus:outline-none"
        >
            {children}
        </Link>
    );
}