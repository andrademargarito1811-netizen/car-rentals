import { useEffect, ReactNode } from 'react';

interface SlidePanelProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

export default function SlidePanel({ show, onClose, title, children, footer }: SlidePanelProps) {
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [show]);

    useEffect(() => {
        const closeOnEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && show) {
                onClose();
            }
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [show, onClose]);

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/50 transition-all duration-300 ${
                    show ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-xl bg-white dark:bg-brand-900 shadow-2xl transform transition-all duration-300 ease-out ${
                    show ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <h2 className="text-lg font-bold text-surface-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            <svg className="w-5 h-5 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {children}
                    </div>
                    {footer && (
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
