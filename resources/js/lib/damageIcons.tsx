// Distinct icons for each damage type. Paths are 24x24 stroke-based so they can
// be rendered either as a React component or as raw <path> data inside an SVG
// diagram (for the blueprint markers).

export const DAMAGE_ICON_PATHS: Record<string, string> = {
    scratch: 'M4 7l4 3 3-4 4 4 5-3',
    dent: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10.5 9.5c2 1.7 4.5 1.6 6.5.6',
    crack: 'M7 18l5-6 1-5M12 12l4 6M12 12l-4-2',
    chip: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
    stain: 'M13.5 3.5c4.5 1.2 6.5 4.5 5.3 8.2-1.2 3.6-4.7 6.3-8.5 5.6C6.6 16.6 4.8 14 5.4 11 6 8.2 9 7 10.8 5.4 11.8 4.4 12.5 3.9 13.5 3.5z',
    torn: 'M5 6h3l2 2h4l2-2h3v12h-3l-2-2h-4l-2 2H5z',
    other: 'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4',
};

export const DAMAGE_ICON_FILLED: Record<string, boolean> = {
    stain: true,
};

export interface DamageIconDef {
    d: string;
    filled?: boolean;
}

export function damageIconFor(type: string): DamageIconDef {
    return { d: DAMAGE_ICON_PATHS[type] ?? DAMAGE_ICON_PATHS.other, filled: DAMAGE_ICON_FILLED[type] };
}

export function DamageIcon({ type, className, style }: { type: string; className?: string; style?: React.CSSProperties }) {
    const icon = damageIconFor(type);
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            style={style}
            fill={icon.filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={icon.d} />
        </svg>
    );
}
