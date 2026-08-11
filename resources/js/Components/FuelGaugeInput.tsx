export const FUEL_MAX_BARS = 8;

interface FuelGaugeInputProps {
    value: string;
    onChange: (value: string) => void;
}

export default function FuelGaugeInput({ value, onChange }: FuelGaugeInputProps) {
    const num = Number(value);
    const bars = isNaN(num) ? 0 : Math.max(0, Math.min(FUEL_MAX_BARS, Math.round(num)));

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onChange('0')}
                    title="Empty / reserve"
                    aria-label="Empty / reserve"
                    className={`flex h-9 w-8 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold transition-colors ${
                        bars === 0
                            ? 'border-destructive bg-destructive/10 text-destructive'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                >
                    E
                </button>
                {Array.from({ length: FUEL_MAX_BARS }, (_, i) => {
                    const n = i + 1;
                    const filled = n <= bars;
                    return (
                        <button
                            key={n}
                            type="button"
                            onClick={() => onChange(String(n))}
                            title={`${n} of ${FUEL_MAX_BARS} bars`}
                            aria-label={`${n} of ${FUEL_MAX_BARS} bars`}
                            className={`h-9 flex-1 rounded-md border transition-colors ${
                                filled
                                    ? n <= Math.ceil(FUEL_MAX_BARS / 2)
                                        ? 'border-emerald-500/40 bg-emerald-500'
                                        : 'border-amber-400/50 bg-amber-400'
                                    : 'border-border bg-background hover:bg-muted'
                            }`}
                        />
                    );
                })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Empty</span>
                <span className="font-bold text-foreground tabular-nums">
                    {bars}/{FUEL_MAX_BARS} bars
                </span>
                <span>Full</span>
            </div>
        </div>
    );
}
