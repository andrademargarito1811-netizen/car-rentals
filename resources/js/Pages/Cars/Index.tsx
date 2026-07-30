import { useEffect, useMemo, useRef, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { countries as countriesList, type Country } from '@/data/countries';
import * as LucideIcons from 'lucide-react';

function WhyChooseUsIcon({ icon, className }: { icon: string; className?: string }) {
    if (/^M[\s\d]/.test(icon)) {
        return (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
        );
    }
    const IconComp = (LucideIcons as any)[icon];
    if (IconComp) return <IconComp className={className} />;
    return null;
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selected: Country | undefined = countriesList.find((c) => c.name === value);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return countriesList;
        return countriesList.filter(
            (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
        );
    }, [search]);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        inputRef.current?.focus();
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    useEffect(() => {
        setHighlighted(0);
    }, [search]);

    useEffect(() => {
        if (!open) return;
        const item = listRef.current?.querySelector(`[data-idx="${highlighted}"]`);
        if (item) (item as HTMLElement).scrollIntoView({ block: 'nearest' });
    }, [highlighted, open]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[highlighted]) {
                onChange(filtered[highlighted].name);
                setOpen(false);
                setSearch('');
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition flex items-center justify-between gap-2"
            >
                <span className="flex items-center gap-2 min-w-0">
                    {selected ? (
                        <>
                            <span className="text-base leading-none shrink-0">{selected.flag}</span>
                            <span className="truncate">{selected.name}</span>
                        </>
                    ) : (
                        <span className="text-surface-400">Select country</span>
                    )}
                </span>
                <svg
                    className={`w-4 h-4 text-surface-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-brand-900 border border-white/10 rounded-lg shadow-2xl shadow-black/60 overflow-hidden">
                    <div className="p-2 border-b border-white/10">
                        <div className="relative">
                            <svg
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search countries..."
                                className="w-full pl-8 pr-8 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-transparent"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        inputRef.current?.focus();
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                                    aria-label="Clear search"
                                >
                                    <svg className="w-3 h-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-6 text-center">
                                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-surface-400">No countries match "{search}"</p>
                            </div>
                        ) : (
                            filtered.map((c, i) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    data-idx={i}
                                    onClick={() => {
                                        onChange(c.name);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    onMouseEnter={() => setHighlighted(i)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition ${
                                        i === highlighted ? 'bg-white/10' : 'hover:bg-white/5'
                                    } ${value === c.name ? 'text-accent-400' : 'text-white'}`}
                                >
                                    <span className="text-base leading-none shrink-0">{c.flag}</span>
                                    <span className="flex-1 truncate">{c.name}</span>
                                    <span className="text-[10px] font-mono text-surface-500 shrink-0">{c.code}</span>
                                    {value === c.name && (
                                        <svg className="w-4 h-4 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                    <div className="px-3 py-1.5 border-t border-white/10 bg-white/[0.02] text-[10px] text-surface-500 flex items-center justify-between">
                        <span>{filtered.length} {filtered.length === 1 ? 'country' : 'countries'}</span>
                        <span className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↑↓</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">↵</kbd>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

interface CarData {
    id: number;
    name: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    seats: number;
    transmission: string;
    daily_rate: number;
    image_path: string | null;
    avg_rating: number;
    ratings_count: number;
}

interface HeroImage {
    id: number;
    image_path: string;
    tagline: string | null;
    alt_text: string | null;
    sort_order: number;
}

interface HeroSettings {
    id: number;
    badge_text: string;
    badge_enabled: boolean;
    badge_icon: string;
    booking_badge_text: string;
    booking_badge_enabled: boolean;
    booking_badge_icon: string;
    headline: string;
    headline_highlight: string;
    tagline: string | null;
    description: string | null;
    image_path: string | null;
    is_active: boolean;
    images: HeroImage[];
}

interface LocationData {
    location_id: number;
    location: string;
}

interface FaqData {
    id: number;
    question: string;
    answer: string;
    category: string;
    popular: boolean;
}

interface WhyChooseUsItem {
    id: number;
    title: string;
    description: string | null;
    icon_svg: string | null;
    sort_order: number;
    is_active: boolean;
}

interface CarsIndexProps {
    canLogin: boolean;
    canRegister: boolean;
    cars: CarData[];
    heroSettings?: HeroSettings | null;
    totalCars: number;
    locations: LocationData[];
    faqs?: FaqData[];
    whyChooseUsItems?: WhyChooseUsItem[];
    whyChooseUsHeading?: string;
    whyChooseUsSubheading?: string;
}

const carouselImages = [
    { url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&h=800&fit=crop', alt: 'Luxury sedan on highway', tagline: 'Luxury Sedans for Executive Travel' },
    { url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&h=800&fit=crop', alt: 'SUV in mountain road', tagline: 'Spacious SUVs for Family Adventures' },
    { url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=800&fit=crop', alt: 'Sports car at sunset', tagline: 'Feel the Thrill of a Sports Car' },
    { url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&h=800&fit=crop', alt: 'Convertible by the beach', tagline: 'Open-Air Freedom with Convertibles' },
    { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=800&fit=crop', alt: 'Premium car rental fleet', tagline: 'Premium Fleet at Affordable Rates' },
];

const taglines = [
    'Drive Your Dreams, One Mile at a Time',
    'Your Journey Starts Here',
    'Where Quality Meets the Road',
    'Experience the Freedom of the Open Road',
    'Luxury on Wheels, Affordable Prices',
];



const CAR_IMAGES_FALLBACK = [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&h=400&fit=crop',
];

const defaultFleetHighlights = [
    { name: 'Toyota Vios', category: 'Economy', price: '45', img: CAR_IMAGES_FALLBACK[2], seats: 5, transmission: 'Automatic', rating: 4.7, reviews: 234 },
    { name: 'Honda CR-V', category: 'SUV', price: '75', img: CAR_IMAGES_FALLBACK[1], seats: 7, transmission: 'Automatic', rating: 4.8, reviews: 189 },
    { name: 'Ford Mustang', category: 'Sports', price: '120', img: CAR_IMAGES_FALLBACK[0], seats: 4, transmission: 'Manual', rating: 4.6, reviews: 156 },
    { name: 'Mercedes C-Class', category: 'Luxury', price: '150', img: CAR_IMAGES_FALLBACK[4], seats: 5, transmission: 'Automatic', rating: 4.9, reviews: 312 },
];

const features = [
    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Fully Insured', description: 'Every rental includes comprehensive coverage so you can drive with complete peace of mind.' },
    { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Best Prices', description: 'Competitive rates with no hidden markups and exclusive weekly discounts for longer rentals.' },
    { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z', title: '4 Locations', description: 'Conveniently situated across Palau including airport and central hotel locations for easy pickup.' },
    { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: '24/7 Support', description: 'Round-the-clock customer service ready to assist you at any hour, wherever your journey takes you.' },
    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Quick Pickup', description: 'Streamlined check-in process gets you on the road in minutes with minimal paperwork.' },
    { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', title: 'No Hidden Fees', description: 'What you see is what you pay. Transparent pricing with zero surprise charges at checkout.' },
];

const testimonials = [
    { name: 'Sarah Johnson', role: 'Business Traveler', text: 'Absolutely seamless experience. The car was pristine and the service was outstanding.', rating: 5 },
    { name: 'Michael Chen', role: 'Family Vacation', text: 'Best rental experience we have ever had. Affordable rates and excellent vehicles.', rating: 5 },
    { name: 'Emma Davis', role: 'Weekend Explorer', text: 'Quick pickup, great car, and hassle-free return. Will definitely use again!', rating: 5 },
];

const faqCategories = [
    { name: 'All', icon: 'M4 6h16M4 12h16M4 18h16' },
    { name: 'Requirements', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-2 5h.01M14 13h.01' },
    { name: 'Insurance', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { name: 'Pickup & Return', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { name: 'Policies', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-7 8h2m-2 4h2m5-4h2m-2 4h2' },
    { name: 'Reservations', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const defaultQuoteCars = [
    { id: 1, name: 'Toyota Vios', category: 'Economy', pricePerDay: 45, img: CAR_IMAGES_FALLBACK[2], rating: 4.7, reviews: 234, weeklyDiscount: 10 },
    { id: 2, name: 'Honda CR-V', category: 'SUV', pricePerDay: 75, img: CAR_IMAGES_FALLBACK[1], rating: 4.8, reviews: 189, weeklyDiscount: 12 },
    { id: 3, name: 'Ford Mustang', category: 'Sports', pricePerDay: 120, img: CAR_IMAGES_FALLBACK[0], rating: 4.6, reviews: 156, weeklyDiscount: 8 },
    { id: 4, name: 'Mercedes C-Class', category: 'Luxury', pricePerDay: 150, img: CAR_IMAGES_FALLBACK[4], rating: 4.9, reviews: 312, weeklyDiscount: 15 },
];



const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function CarsIndex({ canLogin, canRegister, cars, heroSettings, totalCars, locations, faqs: faqsFromProps = [], whyChooseUsItems, whyChooseUsHeading, whyChooseUsSubheading }: CarsIndexProps) {
    const route = useRoute();
    const faqs = faqsFromProps.length > 0 ? faqsFromProps : [];
    const locationNames = useMemo(() => locations.map(l => l.location), [locations]);

    const fleetHighlights = useMemo(() => {
        if (cars && cars.length > 0) {
            return cars.map(car => ({
                name: car.name,
                category: car.category,
                price: String(car.daily_rate),
                img: car.image_path ? `/storage/${car.image_path}` : CAR_IMAGES_FALLBACK[car.id % CAR_IMAGES_FALLBACK.length],
                seats: car.seats,
                transmission: car.transmission,
                rating: car.avg_rating,
                reviews: car.ratings_count,
            }));
        }
        return defaultFleetHighlights;
    }, [cars]);

    const quoteCars = useMemo(() => {
        if (cars && cars.length > 0) {
            return cars.map(car => ({
                id: car.id,
                name: car.name,
                category: car.category,
                pricePerDay: car.daily_rate,
                img: car.image_path ? `/storage/${car.image_path}` : CAR_IMAGES_FALLBACK[car.id % CAR_IMAGES_FALLBACK.length],
                rating: car.avg_rating,
                reviews: car.ratings_count,
                weeklyDiscount: 10,
            }));
        }
        return defaultQuoteCars;
    }, [cars]);

    const quoteCategories = useMemo(() => ['All', ...Array.from(new Set(quoteCars.map(c => c.category)))], [quoteCars]);

    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentTagline] = useState(() => taglines[Math.floor(Math.random() * taglines.length)]);
    const [pickupDate, setPickupDate] = useState(() =>
        new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Palau' })
    );
    const [pickupTime, setPickupTime] = useState('09:00');
    const [pickupLocation, setPickupLocation] = useState(locationNames[0] || '');
    const [returnDate, setReturnDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 3);
        return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Palau' });
    });
    const [returnTime, setReturnTime] = useState('09:00');
    const [returnLocation, setReturnLocation] = useState(locationNames[1] || locationNames[0] || '');
    const [country, setCountry] = useState('Palau');
    const [activeFleetTab, setActiveFleetTab] = useState('All');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [faqSearch, setFaqSearch] = useState('');
    const [activeFaqCategory, setActiveFaqCategory] = useState('All');
    const [expandAllFaqs, setExpandAllFaqs] = useState(false);
    const [quoteCar, setQuoteCar] = useState(quoteCars[0].name);
    const [quoteCategory, setQuoteCategory] = useState('All');
    const [quoteSearch, setQuoteSearch] = useState('');
    const [quotePickupDate, setQuotePickupDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [quoteReturnDate, setQuoteReturnDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 3);
        return d.toLocaleDateString('en-CA');
    });
    const [displayedTotal, setDisplayedTotal] = useState(0);
    const [userRatings, setUserRatings] = useState<Record<string, number>>({});
    const [hoverRating, setHoverRating] = useState<Record<string, number>>({});
    const [taxes, setTaxes] = useState<{ id: number; tax_desc: string; category: string; amount: number; add_or_minus: boolean; calculation: string; value_in: string; rate: number }[]>([]);
    const [totalTax, setTotalTax] = useState(0);
    const [totalSurcharge, setTotalSurcharge] = useState(0);
    const [totalTaxDiscount, setTotalTaxDiscount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('opacity-100', 'translate-y-0');
                        entry.target.classList.remove('opacity-0', 'translate-y-8');
                    }
                });
            },
            { threshold: 0.1 },
        );
        document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const selectedCar = quoteCars.find(c => c.name === quoteCar);
        const days = quotePickupDate && quoteReturnDate
            ? Math.max(1, Math.ceil((new Date(quoteReturnDate).getTime() - new Date(quotePickupDate).getTime()) / (1000 * 60 * 60 * 24)))
            : 0;
        let subtotal = selectedCar ? days * selectedCar.pricePerDay : 0;
        if (selectedCar && days >= 7) {
            subtotal = subtotal * (1 - selectedCar.weeklyDiscount / 100);
        }

        if (selectedCar && selectedCar.id && days > 0) {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
            fetch(route('taxes.calculate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
                body: JSON.stringify({
                    car_id: selectedCar.id,
                    pickup_location: null,
                    billing_days: days,
                    daily_rate: selectedCar.pricePerDay,
                    subtotal,
                }),
            })
                .then((r) => r.json())
                .then((data) => {
                    setTaxes(data.taxes || []);
                    setTotalTax(data.total_tax || 0);
                    setTotalSurcharge(data.total_surcharge || 0);
                    setTotalTaxDiscount(data.total_discount || 0);
                    const total = subtotal + (data.total_tax || 0) + (data.total_surcharge || 0) - (data.total_discount || 0);
                    animateTotal(displayedTotal, total);
                })
                .catch(() => {
                    setTaxes([]);
                    setTotalTax(0);
                    setTotalSurcharge(0);
                    setTotalTaxDiscount(0);
                    const total = subtotal + subtotal * 0.15 + subtotal * 0.12;
                    animateTotal(displayedTotal, total);
                });
        } else {
            setTaxes([]);
            setTotalTax(0);
            setTotalSurcharge(0);
            setTotalTaxDiscount(0);
            const total = subtotal + subtotal * 0.15 + subtotal * 0.12;
            animateTotal(displayedTotal, total);
        }
    }, [quoteCar, quotePickupDate, quoteReturnDate, quoteCars]);

    const animateTotal = (start: number, end: number) => {
        if (end === start) return;
        const duration = 600;
        const startTime = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayedTotal(start + (end - start) * eased);
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const filteredQuoteCars = quoteCars.filter((car) => {
        const matchesCategory = quoteCategory === 'All' || car.category === quoteCategory;
        const query = quoteSearch.trim().toLowerCase();
        const matchesSearch = !query
            || car.name.toLowerCase().includes(query)
            || car.category.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
    });

    useEffect(() => {
        if (filteredQuoteCars.length > 0 && !filteredQuoteCars.some(c => c.name === quoteCar)) {
            setQuoteCar(filteredQuoteCars[0].name);
        }
    }, [quoteCategory, quoteSearch]);

    const filteredFaqs = faqs.filter((faq) => {
        const matchesCategory = activeFaqCategory === 'All' || faq.category === activeFaqCategory;
        const query = faqSearch.trim().toLowerCase();
        const matchesSearch = !query
            || faq.question.toLowerCase().includes(query)
            || faq.answer.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
    });

    return (
        <>
            <Head title="Home" />
            <GuestLayout canLogin={canLogin} canRegister={canRegister}>

                {/* Hero - Split Layout */}
                <section className="min-h-screen flex flex-col lg:flex-row">
                    {/* Left: Content + Booking */}
                    <div className="lg:w-1/2 bg-brand-900 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-20 lg:py-0 relative overflow-hidden">
                        <div className="absolute top-20 right-10 w-72 h-72 bg-accent-400/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-20 left-10 w-56 h-56 bg-brand-400/10 rounded-full blur-3xl" />

                        <div className="relative z-10 max-w-xl mx-auto lg:mx-0 w-full">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-400/10 text-accent-400 text-xs font-semibold rounded-full border border-accent-400/20 mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                                {heroSettings?.badge_text || 'Premium Car Rental Service'}
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.15] tracking-tight mb-4">
                                {heroSettings?.headline || 'Find Your'}
                                <span className="block gradient-text mt-1">{heroSettings?.headline_highlight || 'Perfect Ride'}</span>
                            </h1>

                            {heroSettings?.tagline ? (
                                <p className="text-accent-400 font-medium text-lg mb-2">{heroSettings.tagline}</p>
                            ) : (
                                <p className="text-accent-400 font-medium text-lg mb-2">{currentTagline}</p>
                            )}
                            <p className="text-surface-400 mb-10 leading-relaxed">
                                {heroSettings?.description || 'Browse our fleet of premium vehicles and hit the road with confidence'}
                            </p>

                            {/* Compact Booking Form */}
                            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Book Your Ride</h3>
                                    {heroSettings?.booking_badge_enabled !== false && (() => {
                                        const iconPath: Record<string, string> = {
                                            tag: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z',
                                            percent: 'M14.25 7.756a4.5 4.5 0 11-8.25-3.568M3 21l18-18M21 14.25a4.5 4.5 0 00-8.25 3.568M9 21l3-3m3-3l3-3',
                                            dollar: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                                            star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
                                            shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
                                            location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
                                        };
                                        return (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 text-xs font-bold rounded-full shadow-lg shadow-accent-400/30">
                                                {heroSettings?.booking_badge_icon && iconPath[heroSettings.booking_badge_icon] ? (
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath[heroSettings.booking_badge_icon]} />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                {heroSettings?.booking_badge_text || 'Exclusive in Palau'}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-surface-400 mb-1.5">Pickup Date</label>
                                        <input
                                            type="date"
                                            value={pickupDate}
                                            onChange={(e) => setPickupDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-surface-400 mb-1.5">Pickup Time</label>
                                        <input
                                            type="time"
                                            value={pickupTime}
                                            onChange={(e) => setPickupTime(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-surface-400 mb-1.5">Pickup Location</label>
                                        <select
                                            value={pickupLocation}
                                            onChange={(e) => setPickupLocation(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition"
                                        >
                                            {locationNames.map((loc) => (
                                                <option key={loc} value={loc} className="bg-brand-900">{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-surface-400 mb-1.5">Return Date</label>
                                        <input
                                            type="date"
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-surface-400 mb-1.5">Return Time</label>
                                        <input
                                            type="time"
                                            value={returnTime}
                                            onChange={(e) => setReturnTime(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-surface-400 mb-1.5">Return Location</label>
                                        <select
                                            value={returnLocation}
                                            onChange={(e) => setReturnLocation(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition"
                                        >
                                            {locationNames.map((loc) => (
                                                <option key={loc} value={loc} className="bg-brand-900">{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2 sm:col-span-3">
                                        <label className="block text-xs font-medium text-surface-400 mb-1.5">Country</label>
                                        <CountrySelect value={country} onChange={setCountry} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="text-xs text-yellow-300 font-medium">Drivers must be at least 25 years old to rent a vehicle</span>
                                </div>
                                <Link
                                    href={route('fleet', {
                                        pickup_date: pickupDate,
                                        pickup_time: pickupTime,
                                        pickup_location: pickupLocation,
                                        return_date: returnDate,
                                        return_time: returnTime,
                                        return_location: returnLocation,
                                        country: country,
                                    })}
                                    className="btn-accent !py-3 w-full mt-4 group text-sm"
                                >
                                    Search Available Cars
                                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>

                            {/* Step Progress Bar */}
                            <div className="mt-8 flex items-center justify-center gap-2 sm:gap-4">
                                {[
                                    { num: '1', label: 'Book', desc: 'Pick dates & location' },
                                    { num: '2', label: 'Choose', desc: 'Select your vehicle' },
                                    { num: '3', label: 'Drive', desc: 'Reserve & hit the road' },
                                ].map((s, i) => (
                                    <div key={s.num} className="flex items-center gap-2 sm:gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-accent-400/20 border border-accent-400/40 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-accent-400">{s.num}</span>
                                            </div>
                                            <div className="hidden sm:block">
                                                <div className="text-xs font-semibold text-white">{s.label}</div>
                                                <div className="text-[10px] text-surface-500">{s.desc}</div>
                                            </div>
                                        </div>
                                        {i < 2 && (
                                            <svg className="w-4 h-4 text-surface-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Mini Stats */}
                            <div className="flex items-center gap-6 mt-5">
                                {[
                                    { value: '50+', label: 'Cars' },
                                    { value: '4', label: 'Locations' },
                                    { value: '10k+', label: 'Happy Clients' },
                                ].map((stat) => (
                                    <div key={stat.label} className="text-center">
                                        <div className="text-xl font-bold text-accent-400">{stat.value}</div>
                                        <div className="text-xs text-surface-500">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Image */}
                    <div className="lg:w-1/2 relative min-h-[50vh] lg:min-h-screen">
                        {heroSettings?.images?.length ? (
                            <>
                                {heroSettings.images.map((img, index) => (
                                    <div
                                        key={img.id}
                                        className={`absolute inset-0 transition-opacity duration-1000 ${
                                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    >
                                        <img
                                            src={`/storage/${img.image_path}`}
                                            alt={img.alt_text || ''}
                                            className="w-full h-full object-cover"
                                        />
                                        {img.tagline && (
                                            <div className={`absolute bottom-0 left-0 right-0 p-8 sm:p-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-all duration-700 ${
                                                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                                            }`}>
                                                <p className="text-white text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-snug">
                                                    {img.tagline}
                                                </p>
                                                <div className="w-12 h-1 bg-accent-400 rounded-full mt-3" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-900/80 via-brand-900/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-brand-900/20" />

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-8 lg:bottom-8 z-20 flex gap-1.5">
                                    {heroSettings.images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentSlide(index)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                index === currentSlide
                                                    ? 'bg-accent-400 w-6'
                                                    : 'bg-white/30 hover:bg-white/50 w-1.5'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : heroSettings?.image_path ? (
                            <>
                                <img
                                    src={`/storage/${heroSettings.image_path}`}
                                    alt="Hero"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-900/80 via-brand-900/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-brand-900/20" />
                            </>
                        ) : (
                            <>
                                {carouselImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`absolute inset-0 transition-opacity duration-1000 ${
                                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.alt}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className={`absolute bottom-0 left-0 right-0 p-8 sm:p-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-all duration-700 ${
                                            index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                                        }`}>
                                            <p className="text-white text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-snug">
                                                {img.tagline}
                                            </p>
                                            <div className="w-12 h-1 bg-accent-400 rounded-full mt-3" />
                                        </div>
                                    </div>
                                ))}
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-900/80 via-brand-900/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-brand-900/20" />

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-8 lg:bottom-8 z-20 flex gap-1.5">
                                    {carouselImages.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentSlide(index)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                index === currentSlide
                                                    ? 'bg-accent-400 w-6'
                                                    : 'bg-white/30 hover:bg-white/50 w-1.5'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* How It Works - Step by Step */}
                <section className="py-20 sm:py-28 bg-surface-50 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-10 left-1/4 w-80 h-80 bg-accent-400/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-brand-400/5 rounded-full blur-3xl" />
                    </div>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="text-center mb-14" data-animate>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-50 text-accent-600 text-sm font-semibold rounded-full border border-accent-100 mb-4">
                                How It Works
                            </span>
                            <h2 className="section-heading mb-2">Rent a Car in Three Simple Steps</h2>
                            <p className="section-subheading">Getting your perfect rental car is quick and hassle-free</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {[
                                {
                                    step: '01',
                                    title: 'Book Dates & Location',
                                    description: 'Select your pickup and return dates, choose from our convenient locations, and instantly see the total cost with no hidden fees.',
                                    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                                },
                                {
                                    step: '02',
                                    title: 'Choose Your Vehicle',
                                    description: 'Browse our diverse fleet — from economy cars to luxury sedans and spacious SUVs. Filter by category or search by name to find your perfect match.',
                                    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
                                },
                                {
                                    step: '03',
                                    title: 'Drive',
                                    description: 'Complete your reservation in seconds. Pick up your car at the selected location and hit the road with confidence, backed by 24/7 support.',
                                    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
                                },
                            ].map((item, i) => (
                                <div
                                    key={item.step}
                                    data-animate
                                    className="opacity-0 translate-y-8 transition-all duration-700 text-center group"
                                    style={{ transitionDelay: `${i * 150}ms` }}
                                >
                                    <div className="bg-white rounded-2xl border border-surface-100 p-8 h-full shadow-sm hover:shadow-md hover:border-surface-200 transition-all">
                                        <div className="relative inline-flex items-center justify-center mb-5">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-400/25 group-hover:scale-105 transition-transform duration-300">
                                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={item.icon} />
                                                </svg>
                                            </div>
                                            <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-900 text-white text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-white">
                                                {item.step}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-surface-900 mb-2">{item.title}</h3>
                                        <p className="text-sm text-surface-500 leading-relaxed">{item.description}</p>
                                    </div>

                                    {i < 2 && (
                                        <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-[calc(100%-8px)] w-6 z-10">
                                            <svg className="w-6 h-6 text-accent-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto" data-animate>
                            {[
                                { value: String(totalCars), label: 'Vehicles in Fleet' },
                                { value: String(locations.length), label: 'Pickup Locations' },
                                { value: '15 min', label: 'Average Booking Time' },
                                { value: '4.8 ★', label: 'Customer Rating' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center px-3 py-4 rounded-xl bg-white border border-surface-100 shadow-sm">
                                    <div className="text-xl font-bold text-brand-800 mb-0.5">{stat.value}</div>
                                    <div className="text-xs text-surface-500 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features - Modern Card Grid */}
                <section className="py-20 sm:py-28 bg-brand-900 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-10 left-1/4 w-80 h-80 bg-accent-400/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl" />
                    </div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="text-center mb-14" data-animate>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-400/10 text-accent-400 text-sm font-semibold rounded-full border border-accent-400/20 mb-4">
                                Why Choose Us
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">{whyChooseUsHeading || 'Built for a Better Rental Experience'}</h2>
                            <p className="text-surface-400 max-w-2xl mx-auto">{whyChooseUsSubheading || 'We go the extra mile to make every rental smooth, transparent, and enjoyable from start to finish.'}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
                            {(whyChooseUsItems && whyChooseUsItems.length > 0
                                ? whyChooseUsItems.map(item => ({
                                    icon: item.icon_svg ?? '',
                                    title: item.title,
                                    description: item.description ?? '',
                                  }))
                                : features
                            ).map((item, i) => (
                                <div
                                    key={i}
                                    data-animate
                                    className="opacity-0 translate-y-8 transition-all duration-500 group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 hover:bg-white/10 hover:border-accent-400/30 hover:shadow-xl hover:shadow-accent-400/5 hover:-translate-y-0.5 transition-all cursor-default"
                                    style={{ transitionDelay: `${i * 80}ms` }}
                                >
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-400/20 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        <WhyChooseUsIcon icon={item.icon} className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                                    <p className="text-sm text-surface-400 leading-relaxed">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Fleet Highlights */}
                <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-accent-400/5 to-transparent rounded-full blur-3xl" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-6">
                            <div data-animate>
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-50 text-accent-600 text-sm font-semibold rounded-full border border-accent-100 mb-4">
                                    Our Fleet
                                </span>
                                <h2 className="section-heading mb-2">Explore Our Vehicles</h2>
                                <p className="section-subheading">From economy to luxury, we have the perfect car for every occasion</p>
                            </div>
                            <Link
                                href={route('fleet')}
                                className="text-brand-700 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all whitespace-nowrap group"
                            >
                                View Full Fleet
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {fleetHighlights.map((car, i) => (
                                <div
                                    key={i}
                                    data-animate
                                    className="opacity-0 translate-y-8 transition-all duration-700 group rounded-2xl border border-surface-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all bg-white"
                                    style={{ transitionDelay: `${i * 100}ms` }}
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-100">
                                        {/* Blurred background layer for images with different aspect ratios */}
                                        <img
                                            src={car.img}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60"
                                        />
                                        <img
                                            src={car.img}
                                            alt={car.name}
                                            className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 bg-brand-900/80 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
                                                {car.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-surface-900 mb-1">{car.name}</h3>
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg
                                                        key={star}
                                                        className={`w-3.5 h-3.5 ${star <= Math.round(car.rating) ? 'text-accent-400' : 'text-surface-200'}`}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium text-surface-600">{car.rating}</span>
                                            <span className="text-xs text-surface-400">({car.reviews})</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-surface-500 mb-3">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {car.seats} Seats
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {car.transmission}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-xl font-bold text-brand-800">${formatCurrency(Number(car.price))}</span>
                                                <span className="text-xs text-surface-500">/day</span>
                                            </div>
                                            <Link
                                                href={route('fleet')}
                                                className="w-9 h-9 rounded-xl bg-brand-800 text-white flex items-center justify-center hover:bg-brand-700 transition-colors group/btn"
                                            >
                                                <svg className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials - Asymmetric Layout */}
                <section className="py-20 sm:py-28 bg-brand-900 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-10 left-1/4 w-80 h-80 bg-accent-400/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl" />
                    </div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="text-center mb-14" data-animate>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-400/10 text-accent-400 text-sm font-semibold rounded-full border border-accent-400/20 mb-4">
                                Testimonials
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">What Our Customers Say</h2>
                            <p className="text-surface-400 max-w-lg mx-auto">Trusted by thousands of happy drivers across the country</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-5">
                            {testimonials.map((t, i) => (
                                <div
                                    key={i}
                                    data-animate
                                    className={`opacity-0 translate-y-8 transition-all duration-700 rounded-2xl p-6 sm:p-7 border border-white/10 group ${
                                        i === 1
                                            ? 'bg-white/10 md:-translate-y-3'
                                            : 'bg-white/5 hover:bg-white/10 hover:border-white/20'
                                    }`}
                                    style={{ transitionDelay: `${i * 120}ms` }}
                                >
                                    <div className="flex gap-0.5 mb-4">
                                        {[...Array(t.rating)].map((_, j) => (
                                            <svg key={j} className="w-4 h-4 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="text-surface-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-brand-900 font-bold text-xs">
                                            {t.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{t.name}</div>
                                            <div className="text-xs text-surface-500">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Instant Pricing - Light */}
                <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-accent-400/5 to-transparent rounded-full blur-3xl" />
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="text-center mb-12" data-animate>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-50 text-accent-600 text-sm font-semibold rounded-full border border-accent-100 mb-4">
                                Instant Pricing
                            </span>
                            <h2 className="section-heading mb-3">Get a Quick Quote</h2>
                            <p className="section-subheading">Pick your ride and dates — see the estimated cost instantly, no commitment required.</p>
                        </div>

                        {/* Card - 2 Column */}
                        <div data-animate className="opacity-0 translate-y-8 transition-all duration-700">
                            <div className="bg-white rounded-3xl shadow-xl shadow-surface-200/50 border border-surface-100 overflow-hidden">
                                <div className="grid lg:grid-cols-5">

                                    {/* Left: Vehicle + Dates */}
                                    <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-surface-100 flex flex-col">

                                        {/* Header: Search + Category Filter */}
                                        <div className="p-6 sm:p-8 pb-4">
                                            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Choose Your Vehicle</h3>
                                            <div className="relative mb-3">
                                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or category..."
                                                    value={quoteSearch}
                                                    onChange={(e) => setQuoteSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition"
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {quoteCategories.map((cat) => {
                                                    const count = cat === 'All'
                                                        ? quoteCars.length
                                                        : quoteCars.filter(c => c.category === cat).length;
                                                    const isActive = quoteCategory === cat;
                                                    return (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setQuoteCategory(cat)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                                                                isActive
                                                                    ? 'bg-brand-800 text-white shadow-sm'
                                                                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                                                            }`}
                                                        >
                                                            {cat}
                                                            <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                                                                isActive ? 'bg-white/20 text-white' : 'bg-white text-surface-500'
                                                            }`}>
                                                                {count}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Vehicle List - Scrollable */}
                                        <div className="px-6 sm:px-8">
                                            <div className="border border-surface-100 rounded-2xl overflow-hidden bg-white">
                                                <div className="max-h-[260px] overflow-y-auto">
                                                    {filteredQuoteCars.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-2">
                                                                <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-surface-500 text-sm font-medium">No vehicles match your search</p>
                                                            <button
                                                                onClick={() => { setQuoteSearch(''); setQuoteCategory('All'); }}
                                                                className="text-xs text-brand-700 font-semibold mt-1.5 hover:underline"
                                                            >
                                                                Clear filters
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        filteredQuoteCars.map((car) => (
                                                            <button
                                                                key={car.name}
                                                                onClick={() => setQuoteCar(car.name)}
                                                                className={`w-full flex items-center gap-3 p-3 text-left transition-all border-b border-surface-100 last:border-b-0 ${
                                                                    quoteCar === car.name
                                                                        ? 'bg-brand-50/60'
                                                                        : 'hover:bg-surface-50'
                                                                }`}
                                                            >
                                                                <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-100">
                                                                    <img
                                                                        src={car.img}
                                                                        alt={car.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="font-semibold text-surface-900 text-sm truncate">{car.name}</span>
                                                                        <span className="px-1.5 py-0.5 bg-surface-100 text-surface-600 text-[10px] font-medium rounded shrink-0">
                                                                            {car.category}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-xs text-surface-500">
                                                                        <svg className="w-3 h-3 text-accent-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                        <span className="font-medium text-surface-600">{car.rating}</span>
                                                                        <span className="text-surface-300">·</span>
                                                                        <span className="font-semibold text-brand-700">${car.pricePerDay}/day</span>
                                                                    </div>
                                                                </div>
                                                                {quoteCar === car.name && (
                                                                    <div className="w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center shrink-0 shadow-sm">
                                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            {filteredQuoteCars.length > 0 && (
                                                <p className="text-[11px] text-surface-500 mt-2 px-1">
                                                    Showing {filteredQuoteCars.length} of {quoteCars.length} vehicles
                                                </p>
                                            )}
                                        </div>

                                        {/* Date Selection */}
                                        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 mt-auto">
                                            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-surface-500 mb-1.5">Pickup Date</label>
                                                    <input
                                                        type="date"
                                                        value={quotePickupDate}
                                                        onChange={(e) => setQuotePickupDate(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition"
                                                    />
                                                </div>
                                                <div className="hidden sm:flex items-center pb-3">
                                                    <svg className="w-5 h-5 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-surface-500 mb-1.5">Return Date</label>
                                                    <input
                                                        type="date"
                                                        value={quoteReturnDate}
                                                        onChange={(e) => setQuoteReturnDate(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Cost Breakdown */}
                                    <div className="lg:col-span-2 bg-surface-50/50">
                                        {(() => {
                                            const selectedCar = quoteCars.find(c => c.name === quoteCar);
                                            const days = quotePickupDate && quoteReturnDate
                                                ? Math.max(1, Math.ceil((new Date(quoteReturnDate).getTime() - new Date(quotePickupDate).getTime()) / (1000 * 60 * 60 * 24)))
                                                : 0;
                                            let subtotal = selectedCar ? days * selectedCar.pricePerDay : 0;
                                            if (selectedCar && days >= 7) {
                                                subtotal = subtotal * (1 - selectedCar.weeklyDiscount / 100);
                                            }
                                            const hasSelection = days > 0;
                                            const addTaxes = taxes.filter(t => t.add_or_minus);
                                            const minusTaxes = taxes.filter(t => !t.add_or_minus);

                                            return (
                                                <div className={`p-6 sm:p-8 h-full flex flex-col transition-all duration-500 ${hasSelection ? 'opacity-100' : 'opacity-60'}`}>
                                                    <div className="flex items-center justify-between mb-5">
                                                        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Estimated Cost</h3>
                                                        {hasSelection && (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-100">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                                Live Quote
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="space-y-0 flex-1">
                                                        <div className="flex justify-between items-center py-2.5 border-b border-surface-100">
                                                            <span className="text-surface-500 text-sm">Vehicle</span>
                                                            <span className="text-surface-900 font-medium text-sm">{selectedCar?.name}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2.5 border-b border-surface-100">
                                                            <span className="text-surface-500 text-sm">Rate</span>
                                                            <span className="text-surface-900 font-medium text-sm">${formatCurrency(selectedCar?.pricePerDay ?? 0)}/day</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2.5 border-b border-surface-100">
                                                            <span className="text-surface-500 text-sm">Duration</span>
                                                            <span className="text-surface-900 font-medium text-sm">
                                                                {hasSelection ? `${days} day${days > 1 ? 's' : ''}` : 'Select dates'}
                                                            </span>
                                                        </div>
                                                        {hasSelection && days >= 7 && selectedCar && (
                                                            <div className="flex items-center gap-2 py-2.5 border-b border-surface-100">
                                                                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="text-green-600 text-xs font-medium">
                                                                    {selectedCar.weeklyDiscount}% weekly discount applied (7+ days)
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center py-2.5 border-b border-surface-100">
                                                            <span className="text-surface-500 text-sm">Subtotal</span>
                                                            <span className="text-surface-900 font-medium text-sm">${formatCurrency(subtotal)}</span>
                                                        </div>
                                                        {addTaxes.map((taxItem) => (
                                                            <div key={taxItem.id} className="flex justify-between items-center py-2.5 border-b border-surface-100">
                                                                <span className="text-surface-500 text-sm">{taxItem.tax_desc}</span>
                                                                <span className="text-surface-900 font-medium text-sm">+${formatCurrency(taxItem.amount)}</span>
                                                            </div>
                                                        ))}
                                                        {totalSurcharge > 0 && (
                                                            <div className="flex justify-between items-center py-2.5 border-b border-surface-100">
                                                                <span className="text-surface-500 text-sm">Surcharges</span>
                                                                <span className="text-surface-900 font-medium text-sm">+${formatCurrency(totalSurcharge)}</span>
                                                            </div>
                                                        )}
                                                        {minusTaxes.map((taxItem) => (
                                                            <div key={taxItem.id} className="flex justify-between items-center py-2.5 border-b border-surface-100">
                                                                <span className="text-surface-500 text-sm">{taxItem.tax_desc}</span>
                                                                <span className="text-green-600 font-medium text-sm">-${formatCurrency(taxItem.amount)}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between items-center pt-3">
                                                            <span className="text-surface-900 font-bold">Total</span>
                                                            <span className="text-2xl font-bold text-brand-800 tabular-nums">
                                                                ${formatCurrency(displayedTotal)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Perks */}
                                                    <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-surface-100">
                                                        {[
                                                            { icon: 'M5 13l4 4L19 7', label: 'Free Cancellation' },
                                                            { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Fully Insured' },
                                                            { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'No Hidden Fees' },
                                                        ].map((perk) => (
                                                            <div key={perk.label} className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={perk.icon} />
                                                                </svg>
                                                                <span className="text-xs font-medium text-surface-600">{perk.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <Link
                                                        href={route('fleet')}
                                                        className="btn-accent !py-3 w-full mt-5 group text-sm"
                                                    >
                                                        Book This Car
                                                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section - Modern */}
                <section className="py-20 sm:py-28 bg-surface-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent-400/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-400/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="text-center mb-12" data-animate>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-50 text-accent-600 text-sm font-semibold rounded-full border border-accent-100 mb-4">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Help Center
                            </span>
                            <h2 className="section-heading mb-3">Frequently Asked Questions</h2>
                            <p className="section-subheading max-w-2xl mx-auto">Find quick answers to common questions. Can't find what you're looking for? Our team is here to help 24/7.</p>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
                            {/* Sidebar */}
                            <div className="lg:col-span-4 space-y-4">
                                {/* Search */}
                                <div className="relative" data-animate>
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={faqSearch}
                                        onChange={(e) => setFaqSearch(e.target.value)}
                                        className="w-full pl-11 pr-10 py-3 rounded-2xl border border-surface-200 bg-white text-surface-900 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition shadow-sm"
                                    />
                                    {faqSearch && (
                                        <button
                                            onClick={() => setFaqSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition"
                                            aria-label="Clear search"
                                        >
                                            <svg className="w-3 h-3 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Categories */}
                                <div className="bg-white rounded-2xl border border-surface-100 p-2 shadow-sm" data-animate>
                                    {faqCategories.map((cat) => {
                                        const count = cat.name === 'All' ? faqs.length : faqs.filter(f => f.category === cat.name).length;
                                        const isActive = activeFaqCategory === cat.name;
                                        return (
                                            <button
                                                key={cat.name}
                                                onClick={() => setActiveFaqCategory(cat.name)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                    isActive
                                                        ? 'bg-brand-800 text-white shadow-sm'
                                                        : 'text-surface-700 hover:bg-surface-50'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                    isActive ? 'bg-white/15' : 'bg-surface-100'
                                                }`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={cat.icon} />
                                                    </svg>
                                                </div>
                                                <span className="flex-1 text-left">{cat.name}</span>
                                                <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 min-w-[24px] text-center ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500'
                                                }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Contact Card */}
                                <div className="bg-gradient-to-br from-brand-900 to-brand-800 rounded-2xl p-6 relative overflow-hidden" data-animate>
                                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent-400/15 rounded-full blur-2xl pointer-events-none" />
                                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-brand-400/15 rounded-full blur-2xl pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-accent-400/20 flex items-center justify-center mb-3">
                                            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-white font-bold mb-1 text-base">Still have questions?</h4>
                                        <p className="text-surface-300 text-xs mb-4 leading-relaxed">Our friendly support team is available around the clock to help you.</p>
                                        <Link
                                            href={route('fleet')}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-400 text-brand-900 text-xs font-bold rounded-lg hover:bg-accent-500 transition-colors group"
                                        >
                                            Contact Support
                                            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ List */}
                            <div className="lg:col-span-8">
                                <div className="flex items-center justify-between mb-4 px-1" data-animate>
                                    <div>
                                        <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                                            {activeFaqCategory === 'All' ? 'All Questions' : activeFaqCategory}
                                            <span className="px-2 py-0.5 bg-surface-200 text-surface-600 text-xs font-semibold rounded-md">
                                                {filteredFaqs.length}
                                            </span>
                                        </h3>
                                        <p className="text-xs text-surface-500 mt-0.5">
                                            {filteredFaqs.length === 1 ? '1 question' : `${filteredFaqs.length} questions`} found
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setExpandAllFaqs(!expandAllFaqs);
                                            setOpenFaqIndex(null);
                                        }}
                                        className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition"
                                    >
                                        {expandAllFaqs ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                                </svg>
                                                Collapse all
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                                Expand all
                                            </>
                                        )}
                                    </button>
                                </div>

                                {filteredFaqs.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-surface-100 p-12 text-center" data-animate>
                                        <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <h4 className="font-semibold text-surface-900 mb-1">No questions found</h4>
                                        <p className="text-sm text-surface-500 mb-4">Try a different search term or category</p>
                                        <button
                                            onClick={() => { setFaqSearch(''); setActiveFaqCategory('All'); }}
                                            className="text-xs font-semibold text-brand-700 hover:underline inline-flex items-center gap-1"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Clear filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredFaqs.map((faq, i) => {
                                            const isOpen = expandAllFaqs || openFaqIndex === i;
                                            return (
                                                <div
                                                    key={`${activeFaqCategory}-${i}`}
                                                    data-animate
                                                    className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                                                        isOpen
                                                            ? 'bg-white border-brand-200 shadow-lg shadow-brand-900/5'
                                                            : 'bg-white border-surface-100 hover:border-surface-200 hover:shadow-sm'
                                                    }`}
                                                    style={{ transitionDelay: `${i * 60}ms` }}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            if (expandAllFaqs) {
                                                                setExpandAllFaqs(false);
                                                                setOpenFaqIndex(i);
                                                            } else {
                                                                setOpenFaqIndex(openFaqIndex === i ? null : i);
                                                            }
                                                        }}
                                                        className="w-full flex items-start gap-4 p-5 text-left"
                                                    >
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                                            isOpen
                                                                ? 'bg-brand-800 text-white'
                                                                : 'bg-surface-100 text-surface-600 group-hover:bg-brand-50 group-hover:text-brand-700'
                                                        }`}>
                                                            {String(i + 1).padStart(2, '0')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                <h4 className={`font-semibold text-sm transition-colors ${
                                                                    isOpen ? 'text-brand-900' : 'text-surface-900 group-hover:text-brand-800'
                                                                }`}>
                                                                    {faq.question}
                                                                </h4>
                                                                {faq.popular && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-50 text-accent-600 text-[10px] font-bold rounded-full border border-accent-100">
                                                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                        Popular
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] text-surface-500 font-medium inline-flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                </svg>
                                                                {faq.category}
                                                            </span>
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                                                            isOpen
                                                                ? 'bg-brand-100 text-brand-700'
                                                                : 'bg-surface-50 text-surface-500 group-hover:bg-surface-100'
                                                        }`}>
                                                            <svg
                                                                className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    <div className={`grid transition-all duration-300 ease-out ${
                                                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                                    }`}>
                                                        <div className="overflow-hidden">
                                                            <div className="px-5 pb-5 sm:pl-[4.75rem]">
                                                                <div className="pt-3 border-t border-surface-100">
                                                                    <p className="text-sm text-surface-600 leading-relaxed pt-3">
                                                                        {faq.answer}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 pt-3 border-t border-surface-100">
                                                                        <span className="text-xs text-surface-500 font-medium">Was this helpful?</span>
                                                                        <button className="text-xs font-semibold text-surface-600 hover:text-brand-700 flex items-center gap-1.5 transition px-2 py-1 rounded-md hover:bg-surface-50">
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                                            </svg>
                                                                            Yes
                                                                        </button>
                                                                        <button className="text-xs font-semibold text-surface-600 hover:text-brand-700 flex items-center gap-1.5 transition px-2 py-1 rounded-md hover:bg-surface-50">
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                                                            </svg>
                                                                            No
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

            </GuestLayout>
        </>
    );
}