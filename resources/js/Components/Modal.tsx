import { useEffect, useRef, useState, ReactNode } from 'react';

interface ModalProps {
    show?: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    onClose?: () => void;
    children: ReactNode;
}

export default function Modal({
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
    children,
}: ModalProps) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [showSlot, setShowSlot] = useState(show);

    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
            setShowSlot(true);
            dialog.current?.showModal();
        } else {
            document.body.style.overflow = '';
            setTimeout(() => {
                dialog.current?.close();
                setShowSlot(false);
            }, 200);
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [show]);

    useEffect(() => {
        const closeOnEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (show && closeable) {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [show, closeable, onClose]);

    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    return (
        <dialog
            className="z-50 m-0 min-h-full min-w-full overflow-y-auto bg-transparent backdrop:bg-transparent"
            ref={dialog}
        >
            <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
                <div
                    className={`fixed inset-0 transform transition-all ease-out duration-300 ${
                        show ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={close}
                >
                    <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900" />
                </div>

                <div
                    className={`mb-6 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full dark:bg-gray-800 ease-out duration-300 ${
                        show
                            ? 'opacity-100 translate-y-0 sm:scale-100'
                            : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
                    } ${maxWidthClass}`}
                >
                    {showSlot && children}
                </div>
            </div>
        </dialog>
    );
}
