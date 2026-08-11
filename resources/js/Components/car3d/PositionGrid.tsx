import type { DamagePosition } from '@/lib/carZones';

interface PositionGridProps {
    selected: DamagePosition | null;
    onSelect: (position: DamagePosition) => void;
    existingPositions?: DamagePosition[];
    disabled?: boolean;
}

const GRID: DamagePosition[] = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'middle-center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right',
];

const GRID_LABELS: Record<DamagePosition, string> = {
    'top-left': 'TL',
    'top-center': 'TC',
    'top-right': 'TR',
    'middle-left': 'ML',
    'middle-center': 'C',
    'middle-right': 'MR',
    'bottom-left': 'BL',
    'bottom-center': 'BC',
    'bottom-right': 'BR',
};

export default function PositionGrid({ selected, onSelect, existingPositions = [], disabled = false }: PositionGridProps) {
    return (
        <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Position within panel
            </p>
            <div className="inline-grid grid-cols-3 gap-1 p-1.5 rounded-lg border bg-background">
                {GRID.map((pos) => {
                    const isSelected = selected === pos;
                    const hasExisting = existingPositions.includes(pos);
                    return (
                        <button
                            key={pos}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(pos)}
                            title={pos.replace('-', ' ')}
                            className={`
                                relative w-8 h-8 rounded-md text-[9px] font-bold transition-all duration-150
                                ${isSelected
                                    ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                                    : hasExisting
                                        ? 'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {GRID_LABELS[pos]}
                            {hasExisting && !isSelected && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Selected
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive" /> Existing
                </span>
            </div>
        </div>
    );
}
