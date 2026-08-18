import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
    SheetClose,
} from '@/Components/ui/sheet';
import { Check, DollarSign, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { PAYMENT_METHODS, PaymentItem, formatPrice, paymentTypeLabel, sortPaymentsNewest } from './PaymentItem';
import { type AdminBooking, type BookingPayment } from './types';

interface RecordPaymentSheetProps {
    booking: AdminBooking;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEditPayment: (payment: BookingPayment) => void;
    hideTrigger?: boolean;
}

type PaymentType = 'downpayment' | 'remaining' | 'full_payment' | 'refund';

const TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
    { value: 'downpayment', label: 'Down Payment' },
    { value: 'remaining', label: 'Remaining' },
    { value: 'full_payment', label: 'Full Payment' },
];

export default function RecordPaymentSheet({ booking, open, onOpenChange, onEditPayment, hideTrigger = false }: RecordPaymentSheetProps) {
    const route = useRoute();
    const paymentForm = useForm({ amount: '', payment_method: 'Cash', transaction_id: '', type: 'remaining' });

    const totalAmount = Number(booking.total_amount) || 0;
    const totalPaid = (booking.payments ?? []).filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = totalAmount - totalPaid;
    const hasRefund = (booking.payments ?? []).some(p => p.payment_status === 'completed' && p.type === 'refund');
    const isFullyRefunded = hasRefund && totalPaid <= 0;
    const hasRefundable = (booking.payments ?? []).some(p => p.payment_status === 'completed' && p.type !== 'refund');
    const maxRefundable = (booking.payments ?? []).filter(p => p.payment_status === 'completed' && p.type !== 'refund').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    useEffect(() => {
        if (!open) {
            paymentForm.reset();
            return;
        }
        const type: PaymentType = remainingBalance <= 0 ? 'refund' : 'remaining';
        paymentForm.setData({
            amount: type === 'refund' && maxRefundable > 0 ? String(maxRefundable) : '',
            payment_method: 'Cash',
            transaction_id: '',
            type,
        });
    }, [open]);

    function recordPayment(e: React.FormEvent) {
        e.preventDefault();
        const amount = paymentForm.data.amount;
        const type = paymentForm.data.type;
        paymentForm.post(route('admin.bookings.payments.store', booking.id), {
            preserveScroll: true,
            onSuccess: () => {
                paymentForm.reset();
                onOpenChange(false);
                toast.success(type === 'refund' ? 'Refund recorded' : 'Payment recorded', { description: `${paymentTypeLabel(type)} of ${formatPrice(Number(amount) || 0)}` });
            },
        });
    }

    const typeOptions = hasRefundable ? [...TYPE_OPTIONS, { value: 'refund' as PaymentType, label: 'Refund' }] : TYPE_OPTIONS;

    return isFullyRefunded ? (
        <Button variant="outline" className="w-full" disabled>
            <Undo2 className="w-4 h-4 mr-1.5 text-purple-500" />
            Fully Refunded
        </Button>
    ) : remainingBalance <= 0 && !hasRefundable ? (
        <Button variant="outline" className="w-full" disabled>
            <Check className="w-4 h-4 mr-1.5 text-emerald-500" />
            Fully Paid
        </Button>
    ) : (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {!hideTrigger && (
                <SheetTrigger asChild>
                    <Button variant={remainingBalance <= 0 ? 'outline' : 'default'} className="w-full">
                        {remainingBalance <= 0 ? <Undo2 className="w-4 h-4 mr-1.5" /> : <DollarSign className="w-4 h-4 mr-1.5" />}
                        {remainingBalance <= 0 ? 'Refund' : 'Record Payment'}
                    </Button>
                </SheetTrigger>
            )}
            <SheetContent side="right" className="sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle>{paymentForm.data.type === 'refund' ? 'Record Refund' : 'Record Payment'}</SheetTitle>
                    <SheetDescription>
                        Total: {formatPrice(totalAmount)} &middot; Paid: {formatPrice(totalPaid)} &middot; Remaining: {formatPrice(remainingBalance)}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Payment progress</span>
                        <span>{totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${totalAmount > 0 ? Math.min((totalPaid / totalAmount) * 100, 100) : 0}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Paid: {formatPrice(totalPaid)}</span>
                        <span>Remaining: {formatPrice(remainingBalance)}</span>
                    </div>
                </div>

                <form
                    onSubmit={recordPayment}
                    onKeyDown={e => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            recordPayment(e as any);
                        }
                    }}
                    className="space-y-4 mt-5 flex-1 flex flex-col"
                >
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">Type</Label>
                        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
                            {typeOptions.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    paymentForm.setData('type', opt.value);
                                    paymentForm.setData('transaction_id', '');
                                    if (opt.value === 'remaining') paymentForm.setData('amount', String(remainingBalance > 0 ? remainingBalance : ''));
                                    else if (opt.value === 'full_payment') paymentForm.setData('amount', String(totalAmount));
                                    else if (opt.value === 'refund') paymentForm.setData('amount', String(maxRefundable > 0 ? maxRefundable : ''));
                                    else paymentForm.setData('amount', '');
                                }}
                                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                    paymentForm.data.type === opt.value
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">Amount</Label>
                        <div className="flex gap-1.5 mb-2 flex-wrap">
                            {paymentForm.data.type === 'remaining' && remainingBalance > 0 && (
                                <button
                                    type="button"
                                    onClick={() => paymentForm.setData('amount', String(remainingBalance))}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                        Number(paymentForm.data.amount) === remainingBalance
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    Remaining {formatPrice(remainingBalance)}
                                </button>
                            )}
                            {paymentForm.data.type === 'full_payment' && (
                                <button
                                    type="button"
                                    onClick={() => paymentForm.setData('amount', String(totalAmount))}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                        Number(paymentForm.data.amount) === totalAmount
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    Total {formatPrice(totalAmount)}
                                </button>
                            )}
                            {paymentForm.data.type === 'downpayment' && (
                                [0.25, 0.5, 0.75].map(fraction => {
                                    const val = totalAmount * fraction;
                                    return (
                                        <button
                                            key={fraction}
                                            type="button"
                                            onClick={() => paymentForm.setData('amount', String(val))}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                                Number(paymentForm.data.amount) === val
                                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {Math.round(fraction * 100)}% ({formatPrice(val)})
                                        </button>
                                    );
                                })
                            )}
                            {paymentForm.data.type === 'refund' && (
                                <button
                                    type="button"
                                    onClick={() => paymentForm.setData('amount', String(maxRefundable))}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                        Number(paymentForm.data.amount) === maxRefundable
                                            ? 'bg-red-600/10 border-red-600/30 text-red-600'
                                            : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    Max refundable {formatPrice(maxRefundable)}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground text-sm">$</span>
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={paymentForm.data.amount}
                                onChange={e => paymentForm.setData('amount', e.target.value)}
                                placeholder="0.00"
                                className="pl-7"
                            />
                        </div>
                        {paymentForm.errors.amount && (
                            <p className="mt-1 text-xs text-destructive">{paymentForm.errors.amount}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">Method</Label>
                        <Select
                            value={paymentForm.data.payment_method}
                            onValueChange={v => paymentForm.setData('payment_method', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">
                            Transaction ID <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Input
                            type="text"
                            value={paymentForm.data.transaction_id}
                            onChange={e => paymentForm.setData('transaction_id', e.target.value)}
                            placeholder="e.g. TXN-12345"
                            className="mt-1.5"
                        />
                    </div>

                    {booking.payments && booking.payments.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Recent payments</p>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                                {sortPaymentsNewest(booking.payments).slice(0, 3).map(p => (
                                    <PaymentItem
                                        key={p.id}
                                        payment={p}
                                        showDate
                                        onEdit={remainingBalance > 0 || (p.type === 'refund' && !isFullyRefunded) ? () => onEditPayment(p) : undefined}
                                        className="p-2 rounded-md bg-muted/30 border"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2 mt-auto">
                        <SheetClose asChild>
                            <Button type="button" variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </SheetClose>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={paymentForm.processing}
                        >
                            {paymentForm.processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
