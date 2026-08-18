import { formatPrice } from './useSwapQuote';

interface ComparisonTax {
    tax_desc: string;
    amount: number;
    add_or_minus: boolean;
}

interface SwapComparisonProps {
    fromSubtotal: number;
    toSubtotal: number;
    oldTotal: number;
    newTotal: number;
    priceDelta: number;
    taxes: ComparisonTax[];
    fromLabel: string;
    toLabel: string;
}

function taxTotal(taxes: ComparisonTax[]): number {
    return taxes.reduce((sum, t) => sum + (t.add_or_minus ? Number(t.amount) : -Number(t.amount)), 0);
}

export default function SwapPriceComparison({
    fromSubtotal,
    toSubtotal,
    oldTotal,
    newTotal,
    priceDelta,
    taxes,
    fromLabel,
    toLabel,
}: SwapComparisonProps) {
    const afterRental = Number(fromSubtotal) + Number(toSubtotal);
    const afterTax = taxTotal(taxes);
    const beforeTax = Number(oldTotal) - Number(fromSubtotal);

    const Row = ({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) => (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-semibold tabular-nums ${accent ? 'text-accent-600 dark:text-accent-400' : 'text-foreground'}`}>
                {formatPrice(value)}
            </span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Before Swap</p>
                <div className="space-y-1.5">
                    <Row label={`${fromLabel} rental`} value={fromSubtotal} />
                    <Row label="Taxes & fees" value={beforeTax} />
                    <div className="flex items-center justify-between text-sm pt-1.5 border-t border-border">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-extrabold text-foreground tabular-nums">{formatPrice(oldTotal)}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-accent-200 bg-accent-50/40 p-4 dark:border-accent-800/60 dark:bg-accent-900/20">
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent-500 dark:text-accent-400 mb-2">After Swap</p>
                <div className="space-y-1.5">
                    <Row label={`${fromLabel} rental (unchanged)`} value={fromSubtotal} />
                    <Row label={`${toLabel} upgrade (${afterRental - Number(fromSubtotal) < 0 ? 'credit' : 'delta'})`} value={toSubtotal} accent />
                    <Row label="Taxes & fees" value={afterTax} />
                    <div className="flex items-center justify-between text-sm pt-1.5 border-t border-accent-200/80 dark:border-accent-800/60">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-extrabold text-accent-600 dark:text-accent-400 tabular-nums">{formatPrice(newTotal)}</span>
                    </div>
                </div>
            </div>

            <div className={`sm:col-span-2 flex items-center justify-between rounded-xl px-4 py-2.5 ${
                priceDelta > 0
                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'
                    : priceDelta < 0
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
                        : 'bg-muted/40 text-muted-foreground'
            }`}>
                <span className="text-sm font-semibold">
                    {priceDelta > 0 ? 'Additional amount due' : priceDelta < 0 ? 'Amount credited to balance' : 'No price change'}
                </span>
                <span className="text-base font-extrabold tabular-nums">
                    {priceDelta < 0 ? '-' : priceDelta > 0 ? '+' : ''}{formatPrice(Math.abs(priceDelta))}
                </span>
            </div>

            <p className="sm:col-span-2 text-[11px] text-muted-foreground -mt-1">
                Your original rental is unchanged. Only the daily-rate difference on the new vehicle applies from the swap time onward.
            </p>
        </div>
    );
}
