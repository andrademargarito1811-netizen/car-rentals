import { useState, useEffect, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';

interface CookieCategories {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

const STORAGE_KEY = 'cookie_consent';

function getSavedConsent(): CookieCategories | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved) as CookieCategories;
    } catch { /* empty */ }
    return null;
}

function saveConsent(categories: CookieCategories) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

const CATEGORIES = [
    {
        key: 'necessary' as const,
        label: 'Necessary',
        description: 'Required for the website to function. Cannot be disabled.',
        disabled: true,
    },
    {
        key: 'functional' as const,
        label: 'Functional',
        description: 'Remember your preferences and enhance your experience.',
        disabled: false,
    },
    {
        key: 'analytics' as const,
        label: 'Analytics',
        description: 'Help us understand how visitors use our site.',
        disabled: false,
    },
    {
        key: 'marketing' as const,
        label: 'Marketing',
        description: 'Used to deliver relevant advertisements.',
        disabled: false,
    },
] as const;

export default function CookieConsent() {
    const [consent, setConsent] = useState<CookieCategories | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const [showFloatingBtn, setShowFloatingBtn] = useState(false);
    const [preferences, setPreferences] = useState<CookieCategories>({
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        const saved = getSavedConsent();
        if (saved) {
            setConsent(saved);
        } else {
            setShowBanner(true);
        }
    }, []);

    const handleAcceptAll = useCallback(() => {
        const all: CookieCategories = { necessary: true, functional: true, analytics: true, marketing: true };
        saveConsent(all);
        setConsent(all);
        setShowBanner(false);
    }, []);

    const handleRejectAll = useCallback(() => {
        const minimal: CookieCategories = { necessary: true, functional: false, analytics: false, marketing: false };
        saveConsent(minimal);
        setConsent(minimal);
        setShowBanner(false);
    }, []);

    const handleSavePreferences = useCallback(() => {
        saveConsent(preferences);
        setConsent(preferences);
        setShowBanner(false);
        setShowCustomize(false);
        setShowFloatingBtn(true);
    }, [preferences]);

    const openPreferences = useCallback(() => {
        setShowCustomize(true);
        setShowBanner(false);
        if (consent) setPreferences(consent);
    }, [consent]);

    const togglePreference = useCallback((key: keyof CookieCategories) => {
        setPreferences(p => ({ ...p, [key]: !p[key] }));
    }, []);

    if (showCustomize) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Cookie Preferences</h3>
                            <p className="text-sm text-slate-500">Customize which cookies you allow.</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        {CATEGORIES.map(({ key, label, description, disabled }) => (
                            <label
                                key={key}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                                    disabled
                                        ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
                                        : 'cursor-pointer hover:bg-slate-50 border-slate-200'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={preferences[key]}
                                    disabled={disabled}
                                    onChange={() => togglePreference(key)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-sm text-slate-900">{label}</div>
                                    <div className="text-xs text-slate-500">{description}</div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" onClick={() => { setShowCustomize(false); setShowBanner(true); }} className="flex-1">
                            Back
                        </Button>
                        <Button onClick={handleSavePreferences} className="flex-1">
                            Save Preferences
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!showBanner) {
        if (showFloatingBtn) {
            return (
                <button
                    onClick={openPreferences}
                    className="fixed bottom-4 left-4 z-[100] flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-lg text-xs font-medium text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-all duration-200 hover:-translate-y-0.5"
                    aria-label="Cookie Preferences"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Cookie Preferences
                </button>
            );
        }
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-2xl shadow-slate-900/20 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-5 h-5 text-brand-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="font-semibold text-sm text-slate-900">Cookie Notice</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            We use cookies to enhance your browsing experience, serve personalized ads, and analyze our traffic.{' '}
                            <Link href={route('cookie-policy')} className="text-brand-600 hover:text-brand-700 underline font-medium">
                                Learn more
                            </Link>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <Button variant="ghost" size="sm" onClick={() => setShowCustomize(true)} className="text-xs">
                            Customize
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRejectAll} className="text-xs">
                            Reject All
                        </Button>
                        <Button variant="default" size="sm" onClick={handleAcceptAll} className="text-xs">
                            Accept All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
