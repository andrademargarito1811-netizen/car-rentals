import { useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import Invoice, { type InvoiceSettings } from '@/Components/Invoice';
import { applyPrintStyles, generateInvoicePdf } from '@/lib/invoicePdf';
import { type VehicleDamage } from '@/lib/carZones';

interface InvoicePageProps {
    booking: {
        id: number;
        reference_code: string | null;
        start_date: string;
        end_date: string;
        pickup_time: string | null;
        return_time: string | null;
        total_amount: number;
        status: string;
        created_at: string;
        user: { id: number; name: string; email: string; phone: string | null; address: string | null } | null;
        guest: {
            guest_id: number;
            title: string | null;
            first_name: string;
            last_name: string;
            email: string;
            phone: string | null;
            address: string | null;
            address2: string | null;
            country: string | null;
            state: string | null;
            city: string | null;
            postal_code: string | null;
            company_name: string | null;
        } | null;
        car: {
            brand: string;
            model: string;
            year: number;
            license_plate: string;
            daily_rate: number;
            color: string | null;
            vin: string | null;
            stock_number: string | null;
            vehicle_type: string | null;
        };
        payments: { id: string; type: string; amount: number; payment_method: string; payment_status: string; transaction_id: string | null; created_at: string }[];
        booking_taxes: { tax_desc: string; amount: number; add_or_minus: boolean; tax: { rate: number; value_in: string; calculation: string } | null }[];
        coupon_usage: { code: string; discount_amount: number } | null;
        pickup_location: { location: string } | null;
        return_location: { location: string } | null;
        extra_charges: { id: number; name: string; amount: string; tax_amount: string; operator: string }[];
        handover_charges: { fuel_refuel: number; excess_mileage: number; excess_km: number; total: number } | null;
        pickup_handover: {
            fuel_level: number | null;
            odometer: number | null;
            notes: string | null;
            damages: VehicleDamage[] | null;
            captured_at: string | null;
        } | null;
        return_handover: {
            fuel_level: number | null;
            odometer: number | null;
            notes: string | null;
            damages: VehicleDamage[] | null;
            captured_at: string | null;
        } | null;
    };
    invoiceSettings?: InvoiceSettings | null;
    autoPrint?: boolean;
    invoiceTerms?: {
        title: string;
        subtitle?: string | null;
        content: string;
    } | null;
    invoiceTerms2?: {
        title: string;
        subtitle?: string | null;
        content: string;
    } | null;
    termsConditions?: {
        title: string;
        subtitle?: string | null;
        content: string;
    } | null;
    driver?: {
        driver_id: number;
        guest_id: number | null;
        first_name: string;
        last_name: string;
        birth_date: string | null;
        license_category: string | null;
        license_expiry: string | null;
        masked_license: string;
    } | null;
}

function waitForImages(timeoutMs = 5000): Promise<void> {
    const imgs = Array.from(document.images);
    const pending = imgs.filter(img => !img.complete);
    if (pending.length === 0) {
        return Promise.resolve();
    }

    return new Promise<void>(resolve => {
        const timeout = setTimeout(resolve, timeoutMs);

        Promise.all(
            pending.map(img => new Promise<void>(imgResolve => {
                img.addEventListener('load', () => imgResolve(), { once: true });
                img.addEventListener('error', () => imgResolve(), { once: true });
            })),
        ).then(() => {
            clearTimeout(timeout);
            resolve();
        });
    });
}

export default function BookingInvoicePage({ booking, invoiceSettings, autoPrint, invoiceTerms, invoiceTerms2, termsConditions, driver }: InvoicePageProps) {
    const invoiceRef = useRef<HTMLDivElement>(null);

    async function downloadPdf() {
        if (!invoiceRef.current) return;

        await waitForImages();

        const filename = `invoice-${booking.reference_code ?? booking.id}.pdf`;

        await generateInvoicePdf(invoiceRef.current, { filename });
    }

    useEffect(() => {
        if (!autoPrint) return;

        const t = setTimeout(() => window.print(), 300);

        return () => clearTimeout(t);
    }, [autoPrint]);

    useEffect(() => {
        const restore = applyPrintStyles({ keepPrintHidden: true });

        return () => restore();
    }, []);

    return (
        <>
            <Head title={`Invoice ${booking.reference_code ?? booking.id}`} />
            <div className="min-h-screen bg-surface-50 dark:bg-brand-950 py-6 px-4 sm:px-6 print:bg-white print:p-0 print:py-0 print:px-0">
                <div className="mx-auto w-full max-w-[740px]">
                    <Invoice
                        ref={invoiceRef}
                        booking={booking}
                        settings={invoiceSettings}
                        documentType="Invoice"
                        showPrintButton
                        onPrint={() => window.print()}
                        onDownloadPdf={() => void downloadPdf()}
                        driver={driver}
                        invoiceTerms={invoiceTerms}
                        invoiceTerms2={invoiceTerms2}
                        termsConditions={termsConditions}
                    />
                </div>
            </div>
        </>
    );
}
