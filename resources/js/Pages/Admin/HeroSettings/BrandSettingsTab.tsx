import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { cn, footerLogoUrl } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';

interface LinkItem {
    label: string;
    url: string;
}

interface SocialLinkItem {
    platform: string;
    label: string;
    url: string;
}

interface BrandSettingsData {
    id: number;
    brand_name: string;
    brand_tagline: string | null;
    brand_description: string | null;
    logo_path: string | null;
    newsletter_heading: string;
    newsletter_description: string | null;
    newsletter_placeholder: string;
    newsletter_active: boolean;
    contact_email: string;
    contact_phone: string;
    contact_hours: string;
    contact_address: string;
    copyright_text: string;
    quick_links: LinkItem[];
    legal_links: LinkItem[];
    social_links: SocialLinkItem[];
    is_active: boolean;
}

const NAV_ITEMS = [
    { id: 'brand', label: 'Brand', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
    { id: 'newsletter', label: 'Newsletter', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
    { id: 'contact', label: 'Contact', icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z' },
    { id: 'social', label: 'Social Links', icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' },
    { id: 'copyright', label: 'Copyright', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
];

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

export default function BrandSettingsTab({ settings }: { settings: BrandSettingsData }) {
    const [activeNav, setActiveNav] = useState('brand');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoRemoved, setLogoRemoved] = useState(false);
    const [logoFileError, setLogoFileError] = useState<string | null>(null);

    const form = useForm({
        brand_name: settings.brand_name,
        brand_tagline: settings.brand_tagline || '',
        brand_description: settings.brand_description || '',
        logo: null as File | null,
        remove_logo: false,
        newsletter_heading: settings.newsletter_heading,
        newsletter_description: settings.newsletter_description || '',
        newsletter_placeholder: settings.newsletter_placeholder,
        newsletter_active: settings.newsletter_active,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        contact_hours: settings.contact_hours,
        contact_address: settings.contact_address || '',
        copyright_text: settings.copyright_text,
        social_links: settings.social_links || [{ platform: 'facebook', label: '', url: '' }],
        is_active: settings.is_active,
    });

    function addSocial() {
        form.setData('social_links', [...form.data.social_links, { platform: 'facebook', label: '', url: '' }]);
    }

    function removeSocial(index: number) {
        form.setData('social_links', form.data.social_links.filter((_, i) => i !== index));
    }

    function updateSocial(index: number, key: 'platform' | 'label' | 'url', value: string) {
        const items = [...form.data.social_links];
        items[index] = { ...items[index], [key]: value };
        form.setData('social_links', items);
    }

    function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setLogoFileError('Image is too large. Maximum file size is 2MB.');
                form.setData('logo', null);
                form.setData('remove_logo', false);
                setLogoRemoved(false);
                setLogoPreview(null);
                return;
            }
            setLogoFileError(null);
            form.setData('logo', file);
            form.setData('remove_logo', false);
            setLogoRemoved(false);
            setLogoPreview(URL.createObjectURL(file));
        }
    }

    function removeLogo() {
        form.setData('logo', null);
        form.setData('remove_logo', true);
        setLogoRemoved(true);
        setLogoPreview(null);
    }

    useEffect(() => {
        return () => {
            if (logoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    function saveSettings() {
        form.post(route('admin.footer-settings.update'), {
            forceFormData: form.data.logo instanceof File,
            preserveScroll: true,
        });
    }

    const currentLogo = logoPreview
        ? logoPreview
        : !logoRemoved && settings.logo_path
            ? footerLogoUrl(settings.logo_path)
            : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Brand Settings</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Company identity, header & footer content, contact details, and links</p>
                </div>
                <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm',
                    form.data.is_active
                        ? 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-surface-500/15 text-surface-500 ring-1 ring-surface-500/30'
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', form.data.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-surface-400')} />
                    {form.data.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            {/* Sub-navigation */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/70 dark:bg-brand-900/70 backdrop-blur-xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass overflow-x-auto">
                {NAV_ITEMS.map(item => (
                    <button key={item.id} type="button" onClick={() => setActiveNav(item.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                            activeNav === item.id
                                ? 'bg-white dark:bg-brand-800/80 shadow-sm text-brand-700 dark:text-brand-300'
                                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                        )}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="space-y-8">

                    {activeNav === 'brand' && (
                        <SectionCard title="Brand" description="Company name, description, and logo shown in the header and footer." icon={NAV_ITEMS[0].icon}>
                            <div className="space-y-5 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Company Name</label>
                                    <input type="text" value={form.data.brand_name} onChange={e => form.setData('brand_name', e.target.value)}
                                        className="input-field" />
                                    {form.errors.brand_name && <p className="mt-1 text-xs text-red-500">{form.errors.brand_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Tagline</label>
                                    <input type="text" value={form.data.brand_tagline} onChange={e => form.setData('brand_tagline', e.target.value)}
                                        className="input-field" placeholder="Crafted for the Open Road" />
                                    {form.errors.brand_tagline && <p className="mt-1 text-xs text-red-500">{form.errors.brand_tagline}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
                                    <textarea value={form.data.brand_description} onChange={e => form.setData('brand_description', e.target.value)}
                                        className="input-field resize-none" rows={3} />
                                    {form.errors.brand_description && <p className="mt-1 text-xs text-red-500">{form.errors.brand_description}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Logo</label>
                                    {currentLogo && (
                                        <div className="mb-3 flex items-start gap-3">
                                            <img src={currentLogo} alt="Logo preview" className="h-14 w-auto object-contain rounded-xl bg-white/50 dark:bg-brand-900/50 p-2 border border-surface-200 dark:border-surface-700/60" />
                                            <button type="button" onClick={removeLogo}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 border border-surface-200 dark:border-surface-700/60 transition-colors shrink-0">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    {form.data.logo instanceof File && (
                                        <p className="mb-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                                            New logo selected — save to apply.
                                        </p>
                                    )}
                                    <Input type="file" accept="image/*" onChange={onLogoChange} />
                                    <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
                                        Accepted formats: JPG, PNG, GIF, SVG, WEBP. Maximum file size: 2MB.
                                    </p>
                                    {logoFileError && <p className="mt-1 text-xs text-red-500">{logoFileError}</p>}
                                    {form.errors.logo && <p className="mt-1 text-xs text-red-500">{form.errors.logo}</p>}
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {activeNav === 'newsletter' && (
                        <SectionCard title="Newsletter" description="Newsletter signup section text and settings." icon={NAV_ITEMS[1].icon}>
                            <div className="space-y-5 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Heading</label>
                                    <input type="text" value={form.data.newsletter_heading} onChange={e => form.setData('newsletter_heading', e.target.value)}
                                        className="input-field" />
                                    {form.errors.newsletter_heading && <p className="mt-1 text-xs text-red-500">{form.errors.newsletter_heading}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
                                    <textarea value={form.data.newsletter_description} onChange={e => form.setData('newsletter_description', e.target.value)}
                                        className="input-field resize-none" rows={2} />
                                    {form.errors.newsletter_description && <p className="mt-1 text-xs text-red-500">{form.errors.newsletter_description}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Email Placeholder</label>
                                    <input type="text" value={form.data.newsletter_placeholder} onChange={e => form.setData('newsletter_placeholder', e.target.value)}
                                        className="input-field" />
                                    {form.errors.newsletter_placeholder && <p className="mt-1 text-xs text-red-500">{form.errors.newsletter_placeholder}</p>}
                                </div>
                                <div className="flex items-center gap-3 pt-3 border-t border-surface-100 dark:border-surface-700/60">
                                    <button type="button"
                                        onClick={() => form.setData('newsletter_active', !form.data.newsletter_active)}
                                        className={cn(
                                            'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                                            form.data.newsletter_active ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
                                        )}>
                                        <span className={cn(
                                            'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300',
                                            form.data.newsletter_active ? 'translate-x-5' : 'translate-x-0'
                                        )} />
                                    </button>
                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Show newsletter section</span>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {activeNav === 'contact' && (
                        <SectionCard title="Contact Information" description="Email, phone, and business hours displayed in the footer." icon={NAV_ITEMS[2].icon}>
                            <div className="space-y-5 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
                                    <input type="text" value={form.data.contact_email} onChange={e => form.setData('contact_email', e.target.value)}
                                        className="input-field" />
                                    {form.errors.contact_email && <p className="mt-1 text-xs text-red-500">{form.errors.contact_email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Phone</label>
                                    <input type="text" value={form.data.contact_phone} onChange={e => form.setData('contact_phone', e.target.value)}
                                        className="input-field" />
                                    {form.errors.contact_phone && <p className="mt-1 text-xs text-red-500">{form.errors.contact_phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Business Hours</label>
                                    <input type="text" value={form.data.contact_hours} onChange={e => form.setData('contact_hours', e.target.value)}
                                        className="input-field" />
                                    {form.errors.contact_hours && <p className="mt-1 text-xs text-red-500">{form.errors.contact_hours}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Address</label>
                                    <input type="text" value={form.data.contact_address} onChange={e => form.setData('contact_address', e.target.value)}
                                        className="input-field" placeholder="123 Auto Drive, Motor City" />
                                    {form.errors.contact_address && <p className="mt-1 text-xs text-red-500">{form.errors.contact_address}</p>}
                                </div>
                            </div>
                        </SectionCard>
                    )}


                    {activeNav === 'social' && (
                        <SectionCard title="Social Links" description="Social media links displayed as icon buttons in the footer." icon={NAV_ITEMS[3].icon}>
                            <div className="space-y-4 max-w-2xl">
                                {form.data.social_links.map((link, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-surface-50 dark:bg-brand-900/50 border border-surface-200 dark:border-surface-700/60">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">Platform</label>
                                                <select value={link.platform} onChange={e => updateSocial(index, 'platform', e.target.value)}
                                                    className="input-field text-sm">
                                                    <option value="facebook">Facebook</option>
                                                    <option value="twitter">Twitter</option>
                                                    <option value="instagram">Instagram</option>
                                                    <option value="linkedin">LinkedIn</option>
                                                    <option value="youtube">YouTube</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">Label</label>
                                                <input type="text" value={link.label} onChange={e => updateSocial(index, 'label', e.target.value)}
                                                    className="input-field text-sm" placeholder="Facebook" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">URL</label>
                                                <input type="text" value={link.url} onChange={e => updateSocial(index, 'url', e.target.value)}
                                                    className="input-field text-sm" placeholder="https://facebook.com/..." />
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeSocial(index)}
                                            className="mt-5 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={addSocial}
                                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 text-sm font-semibold transition-all duration-200">
                                    + Add Social Link
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {activeNav === 'copyright' && (
                        <SectionCard title="Copyright" description="Copyright notice displayed in the footer bottom bar." icon={NAV_ITEMS[4].icon}>
                            <div className="space-y-5 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Copyright Text</label>
                                    <input type="text" value={form.data.copyright_text} onChange={e => form.setData('copyright_text', e.target.value)}
                                        className="input-field" placeholder="West Car Sales. All rights reserved." />
                                    <p className="mt-1 text-xs text-surface-400">The year will be prepended automatically (&copy; 2026 {form.data.copyright_text})</p>
                                    {form.errors.copyright_text && <p className="mt-1 text-xs text-red-500">{form.errors.copyright_text}</p>}
                                </div>
                                <div className="flex items-center gap-3 pt-3 border-t border-surface-100 dark:border-surface-700/60">
                                    <button type="button"
                                        onClick={() => form.setData('is_active', !form.data.is_active)}
                                        className={cn(
                                            'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
                                            form.data.is_active ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'
                                        )}>
                                        <span className={cn(
                                            'inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300',
                                            form.data.is_active ? 'translate-x-5' : 'translate-x-0'
                                        )} />
                                    </button>
                                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Brand settings active</span>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* Save Button */}
                    <div className="animate-fade-in-up flex items-center justify-between bg-white/70 dark:bg-brand-800/70 backdrop-blur-xl rounded-2xl border border-surface-200/60 dark:border-surface-700/40 shadow-glass px-6 py-4">
                        <p className="text-xs text-surface-400 dark:text-surface-500">
                            Changes are applied immediately after saving.
                        </p>
                        <Button variant="default" onClick={saveSettings} disabled={form.processing}>
                            {form.processing ? (
                                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                            ) : (
                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Save Settings</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
    );
}
