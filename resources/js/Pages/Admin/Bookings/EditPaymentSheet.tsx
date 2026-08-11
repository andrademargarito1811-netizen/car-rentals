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
    SheetClose,
} from '@/Components/ui/sheet';
import { toast } from 'sonner';
import { PAYMENT_METHODS, formatPrice, paymentTypeLabel } from './PaymentItem';
import { type AdminBooking, type BookingPayment } from './types';

interface EditPaymentSheetProps {
    booking: AdminBooking;
    editingPayment: BookingPayment | null;
    onOpenChange: (open: boolean) => void;
}

export default function EditPaymentSheet({ booking, editingPayment, onOpenChange }: EditPaymentSheetProps) {
    const route = useRoute();
    const editPaymentForm = useForm({ amount: '', payment_method: 'Cash', transaction_id: '' });

    const totalAmount = Number(booking.total_amount) || 0;
    const totalPaid = (booking.payments ?? []).filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = totalAmount - totalPaid;
    const hasRefund = (booking.payments ?? []).some(p => p.payment_status === 'completed' && p.type === 'refund');
    const isFullyRefunded = hasRefund && totalPaid <= 0;

    const refundable = (booking.payments ?? [])
        .filter(p => p.payment_status === 'completed' && p.type !== 'refund')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const otherRefunds = editingPayment?.type === 'refund'
        ? (booking.payments ?? [])
            .filter(p => p.payment_status === 'completed' && p.type === 'refund' && p.id !== editingPayment.id)
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        : 0;
    const maxRefundAbs = Math.max(0, refundable + otherRefunds);
    const refundLocked = isFullyRefunded && editingPayment?.type === 'refund';

    useEffect(() => {
        if (!editingPayment) return;
        editPaymentForm.setData({
            amount: String(editingPayment.amount),
            payment_method: editingPayment.payment_method,
            transaction_id: editingPayment.transaction_id ?? '',
        });
    }, [editingPayment]);

    function updatePayment(e: React.FormEvent) {
        e.preventDefault();
        if (!editingPayment) return;
        editPaymentForm.patch(route('admin.bookings.payments.update', [booking.id, editingPayment.id]), {
            preserveScroll: true,
            onSuccess: () => {
                editPaymentForm.reset();
                onOpenChange(false);
                toast.success('Payment updated');
            },
        });
    }

    return (
        <Sheet open={!!editingPayment} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle>Edit Payment</SheetTitle>
                    <SheetDescription>
                        {editingPayment && (
                            <>{paymentTypeLabel(editingPayment.type)} &middot; Current: {formatPrice(editingPayment.amount)}</>
                        )}
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={updatePayment}
                    onKeyDown={e => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            updatePayment(e as any);
                        }
                    }}
                    className="space-y-4 mt-5 flex-1 flex flex-col"
                >
                    <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Remaining Balance</span>
                            {isFullyRefunded ? (
                                <span className="font-bold text-purple-600">Fully Refunded</span>
                            ) : (
                                <span className={`font-bold ${remainingBalance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                                    {formatPrice(remainingBalance)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>Total: {formatPrice(totalAmount)}</span>
                            <span>Paid: {formatPrice(totalPaid)}</span>
                        </div>
                        {editingPayment && (
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                                Editing <strong>{paymentTypeLabel(editingPayment.type)}</strong> &mdash; current: {formatPrice(editingPayment.amount)}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">Amount</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground text-sm">$</span>
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                min={editingPayment?.type === 'refund' ? `-${maxRefundAbs.toFixed(2)}` : '0.01'}
                                value={editPaymentForm.data.amount}
                                onChange={e => editPaymentForm.setData('amount', e.target.value)}
                                placeholder="0.00"
                                className="pl-7"
                            />
                        </div>
                        {editPaymentForm.errors.amount && (
                            <p className="mt-1 text-xs text-destructive">{editPaymentForm.errors.amount}</p>
                        )}
                        {refundLocked ? (
                            <p className="mt-1 text-[11px] text-destructive">
                                This booking has been fully refunded. Refund amounts can no longer be edited.
                            </p>
                        ) : editingPayment?.type === 'refund' ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Refund amounts are stored as negative values (e.g. -100.00). Maximum refundable: {formatPrice(maxRefundAbs)}.
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">Method</Label>
                        <Select
                            value={editPaymentForm.data.payment_method}
                            onValueChange={v => editPaymentForm.setData('payment_method', v)}
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
                            value={editPaymentForm.data.transaction_id}
                            onChange={e => editPaymentForm.setData('transaction_id', e.target.value)}
                            placeholder="e.g. TXN-12345"
                            className="mt-1.5"
                        />
                    </div>

                    <div className="flex gap-2 pt-2 mt-auto">
                        <SheetClose asChild>
                            <Button type="button" variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </SheetClose>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={refundLocked || editPaymentForm.processing}
                        >
                            {refundLocked ? 'Locked' : editPaymentForm.processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
