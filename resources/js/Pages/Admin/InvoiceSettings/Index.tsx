import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Receipt, Save } from 'lucide-react';

interface InvoiceSettingsData {
    id: number;
    company_name: string;
    company_legal_name: string;
    phone: string;
    emergency_phone: string | null;
    fax: string | null;
    email: string;
    address: string | null;
    tax_id: string | null;
    logo_path: string | null;
    is_active: boolean;
}

function SectionCard({ title, description, icon, children }: { title: string; description: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="group/card relative overflow-hidden bg-white dark:bg-brand-800/80 rounded-2xl border border-surface-200 dark:border-surface-700/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-400/5 rounded-full blur-3xl group-hover/card:bg-accent-400/5 transition-colors duration-700" />
            <div className="relative px-6 sm:px-8 py-4 border-b border-surface-100 dark:border-surface-700/60">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-surface-900 dark:text-white">{title}</h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{description}</p>
                    </div>
                </div>
            </div>
            <div className="relative p-6 sm:p-8">
                {children}
            </div>
        </div>
    );
}

export default function InvoiceSettingsIndex({ settings }: { settings: InvoiceSettingsData }) {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const form = useForm({
        company_name: settings.company_name,
        company_legal_name: settings.company_legal_name,
        phone: settings.phone,
        emergency_phone: settings.emergency_phone || '',
        fax: settings.fax || '',
        email: settings.email,
        address: settings.address || '',
        tax_id: settings.tax_id || '',
        logo: null as File | null,
        is_active: settings.is_active,
    });

    function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    }

    function saveSettings() {
        form.post(route('admin.invoice-settings.update'), {
            forceFormData: form.data.logo instanceof File,
        });
    }

    const currentLogo = logoPreview
        ? logoPreview
        : settings.logo_path
            ? (settings.logo_path.startsWith('/') ? settings.logo_path : `/storage/${settings.logo_path}`)
            : null;

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    const COMPANY_ICON = 'M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18.5 0h-18.5M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819';

    return (
        <>
            <Head title="Invoice Settings" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Invoice Settings' }]}
                header={
                    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br', headerGradient, 'p-6 sm:p-8')}>
                        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-float-orb" />
                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-float-orb-delayed" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Site Settings
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Invoice Settings
                                </h1>
                                <p className="text-white/60 max-w-xl text-sm">
                                    Company details shown in the header of every invoice and receipt.
                                </p>
                            </div>
                            <span className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm',
                                form.data.is_active
                                    ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30'
                                    : 'bg-surface-500/15 text-surface-400 ring-1 ring-surface-500/30'
                            )}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', form.data.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-surface-400')} />
                                {form.data.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10">
                        <div className="space-y-8">

                            <SectionCard title="Company Information" description="Company name and legal entity used on the invoice header." icon={COMPANY_ICON}>
                                <div className="space-y-5 max-w-2xl">
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Company Name</label>
                                        <input type="text" value={form.data.company_name} onChange={e => form.setData('company_name', e.target.value)}
                                            className="input-field" placeholder="West Car Rental" />
                                        <p className="mt-1 text-xs text-surface-400">The trading name shown prominently on the invoice.</p>
                                        {form.errors.company_name && <p className="mt-1 text-xs text-red-500">{form.errors.company_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Legal Company Name</label>
                                        <input type="text" value={form.data.company_legal_name} onChange={e => form.setData('company_legal_name', e.target.value)}
                                            className="input-field" placeholder="Western Caroline Trading Company Inc." />
                                        {form.errors.company_legal_name && <p className="mt-1 text-xs text-red-500">{form.errors.company_legal_name}</p>}
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="Contact Details" description="Phone, fax, and email displayed under the company name." icon={'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z'}>
                                <div className="space-y-5 max-w-2xl">
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Phone</label>
                                        <input type="text" value={form.data.phone} onChange={e => form.setData('phone', e.target.value)}
                                            className="input-field" placeholder="+1 (800) 555-WEST" />
                                        {form.errors.phone && <p className="mt-1 text-xs text-red-500">{form.errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Emergency Phone</label>
                                        <input type="text" value={form.data.emergency_phone} onChange={e => form.setData('emergency_phone', e.target.value)}
                                            className="input-field" placeholder="+1 (800) 555-HELP" />
                                        <p className="mt-1 text-xs text-surface-400">Shown on the invoice "In case of accident" banner. Leave blank to fall back to the phone number.</p>
                                        {form.errors.emergency_phone && <p className="mt-1 text-xs text-red-500">{form.errors.emergency_phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Fax</label>
                                        <input type="text" value={form.data.fax} onChange={e => form.setData('fax', e.target.value)}
                                            className="input-field" placeholder="+1 (800) 555-FAX" />
                                        <p className="mt-1 text-xs text-surface-400">Leave blank to hide from the invoice header.</p>
                                        {form.errors.fax && <p className="mt-1 text-xs text-red-500">{form.errors.fax}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
                                        <input type="text" value={form.data.email} onChange={e => form.setData('email', e.target.value)}
                                            className="input-field" placeholder="info@westcarsales.com" />
                                        {form.errors.email && <p className="mt-1 text-xs text-red-500">{form.errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Address</label>
                                        <input type="text" value={form.data.address} onChange={e => form.setData('address', e.target.value)}
                                            className="input-field" placeholder="P.O Box 280, Koror 96940, Palau" />
                                        <p className="mt-1 text-xs text-surface-400">Leave blank to hide from the invoice header.</p>
                                        {form.errors.address && <p className="mt-1 text-xs text-red-500">{form.errors.address}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Tax ID</label>
                                        <input type="text" value={form.data.tax_id} onChange={e => form.setData('tax_id', e.target.value)}
                                            className="input-field" placeholder="000021" />
                                        <p className="mt-1 text-xs text-surface-400">Leave blank to hide from the invoice header.</p>
                                        {form.errors.tax_id && <p className="mt-1 text-xs text-red-500">{form.errors.tax_id}</p>}
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="Logo" description="Logo displayed next to the company name on the invoice header." icon={'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'}>
                                <div className="max-w-2xl">
                                    {currentLogo && (
                                        <div className="mb-3">
                                            <img src={currentLogo} alt="Logo preview" className="h-14 w-auto object-contain rounded-xl bg-white/50 dark:bg-brand-900/50 p-2 border border-surface-200 dark:border-surface-700/60" />
                                        </div>
                                    )}
                                    <Input type="file" accept="image/*" onChange={onLogoChange} />
                                    {form.errors.logo && <p className="mt-1 text-xs text-red-500">{form.errors.logo}</p>}
                                </div>
                            </SectionCard>

                            <div className="animate-fade-in-up flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                                <p className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1.5">
                                    <Receipt className="w-3.5 h-3.5" />
                                    Changes apply immediately to all new invoices and receipts.
                                </p>
                                <Button variant="default" onClick={saveSettings} disabled={form.processing}>
                                    {form.processing ? (
                                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                                    ) : (
                                        <><Save className="w-4 h-4" />Save Settings</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
