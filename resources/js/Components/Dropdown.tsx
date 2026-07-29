import { useState, useEffect, useRef, ReactNode } from 'react';

interface DropdownProps {
    align?: 'left' | 'right';
    width?: '48';
    contentClasses?: string;
    trigger: ReactNode;
    children: ReactNode;
    up?: boolean;
}

export default function Dropdown({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white dark:bg-brand-800',
    trigger,
    children,
    up = false,
}: DropdownProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeOnEscape = (e: KeyboardEvent) => {
            if (open && e.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [open]);

    const widthClass = {
        48: 'w-48',
    }[width];

    const origin = up ? 'bottom' : 'top';
    const alignmentClasses =
        align === 'left'
            ? `ltr:origin-${origin}-left rtl:origin-${origin}-right start-0`
            : align === 'right'
              ? `ltr:origin-${origin}-right rtl:origin-${origin}-left end-0`
              : `origin-${origin}`;

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setOpen(!open)}>{trigger}</div>

            {open && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                className={`absolute z-50 ${up ? 'bottom-full mb-2' : 'mt-2'} rounded-md shadow-lg ${widthClass} ${alignmentClasses} transition ease-out duration-200 ${
                    open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                style={{ display: open ? '' : 'none' }}
                onClick={() => setOpen(false)}
            >
                <div className={`rounded-md ring-1 ring-black ring-opacity-5 ${contentClasses}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
