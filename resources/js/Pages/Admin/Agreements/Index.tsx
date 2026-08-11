import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import RichEditor from '@/Pages/Admin/Locations/RichEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { ScrollText, Scale, FileText, Cookie, Receipt, Save, Globe, ClipboardList } from 'lucide-react';

interface LegalDocument {
    id: number;
    slug: string;
    title: string;
    subtitle: string | null;
    content: string;
    type: 'website' | 'invoice';
    version: number;
    is_active: boolean;
    updated_at: string | null;
}

interface AgreementsIndexProps {
    websiteDocuments: LegalDocument[];
    invoiceDocuments: LegalDocument[];
}

function DocumentEditor({ document }: { document: LegalDocument }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        title: document.title,
        subtitle: document.subtitle || '',
        content: document.content,
        is_active: document.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(route('admin.agreements.update', document.id), {
            preserveScroll: true,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Document Title</Label>
                    <Input
                        value={data.title}
                        onChange={e => setData('title', e.target.value)}
                        placeholder="e.g. Privacy Policy"
                    />
                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Subtitle</Label>
                    <Input
                        value={data.subtitle}
                        onChange={e => setData('subtitle', e.target.value)}
                        placeholder="Short description shown under the title"
                    />
                    {errors.subtitle && <p className="text-sm text-red-500">{errors.subtitle}</p>}
                </div>
            </div>

            <RichEditor
                label="Content"
                value={data.content}
                onChange={content => setData('content', content)}
                placeholder="Write the document content here..."
            />
            {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}

            <label className="flex items-center gap-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer">
                <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={e => setData('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                Active (visible on the site)
            </label>

            <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-surface-400">
                    {recentlySuccessful && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Save className="w-3.5 h-3.5" /> Saved
                        </span>
                    )}
                    {!recentlySuccessful && document.updated_at && (
                        <span>Last updated {new Date(document.updated_at).toLocaleString()}</span>
                    )}
                </div>
                <Button type="submit" disabled={processing}>
                    <Save className="w-4 h-4" />
                    {processing ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}

export default function AgreementsIndex({ websiteDocuments, invoiceDocuments }: AgreementsIndexProps) {
    const [activeTab, setActiveTab] = useState<string>(websiteDocuments[0]?.slug || '');

    const websiteTabs = websiteDocuments.map(doc => ({
        slug: doc.slug,
        label: doc.title,
        icon: doc.slug === 'privacy-policy' ? Scale : doc.slug === 'terms-of-service' ? FileText : doc.slug === 'cookie-policy' ? Cookie : ScrollText,
        doc,
    }));

    const invoiceTabs = invoiceDocuments.map(doc => ({
        slug: doc.slug,
        label: doc.title,
        icon: Receipt,
        doc,
    }));

    const allTabs = [...websiteTabs, ...invoiceTabs];
    const activeDoc = allTabs.find(t => t.slug === activeTab)?.doc;

    const headerGradient = 'from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900';

    return (
        <>
            <Head title="Agreements" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Agreements' }]}
                header={
                    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br', headerGradient, 'p-6 sm:p-8')}>
                        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-float-orb" />
                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-float-orb-delayed" />
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Legal Documents
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                    Agreements
                                </h1>
                                <p className="text-white/60 max-w-xl text-sm">
                                    Edit the Privacy Policy, Terms of Service, Cookie Policy, Terms and Conditions, and the invoice terms shown on rental documents.
                                </p>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="pb-8 sm:pb-12 pt-4 sm:pt-6">
                    <div className="px-6 lg:px-10">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500">
                                    <Globe className="w-4 h-4" /> Website Documents
                                </div>
                                <div className="flex gap-1 p-1.5 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass overflow-x-auto">
                                    {websiteTabs.map(tab => (
                                        <button
                                            key={tab.slug}
                                            type="button"
                                            onClick={() => setActiveTab(tab.slug)}
                                            className={cn(
                                                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                                                activeTab === tab.slug
                                                    ? 'bg-white dark:bg-brand-800/80 shadow-md text-brand-700 dark:text-brand-300'
                                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-white/50 dark:hover:bg-brand-800/40'
                                            )}
                                        >
                                            <tab.icon className="w-4 h-4 shrink-0" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-surface-400 dark:text-surface-500">
                                    <ClipboardList className="w-4 h-4" /> Invoice Terms
                                </div>
                                <div className="flex gap-1 p-1.5 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass overflow-x-auto">
                                    {invoiceTabs.map(tab => (
                                        <button
                                            key={tab.slug}
                                            type="button"
                                            onClick={() => setActiveTab(tab.slug)}
                                            className={cn(
                                                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                                                activeTab === tab.slug
                                                    ? 'bg-white dark:bg-brand-800/80 shadow-md text-brand-700 dark:text-brand-300'
                                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-white/50 dark:hover:bg-brand-800/40'
                                            )}
                                        >
                                            <tab.icon className="w-4 h-4 shrink-0" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {activeDoc && (
                                <Card className="animate-fade-in overflow-hidden">
                                    <CardContent className="p-6 sm:p-8 space-y-5">
                                        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-surface-100 dark:border-surface-700 pb-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-surface-900 dark:text-white">{activeDoc.title}</h2>
                                                <p className="text-sm text-surface-500 dark:text-surface-400">
                                                    /{activeDoc.slug} · v{activeDoc.version}
                                                </p>
                                            </div>
                                            <Badge variant={activeDoc.type === 'invoice' ? 'active' : 'confirmed'}>
                                                {activeDoc.type === 'invoice' ? 'Invoice' : 'Website'}
                                            </Badge>
                                        </div>
                                        <DocumentEditor key={activeDoc.slug} document={activeDoc} />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
