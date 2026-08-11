import { cn, footerLogoUrl } from '@/lib/utils';

export interface InvoiceMetaField {
    label: string;
    value: string;
    badge?: string;
}

interface InvoiceHeaderProps {
    settings?: {
        company_name?: string | null;
        company_legal_name?: string | null;
        phone?: string | null;
        fax?: string | null;
        email?: string | null;
        address?: string | null;
        tax_id?: string | null;
        logo_path?: string | null;
        is_active?: boolean;
    } | null;
    documentType?: string;
    documentNumber?: string;
    meta?: InvoiceMetaField[];
    className?: string;
}

export default function InvoiceHeader({ settings, documentType = 'INVOICE', documentNumber, meta = [], className }: InvoiceHeaderProps) {
    if (!settings?.is_active && settings) {
        return null;
    }

    const companyName = settings?.company_name || 'West Car Rental';
    const legalName = settings?.company_legal_name;
    const phone = settings?.phone;
    const fax = settings?.fax;
    const email = settings?.email;
    const address = settings?.address;
    const taxId = settings?.tax_id;
    const logoUrl = footerLogoUrl(settings?.logo_path);

    const hasContact = Boolean(phone || fax || email);

    return (
        <div className={cn('mb-8 pb-6 print:mb-4 print:pb-4', className)}>
            <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between print:gap-4">
                {/* Column 1 - Company */}
                <div className="flex min-w-0 items-start gap-4">
                    {logoUrl && (
                        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card dark:border-surface-700/60 dark:bg-brand-800 sm:h-36 sm:w-36 print:h-28 print:w-28">
                            <img src={logoUrl} alt={companyName} className="h-24 w-auto object-contain sm:h-28 print:h-20" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-surface-900 sm:text-3xl dark:text-white print:text-xl">
                            {companyName}
                        </h2>
                        {legalName && (
                            <p className="mt-0.5 truncate text-xs text-surface-500 dark:text-surface-400">
                                {legalName}
                            </p>
                        )}
                        {address && (
                            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                                {address}
                            </p>
                        )}
                        {taxId && (
                            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                                <span className="font-medium text-surface-400 dark:text-surface-500">Tax ID:</span>{' '}
                                {taxId}
                            </p>
                        )}
                        {hasContact && (
                            <div className="mt-0.5 space-y-0.5 text-xs text-surface-500 dark:text-surface-400">
                                {phone && (
                                    <p>
                                        <span className="font-medium text-surface-400 dark:text-surface-500">Phone:</span>{' '}
                                        {phone}
                                        {fax && <span className="text-surface-400 dark:text-surface-500"> · Fax: {fax}</span>}
                                    </p>
                                )}
                                {!phone && fax && (
                                    <p>
                                        <span className="font-medium text-surface-400 dark:text-surface-500">Fax:</span>{' '}
                                        {fax}
                                    </p>
                                )}
                                {email && (
                                    <p>
                                        <span className="font-medium text-surface-400 dark:text-surface-500">Email:</span>{' '}
                                        {email}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2 - Document meta */}
                <div className="shrink-0 sm:text-right">
                    <div className="flex flex-col sm:items-end">
                        <p className="font-display text-3xl font-extrabold uppercase tracking-tight text-brand-600 sm:text-4xl dark:text-brand-400 print:text-2xl">
                            {documentType}
                        </p>
                        {documentNumber && (
                            <span className="mt-1.5 inline-flex w-fit items-center rounded-lg bg-surface-100 px-2.5 py-1 font-mono text-sm font-semibold text-surface-700 dark:bg-brand-800 dark:text-surface-300">
                                {documentNumber}
                            </span>
                        )}
                    </div>
                    {meta.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {meta.map(field => (
                                <p key={field.label} className="text-xs text-surface-500 dark:text-surface-400">
                                    <span className="font-medium text-surface-400 dark:text-surface-500">{field.label}:</span>{' '}
                                    {field.badge ? (
                                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide', field.badge)}>
                                            {field.value}
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-surface-700 dark:text-surface-300">{field.value}</span>
                                    )}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
