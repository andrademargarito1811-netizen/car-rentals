import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageDropzoneProps {
    imagePreview: string | null;
    onImageChange: (file: File | null) => void;
    onPreviewChange: (preview: string | null) => void;
}

export default function ImageDropzone({ imagePreview, onImageChange, onPreviewChange }: ImageDropzoneProps) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) return;
        onImageChange(file);
        const reader = new FileReader();
        reader.onload = () => onPreviewChange(reader.result as string);
        reader.readAsDataURL(file);
    }, [onImageChange, onPreviewChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragging(false), []);

    function removeImage() {
        onImageChange(null);
        onPreviewChange(null);
        if (inputRef.current) inputRef.current.value = '';
    }

    return (
        <div>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200',
                    dragging
                        ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/20'
                        : 'border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 hover:border-surface-300 dark:hover:border-surface-500',
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                    className="hidden"
                />
                {imagePreview ? (
                    <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg object-contain mx-auto" />
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); removeImage(); }}
                            className="absolute -top-2.5 -right-2.5 p-0.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-surface-400">
                        <div className="p-3 rounded-full bg-surface-100 dark:bg-surface-600">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-surface-600 dark:text-surface-300">
                                Drop an image here or click to browse
                            </p>
                            <p className="text-xs text-surface-400">
                                PNG, JPG or WebP up to 5MB
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
