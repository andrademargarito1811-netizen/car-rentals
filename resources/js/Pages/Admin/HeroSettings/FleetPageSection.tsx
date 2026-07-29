import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FleetPageSectionProps {
    savedImagePath: string | null;
    onFileChange: (file: File | null) => void;
    error?: string | null;
}

export default function FleetPageSection({ savedImagePath, onFileChange, error }: FleetPageSectionProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=800&fit=crop';

    const displaySrc = preview || savedImagePath || FALLBACK_IMAGE;

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setFileError('Image size must not exceed 5MB.');
            return;
        }
        setFileError(null);
        onFileChange(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function handleRemove() {
        setPreview(null);
        onFileChange(null);
        if (inputRef.current) inputRef.current.value = '';
    }

    useEffect(() => {
        if (!preview && !savedImagePath) {
            setPreview(null);
        }
    }, [savedImagePath]);

    return (
        <div className="group/card relative overflow-hidden bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-400/5 rounded-full blur-3xl group-hover/card:bg-accent-400/5 transition-colors duration-700" />
            <div className="relative px-6 sm:px-8 py-4 border-b border-surface-100 dark:border-surface-700/60">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-surface-900 dark:text-white">Fleet Page Background</h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Set the hero background image for the fleet listing page.</p>
                    </div>
                </div>
            </div>
            <div className="relative p-6 sm:p-8">
                <div className="space-y-5 max-w-2xl">
                    <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-brand-900 ring-1 ring-surface-200 dark:ring-surface-700">
                        <img
                            src={displaySrc}
                            alt="Fleet page hero background"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-900/50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="relative z-10 p-5 h-full flex flex-col justify-center">
                            <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                                Browse <span className="text-accent-400">Our Fleet</span>
                            </h3>
                            <p className="text-surface-400 text-xs sm:text-sm mt-1.5 max-w-xs leading-relaxed">
                                Find your perfect drive — search, compare, and book the car that fits your journey.
                            </p>
                        </div>
                        {(preview || savedImagePath) && (
                            <span className={cn(
                                'absolute top-2 right-2 z-20 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider backdrop-blur-md',
                                preview ? 'bg-accent-400/20 text-accent-300 ring-1 ring-accent-400/30' : 'bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30'
                            )}>
                                {preview ? 'Unsaved' : 'Saved'}
                            </span>
                        )}
                    </div>

                    {(error || fileError) && (
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{fileError || error}</p>
                        </div>
                    )}
                    <div className="flex items-stretch gap-3">
                        <label className={cn(
                            'relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer group flex-1',
                            preview
                                ? 'border-accent-400/50 bg-accent-400/5'
                                : 'border-surface-300 dark:border-surface-600 hover:border-brand-400 dark:hover:border-brand-500'
                        )}>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFile}
                                className="sr-only"
                            />
                            <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/50 transition-colors">
                                <svg className="w-5 h-5 text-surface-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                    {preview ? 'Replace image' : 'Upload image'}
                                </span>
                                <p className="text-[11px] text-surface-500 dark:text-surface-400">Recommended: 1920×800px</p>
                            </div>
                        </label>

                        {(preview || savedImagePath) && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="px-4 py-3 rounded-xl border-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-xs font-bold flex items-center gap-2 shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Remove
                            </button>
                        )}
                    </div>

                    <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/60 px-4 py-3">
                        <div className="flex items-start gap-2.5">
                            <svg className="w-4 h-4 text-surface-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0 0V8m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                            </svg>
                            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                                If no image is uploaded, the fleet page will show a default background. Changes are applied after saving.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
