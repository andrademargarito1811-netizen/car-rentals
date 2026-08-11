import { PenLine } from 'lucide-react';
import { type BookingPayment } from './types';

export const PAYMENT_METHODS = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Online', label: 'Online' },
    { value: 'Others', label: 'Others' },
];

export function paymentMethodLabel(method: string | null | undefined): string {
    if (!method) return '—';
    const m = method.toLowerCase().replace(/[\s_-]+/g, '');
    const map: Record<string, string> = {
        cash: 'Cash',
        card: 'Card',
        creditcard: 'Card',
        banktransfer: 'Bank Transfer',
        online: 'Online',
        other: 'Others',
        others: 'Others',
        stripe: 'Online',
        manual: 'Manual',
    };
    return map[m] ?? method;
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export function paymentTypeLabel(type: string): string {
    const labels: Record<string, string> = { downpayment: 'Down Payment', remaining: 'Remaining', full_payment: 'Full Payment', refund: 'Refund' };
    return labels[type] ?? type;
}

export function sortPaymentsNewest(payments: BookingPayment[]): BookingPayment[] {
    return [...payments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function PaymentItem({
    payment,
    showDate,
    onEdit,
    className = '',
}: {
    payment: BookingPayment;
    showDate?: boolean;
    onEdit?: (payment: BookingPayment) => void;
    className?: string;
}) {
    const isRefund = payment.type === 'refund';
    return (
        <div className={`flex items-center justify-between text-xs ${className}`}>
            <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRefund ? 'bg-red-400' : payment.payment_status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-muted-foreground truncate">{paymentTypeLabel(payment.type)}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`font-medium ${isRefund ? 'text-red-600' : 'text-foreground'}`}>{formatPrice(payment.amount)}</span>
                {showDate && (
                    <span className="text-muted-foreground/60">{new Date(payment.created_at).toLocaleDateString()}</span>
                )}
                {onEdit && (
                    <button
                        type="button"
                        onClick={() => onEdit(payment)}
                        className="text-muted-foreground/40 hover:text-foreground transition-colors"
                        title="Edit payment"
                    >
                        <PenLine className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
