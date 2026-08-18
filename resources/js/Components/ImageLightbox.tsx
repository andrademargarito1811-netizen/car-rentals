import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
    src: string;
    alt: string;
    open: boolean;
    onClose: () => void;
}

export default function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Close image"
            >
                <X className="w-5 h-5" />
            </button>
            <img
                src={src}
                alt={alt}
                onClick={e => e.stopPropagation()}
                className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
        </div>
    );
}
