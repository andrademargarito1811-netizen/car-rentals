import { useState, useEffect, useRef } from 'react';

export interface TestimonialData {
    id: number;
    name: string;
    role: string | null;
    content: string;
    avatar_url: string | null;
    rating: number;
}

function TestimonialCard({ data, className }: { data: TestimonialData; className?: string }) {
    return (
        <div className={`rounded-2xl p-6 sm:p-7 border transition-all duration-500 ease-out ${className ?? ''}`}>
            <div className="flex gap-0.5 mb-4">
                {[...Array(data.rating)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
            <p className="text-surface-300 text-sm leading-relaxed mb-6">&ldquo;{data.content}&rdquo;</p>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-brand-900 font-bold text-xs">
                    {data.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                    <div className="text-sm font-semibold text-white">{data.name}</div>
                    {data.role && <div className="text-xs text-surface-500">{data.role}</div>}
                </div>
            </div>
        </div>
    );
}

export default function Testimonials({ items }: { items: TestimonialData[] }) {
    if (items.length === 0) return null;

    const total = items.length;
    const [activeIndex, setActiveIndex] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const goTo = (index: number) => {
        const next = ((index % total) + total) % total;
        setActiveIndex(next);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setActiveIndex((prev) => (prev + 1) % total), 4000);
    };

    const goNext = () => goTo(activeIndex + 1);
    const goPrev = () => goTo(activeIndex - 1);

    useEffect(() => {
        intervalRef.current = setInterval(() => setActiveIndex((prev) => (prev + 1) % total), 4000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [total]);

    const active = items[activeIndex];
    const prevIdx = (activeIndex - 1 + total) % total;
    const nextIdx = (activeIndex + 1) % total;

    return (
        <section className="py-20 sm:py-28 bg-brand-900 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-1/4 w-80 h-80 bg-accent-400/5 rounded-full blur-3xl animate-[blurFloat_8s_ease-in-out_infinite]" />
                <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl animate-[blurFloat_8s_ease-in-out_infinite_3s]" />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center mb-14" data-animate>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-400/10 text-accent-400 text-sm font-semibold rounded-full border border-accent-400/20 mb-4">
                        Testimonials
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                        What Our Customers Say
                    </h2>
                    <p className="text-surface-400 max-w-lg mx-auto">
                        Trusted by thousands of happy drivers across the country
                    </p>
                </div>

                <div
                    className="relative"
                    onMouseEnter={() => { if (intervalRef.current) clearInterval(intervalRef.current); }}
                    onMouseLeave={() => {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        intervalRef.current = setInterval(() => setActiveIndex((prev) => (prev + 1) % total), 4000);
                    }}
                >
                    {/* Mobile: single card */}
                    <div className="lg:hidden max-w-md mx-auto">
                        <div key={activeIndex} className="animate-[cardEnter_0.4s_ease-out]">
                            <TestimonialCard
                                data={active}
                                className="bg-white/[0.1] border-accent-400/40 ring-1 ring-accent-400/20"
                            />
                        </div>
                    </div>

                    {/* Desktop: peak layout with fixed slots */}
                    <div className="hidden lg:flex items-start justify-center px-8">
                        <div className="w-[30%] scale-90 opacity-50 mt-14 z-10 -mr-[2%] transition-all duration-500 ease-out">
                            <div key={prevIdx} className="animate-[cardEnter_0.4s_ease-out]">
                                <TestimonialCard
                                    data={items[prevIdx]}
                                    className="bg-white/5 border-white/5"
                                />
                            </div>
                        </div>
                        <div className="w-[34%] scale-105 z-20 transition-all duration-500 ease-out">
                            <div key={activeIndex} className="animate-[cardEnter_0.4s_ease-out]">
                                <TestimonialCard
                                    data={active}
                                    className="bg-white/[0.1] border-accent-400/40 ring-1 ring-accent-400/20 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.4)] animate-[glowPulse_4s_ease-in-out_infinite]"
                                />
                            </div>
                        </div>
                        <div className="w-[30%] scale-90 opacity-50 mt-14 z-10 -ml-[2%] transition-all duration-500 ease-out">
                            <div key={nextIdx} className="animate-[cardEnter_0.4s_ease-out_0.05s]">
                                <TestimonialCard
                                    data={items[nextIdx]}
                                    className="bg-white/5 border-white/5"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={goPrev}
                        className="absolute left-0 lg:left-[-8px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-800/80 border border-white/10 text-white flex items-center justify-center hover:bg-brand-700 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-sm"
                        aria-label="Previous testimonial"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goNext}
                        className="absolute right-0 lg:right-[-8px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-800/80 border border-white/10 text-white flex items-center justify-center hover:bg-brand-700 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-sm"
                        aria-label="Next testimonial"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="flex justify-center mt-10">
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                        <span
                            key={activeIndex}
                            className="block h-full bg-accent-400 rounded-full"
                            style={{ animation: 'embla-progress 4s linear' }}
                        />
                    </div>
                </div>
            </div>
            <style>{`
@keyframes embla-progress {
    from { width: 0%; }
    to { width: 100%; }
}
@keyframes cardEnter {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes glowPulse {
    0%, 100% { box-shadow: 0 8px 30px -5px rgba(0,0,0,0.4); }
    50% { box-shadow: 0 8px 30px -5px rgba(0,0,0,0.4), 0 0 30px -5px rgba(251,191,36,0.12); }
}
@keyframes blurFloat {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
    50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
}
`}</style>
        </section>
    );
}
