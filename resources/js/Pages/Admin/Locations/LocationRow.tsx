import { AdminLocation } from '@/types/models';

interface LocationRowProps {
    location: AdminLocation;
    onEdit: (loc: AdminLocation) => void;
    onDelete: (loc: AdminLocation) => void;
}

export default function LocationRow({ location, onEdit, onDelete }: LocationRowProps) {
    const imageUrl = location.image
        ? (location.image.startsWith('http') ? location.image : '/storage/' + location.image)
        : null;

    return (
        <div className="group relative bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            {imageUrl && (
                <div className="aspect-[16/7] overflow-hidden bg-surface-100 dark:bg-surface-700">
                    <img
                        src={imageUrl}
                        alt={location.location}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            )}
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-surface-900 dark:text-white truncate">
                                {location.location}
                            </h3>
                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${location.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {location.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        {location.subtitle && (
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">{location.subtitle}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onEdit(location)}
                            className="p-2 text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => onDelete(location)}
                            className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                <div className="mt-3 space-y-1.5">
                    {location.city && (
                        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                            <svg className="w-4 h-4 shrink-0 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span>{location.city}</span>
                        </div>
                    )}
                    {location.address && (
                        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                            <svg className="w-4 h-4 shrink-0 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span className="truncate">{location.address}</span>
                        </div>
                    )}
                    {location.phone && (
                        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                            <svg className="w-4 h-4 shrink-0 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>{location.phone}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
