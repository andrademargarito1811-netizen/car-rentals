import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRoute } from 'ziggy-js';
import QuickBookingPanel from './QuickBookingPanel';

interface Booking {
    id: number;
    start_date: string;
    end_date: string;
    pickup_time: string | null;
    return_time: string | null;
    status: string;
    user: { name: string } | null;
    guest: { first_name: string; last_name: string; phone: string | null; email: string | null } | null;
}

function parseBookingStart(b: { start_date: string; pickup_time: string | null }): Date {
    const [y, m, d] = b.start_date.split('-').map(Number);
    const [h, mn, s] = (b.pickup_time || '00:00').split(':').map(Number);
    return new Date(y, m - 1, d, h, mn, s || 0);
}
function parseBookingEnd(b: { end_date: string; return_time: string | null }): Date {
    const [y, m, d] = b.end_date.split('-').map(Number);
    const [h, mn, s] = (b.return_time || '23:59').split(':').map(Number);
    return new Date(y, m - 1, d, h, mn, s || 0);
}
function parseBookingEndWithBuffer(b: { end_date: string; return_time: string | null }, graceMinutes: number = 30): Date {
    const date = parseBookingEnd(b);
    date.setMinutes(date.getMinutes() + graceMinutes);
    return date;
}

interface Car {
    id: number;
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    color: string | null;
    image_path: string | null;
    daily_rate: number;
    grace_minutes: number;
    location: { location: string } | null;
    availability: { available_desc: string } | null;
    bookings: Booking[];
}

interface Location {
    location_id: number;
    location: string;
    address: string | null;
}

interface ScheduleProps {
    cars: Car[];
    locations?: Location[];
    bookingTerms?: string | null;
    initialCarId?: number | null;
}

const MULTI_CAR_COLORS = [
    { bg: 'bg-blue-400', ring: 'ring-blue-400/60', bar: 'bg-gradient-to-r from-blue-400 to-blue-500', dot: 'bg-blue-400' },
    { bg: 'bg-red-400', ring: 'ring-red-400/60', bar: 'bg-gradient-to-r from-red-400 to-red-500', dot: 'bg-red-400' },
    { bg: 'bg-emerald-400', ring: 'ring-emerald-400/60', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500', dot: 'bg-emerald-400' },
    { bg: 'bg-purple-400', ring: 'ring-purple-400/60', bar: 'bg-gradient-to-r from-purple-400 to-purple-500', dot: 'bg-purple-400' },
    { bg: 'bg-amber-400', ring: 'ring-amber-400/60', bar: 'bg-gradient-to-r from-amber-400 to-amber-500', dot: 'bg-amber-400' },
    { bg: 'bg-pink-400', ring: 'ring-pink-400/60', bar: 'bg-gradient-to-r from-pink-400 to-pink-500', dot: 'bg-pink-400' },
    { bg: 'bg-cyan-400', ring: 'ring-cyan-400/60', bar: 'bg-gradient-to-r from-cyan-400 to-cyan-500', dot: 'bg-cyan-400' },
    { bg: 'bg-orange-400', ring: 'ring-orange-400/60', bar: 'bg-gradient-to-r from-orange-400 to-orange-500', dot: 'bg-orange-400' },
];

function statusConfig(status: string) {
    const map: Record<string, { badge: string; bar: string; dot: string }> = {
        pending: {
            badge: 'badge-pending',
            bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
            dot: 'bg-amber-400',
        },
        confirmed: {
            badge: 'badge-confirmed',
            bar: 'bg-gradient-to-r from-blue-400 to-blue-500',
            dot: 'bg-blue-400',
        },
        active: {
            badge: 'badge-active',
            bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
            dot: 'bg-emerald-400',
        },
        completed: {
            badge: 'badge-completed',
            bar: 'bg-gradient-to-r from-surface-300 to-surface-400',
            dot: 'bg-surface-300',
        },
        cancelled: {
            badge: 'badge-cancelled',
            bar: 'bg-gradient-to-r from-red-400 to-red-500',
            dot: 'bg-red-400',
        },
    };
    return map[status] || map.completed;
}

function getName(b: Booking) {
    return b.user?.name ?? (b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : 'Guest');
}

function conflictSpansDay(conflicts: { booking1: Booking; booking2: Booking }[] | undefined, iso: string): boolean {
    if (!conflicts) return false;
    return conflicts.some(({ booking1, booking2 }) => {
        const onDay = (b: Booking) => b.start_date.slice(0, 10) <= iso && b.end_date.slice(0, 10) >= iso;
        return onDay(booking1) && onDay(booking2);
    });
}

function pendingConflictSpansDay(conflicts: { pending: Booking; confirmed: Booking }[] | undefined, iso: string): boolean {
    if (!conflicts) return false;
    return conflicts.some(({ pending, confirmed }) => {
        const onDay = (b: Booking) => b.start_date.slice(0, 10) <= iso && b.end_date.slice(0, 10) >= iso;
        return onDay(pending) && onDay(confirmed);
    });
}

function carColorClass(color: string | null) {
    if (!color) return 'bg-gradient-to-br from-accent-400 to-accent-500';
    const map: Record<string, string> = {
        white: 'bg-gray-100 border border-gray-300',
        black: 'bg-gray-900',
        silver: 'bg-gray-300',
        gray: 'bg-gray-400',
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-400',
        orange: 'bg-orange-500',
        brown: 'bg-amber-700',
        navy: 'bg-blue-900',
        burgundy: 'bg-red-800',
        beige: 'bg-amber-100 border border-amber-300',
    };
    return map[color.toLowerCase()] || 'bg-gradient-to-br from-accent-400 to-accent-500';
}

function toLocalDateStr(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fmtTime(d: Date): string {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtBookingRange(b: Booking): string {
    const start = parseBookingStart(b);
    const end = parseBookingEnd(b);
    const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    let s = start.toLocaleDateString('en-US', dateOpts);
    let e = end.toLocaleDateString('en-US', dateOpts);
    if (b.pickup_time) s += ' ' + fmtTime(start);
    if (b.return_time) e += ' ' + fmtTime(end);
    return s + ' → ' + e;
}

function getDatesBetween(start: string, end: string): string[] {
    const dates: string[] = [];
    const cursor = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    while (cursor <= endDate) {
        dates.push(toLocalDateStr(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
}

function heatmapIntensity(count: number): string {
    if (count === 0) return '';
    if (count <= 2) return 'bg-gradient-to-b from-accent-100/30 to-transparent dark:from-accent-400/5';
    if (count <= 4) return 'bg-gradient-to-b from-accent-200/40 to-transparent dark:from-accent-400/10';
    if (count <= 7) return 'bg-gradient-to-b from-accent-300/50 to-transparent dark:from-accent-400/15';
    return 'bg-gradient-to-b from-accent-400/60 to-transparent dark:from-accent-400/20';
}

export default function Schedule({ cars, locations, bookingTerms, initialCarId = null }: ScheduleProps) {
    const route = useRoute();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = toLocalDateStr(today);

    const [selectedCarIds, setSelectedCarIds] = useState<number[]>(
        () => {
            const fromUrl = initialCarId && cars.some((c) => c.id === initialCarId) ? [initialCarId] : [];
            return fromUrl.length > 0 ? fromUrl : (cars.length > 0 ? [cars[0].id] : []);
        }
    );
    const [selectedDate, setSelectedDate] = useState<string>(todayIso);
    const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');
    const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);
    const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
    const [showQuickForm, setShowQuickForm] = useState(false);
    const [expandedContactId, setExpandedContactId] = useState<number | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'available' | 'booked'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'rate' | 'year' | 'plate'>('name');
    const [favorites, setFavorites] = useState<number[]>(() => {
        try { return JSON.parse(localStorage.getItem('car_schedule_favs') || '[]'); }
        catch { return []; }
    });
    const [showColorLegend, setShowColorLegend] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    useEffect(() => {
        if (!window.Echo) return;

        const pusher = (window.Echo as any).connector?.pusher;

        const onEvent = () => router.reload({ only: ['cars'] });

        const doListen = () => {
            try {
                const channel = window.Echo!.private('admin.bookings');
                channel.listen('.booking.created', onEvent);
                channel.listen('.booking.updated', onEvent);
                return () => {
                    channel.stopListening('.booking.created', onEvent);
                    channel.stopListening('.booking.updated', onEvent);
                    window.Echo!.leave('admin.bookings');
                };
            } catch {
                return undefined;
            }
        };

        let cleanup: (() => void) | undefined;

        if (pusher?.connection?.state === 'connected') {
            cleanup = doListen();
        } else if (pusher?.connection) {
            const onConnected = () => { cleanup = doListen(); };
            pusher.connection.bind('connected', onConnected);
            cleanup = () => pusher.connection.unbind('connected', onConnected);
        }

        return () => { if (cleanup) cleanup(); };
    }, []);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = toLocalDateStr(tomorrow);

    const prevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    const goToToday = () => {
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(todayIso);
        setSelectedRange(null);
    };

    const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();

    const filteredCars = useMemo(() => {
        let result = [...cars];
        const q = searchTerm.toLowerCase();
        if (q) {
            result = result.filter(
                (c) =>
                    c.brand.toLowerCase().includes(q) ||
                    c.model.toLowerCase().includes(q) ||
                    c.license_plate.toLowerCase().includes(q) ||
                    `${c.brand} ${c.model}`.toLowerCase().includes(q)
            );
        }
        if (filterMode === 'available') {
            result = result.filter(
                (c) => !c.bookings.some(
                    (b) => todayIso >= b.start_date.slice(0, 10) && todayIso <= b.end_date.slice(0, 10)
                )
            );
        } else if (filterMode === 'booked') {
            result = result.filter(
                (c) => c.bookings.some(
                    (b) => todayIso >= b.start_date.slice(0, 10) && todayIso <= b.end_date.slice(0, 10)
                )
            );
        }
        result.sort((a, b) => {
            const aFav = favorites.includes(a.id) ? 0 : 1;
            const bFav = favorites.includes(b.id) ? 0 : 1;
            if (aFav !== bFav) return aFav - bFav;
            switch (sortBy) {
                case 'name': return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
                case 'rate': return a.daily_rate - b.daily_rate;
                case 'year': return b.year - a.year;
                case 'plate': return a.license_plate.localeCompare(b.license_plate);
                default: return 0;
            }
        });
        return result;
    }, [cars, searchTerm, filterMode, sortBy, favorites, todayIso]);

    const selectedCars = useMemo(
        () => cars.filter((c) => selectedCarIds.includes(c.id)),
        [cars, selectedCarIds]
    );

    const rangeDates = useMemo(() => {
        if (!selectedRange) return null;
        return getDatesBetween(selectedRange.start, selectedRange.end);
    }, [selectedRange]);

    useEffect(() => {
        const valid = selectedCarIds.filter((id) => cars.some((c) => c.id === id));
        if (valid.length === 0 && cars.length > 0) {
            setSelectedCarIds([cars[0].id]);
        } else if (valid.length !== selectedCarIds.length) {
            setSelectedCarIds(valid);
        }
    }, [cars, selectedCarIds]);

    useEffect(() => {
        localStorage.setItem('car_schedule_favs', JSON.stringify(favorites));
    }, [favorites]);

    // Preselect the car requested via ?car= when the page (re)loads.
    useEffect(() => {
        if (initialCarId && cars.some((c) => c.id === initialCarId)) {
            setSelectedCarIds([initialCarId]);
        }
    }, [initialCarId, cars]);

    // Bring the requested car into view.
    useEffect(() => {
        if (!initialCarId) return;
        const id = window.setTimeout(() => {
            document.querySelector(`[data-car-id="${initialCarId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 300);
        return () => window.clearTimeout(id);
    }, [initialCarId]);

    useEffect(() => {
        if (!showColorLegend && !showNotifications) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.popover-anchor')) {
                setShowColorLegend(false);
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showColorLegend, showNotifications]);

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const start = new Date(firstDay);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(lastDay);
        end.setDate(end.getDate() + (6 - end.getDay()));
        const days: Date[] = [];
        const cursor = new Date(start);
        while (cursor <= end) {
            days.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        return days;
    }, [currentMonth]);

    const dateHeatmap = useMemo(() => {
        const map = new Map<string, number>();
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startStr = toLocalDateStr(monthStart);
        const endStr = toLocalDateStr(monthEnd);
        cars.forEach((car) => {
            car.bookings.forEach((b) => {
                const bs = b.start_date.slice(0, 10);
                const be = b.end_date.slice(0, 10);
                if (bs <= endStr && be >= startStr) {
                    const cursor = new Date(Math.max(new Date(bs + 'T00:00:00').getTime(), monthStart.getTime()));
                    const endCursor = new Date(Math.min(new Date(be + 'T00:00:00').getTime(), monthEnd.getTime()));
                    while (cursor <= endCursor) {
                        const iso = toLocalDateStr(cursor);
                        map.set(iso, (map.get(iso) || 0) + 1);
                        cursor.setDate(cursor.getDate() + 1);
                    }
                }
            });
        });
        return map;
    }, [cars, currentMonth]);

    const carMonthBookings = useMemo(() => {
        const map = new Map<number, boolean[]>();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const monthStartStr = toLocalDateStr(monthStart);
        const monthEndStr = toLocalDateStr(monthEnd);
        cars.forEach((car) => {
            const bookedDays = new Array(daysInMonth).fill(false);
            car.bookings.forEach((b) => {
                const bs = b.start_date.slice(0, 10);
                const be = b.end_date.slice(0, 10);
                if (bs <= monthEndStr && be >= monthStartStr) {
                    const startDate = new Date(Math.max(new Date(bs + 'T00:00:00').getTime(), monthStart.getTime()));
                    const endDate = new Date(Math.min(new Date(be + 'T00:00:00').getTime(), monthEnd.getTime()));
                    for (let d = startDate.getDate(); d <= endDate.getDate(); d++) {
                        bookedDays[d - 1] = true;
                    }
                }
            });
            map.set(car.id, bookedDays);
        });
        return map;
    }, [cars, currentMonth]);

    const carConflicts = useMemo(() => {
        const map = new Map<number, { booking1: Booking; booking2: Booking }[]>();
        cars.forEach((car) => {
            const bookings = car.bookings;
            const g = car.grace_minutes ?? 30;
            const conflicts: { booking1: Booking; booking2: Booking }[] = [];
            for (let i = 0; i < bookings.length; i++) {
                for (let j = i + 1; j < bookings.length; j++) {
                    const a = bookings[i];
                    const b = bookings[j];
                    if (a.id === b.id) continue;
                    const aStart = parseBookingStart(a);
                    const aEnd = parseBookingEnd(a);
                    const bStart = parseBookingStart(b);
                    const bEnd = parseBookingEnd(b);
                    if (aStart < parseBookingEndWithBuffer(b, g) && bStart < parseBookingEndWithBuffer(a, g)) {
                        conflicts.push({ booking1: a, booking2: b });
                    }
                }
            }
            if (conflicts.length > 0) map.set(car.id, conflicts);
        });
        return map;
    }, [cars]);

    const pendingConflicts = useMemo(() => {
        const map = new Map<number, { pending: Booking; confirmed: Booking }[]>();
        cars.forEach((car) => {
            const g = car.grace_minutes ?? 30;
            const pendings = car.bookings.filter(b => b.status === 'pending');
            const confirmedActive = car.bookings.filter(b => ['confirmed', 'active'].includes(b.status));
            if (pendings.length === 0 || confirmedActive.length === 0) return;
            const conflicts: { pending: Booking; confirmed: Booking }[] = [];
            pendings.forEach((pending) => {
                confirmedActive.forEach((confirmed) => {
                    const pStart = parseBookingStart(pending);
                    const pEnd = parseBookingEnd(pending);
                    const cStart = parseBookingStart(confirmed);
                    const cEnd = parseBookingEnd(confirmed);
                    if (pStart < parseBookingEndWithBuffer(confirmed, g) && cStart < parseBookingEndWithBuffer(pending, g)) {
                        conflicts.push({ pending, confirmed });
                    }
                });
            });
            if (conflicts.length > 0) map.set(car.id, conflicts);
        });
        return map;
    }, [cars]);

    const conflictingPendingIds = useMemo(() => {
        const ids = new Set<number>();
        pendingConflicts.forEach((conflicts) => {
            conflicts.forEach((c) => ids.add(c.pending.id));
        });
        return ids;
    }, [pendingConflicts]);

    const activeBookingsForDate = useMemo(() => {
        if (!selectedDate) return [];
        const bookings: { booking: Booking; car: Car }[] = [];
        selectedCars.forEach((car) => {
            car.bookings.forEach((b) => {
                if (b.start_date.slice(0, 10) <= selectedDate && b.end_date.slice(0, 10) >= selectedDate) {
                    bookings.push({ booking: b, car });
                }
            });
        });
        return bookings;
    }, [selectedCars, selectedDate]);

    // Q key to open quick book, Escape handled inside panel
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'q' && !showQuickForm && !selectedRange && activeBookingsForDate.length === 0 && selectedCars.length > 0) {
                setShowQuickForm(true);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [showQuickForm, selectedRange, activeBookingsForDate.length, selectedCars.length]);

    const rangeBookings = useMemo(() => {
        if (!rangeDates) return [];
        const seen = new Set<number>();
        const bookings: { booking: Booking; car: Car }[] = [];
        rangeDates.forEach((iso) => {
            selectedCars.forEach((car) => {
                car.bookings.forEach((b) => {
                    if (!seen.has(b.id) && b.start_date.slice(0, 10) <= iso && b.end_date.slice(0, 10) >= iso) {
                        seen.add(b.id);
                        bookings.push({ booking: b, car });
                    }
                });
            });
        });
        return bookings.sort((a, b) => a.booking.start_date.localeCompare(b.booking.start_date));
    }, [selectedCars, rangeDates]);

    const monthBookings = useMemo(() => {
        const monthStart = toLocalDateStr(currentMonth);
        const monthEnd = toLocalDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
        const ids = new Set<number>();
        cars.forEach((car) => {
            car.bookings.forEach((b) => {
                if (b.start_date.slice(0, 10) <= monthEnd && b.end_date.slice(0, 10) >= monthStart) {
                    ids.add(b.id);
                }
            });
        });
        return ids.size;
    }, [cars, currentMonth]);

    const availableNow = cars.filter(
        (c) =>
            !c.bookings.some(
                (b) => todayIso >= b.start_date.slice(0, 10) && todayIso <= b.end_date.slice(0, 10)
            )
    ).length;

    const notifications = useMemo(() => {
        const pickupsToday: { booking: Booking; car: Car }[] = [];
        const dropoffsToday: { booking: Booking; car: Car }[] = [];
        const pickupsTomorrow: { booking: Booking; car: Car }[] = [];
        const targetCars = selectedCarIds.length > 0 ? selectedCars : cars;
        targetCars.forEach((car) => {
            car.bookings.forEach((b) => {
                const s = b.start_date.slice(0, 10);
                const e = b.end_date.slice(0, 10);
                if (s === todayIso) pickupsToday.push({ booking: b, car });
                if (e === todayIso) dropoffsToday.push({ booking: b, car });
                if (s === tomorrowIso) pickupsTomorrow.push({ booking: b, car });
            });
        });
        return { pickupsToday, dropoffsToday, pickupsTomorrow };
    }, [cars, selectedCars, selectedCarIds, todayIso, tomorrowIso]);

    const agendaItems = useMemo(() => {
        const items: { booking: Booking; car: Car }[] = [];
        selectedCars.forEach((car) => {
            car.bookings.forEach((booking) => {
                items.push({ booking, car });
            });
        });
        items.sort((a, b) => a.booking.start_date.localeCompare(b.booking.start_date));
        const monthStart = toLocalDateStr(currentMonth);
        const monthEnd = toLocalDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
        return items.filter(
            (item) =>
                item.booking.start_date.slice(0, 10) <= monthEnd &&
                item.booking.end_date.slice(0, 10) >= monthStart
        );
    }, [selectedCars, currentMonth]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const selectedDateFormatted = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : '';

    const handleDayClick = useCallback(
        (iso: string, e: React.MouseEvent) => {
            if (e.shiftKey && lastClickedDate) {
                const dates = [lastClickedDate, iso].sort();
                setSelectedRange({ start: dates[0], end: dates[1] });
            } else {
                setSelectedDate(iso);
                setLastClickedDate(iso);
                setSelectedRange(null);
            }
        },
        [lastClickedDate]
    );

    const handleExport = () => {
        window.print();
    };

    const toggleCarSelection = (carId: number, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            setSelectedCarIds((prev) =>
                prev.includes(carId) ? prev.filter((id) => id !== carId) : [...prev, carId]
            );
        } else {
            setSelectedCarIds([carId]);
            setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelectedDate(todayIso);
            setSelectedRange(null);
        }
    };

    const isDateInRange = (iso: string) => {
        if (!rangeDates) return false;
        return rangeDates.includes(iso);
    };

    return (
        <>
            <Head title="Booking Schedule" />
            <AuthenticatedLayout
                breadcrumbs={[{ label: 'Booking Schedule' }]}
                header={
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-700 dark:to-brand-900 p-6 sm:p-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        <div className="relative space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                                Schedule & Availability
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                Booking Schedule
                            </h1>
                            <p className="text-white/60 max-w-xl text-sm">
                                View and manage bookings across your fleet.
                            </p>
                        </div>
                    </div>
                }
            >
                <div className="pb-6 sm:pb-8 pt-2 sm:pt-4">
                    <div className="px-6 lg:px-10 space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                {
                                    label: 'Total Vehicles',
                                    value: cars.length,
                                    gradient: 'from-brand-400 to-brand-600',
                                    icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z',
                                },
                                {
                                    label: 'This Month Bookings',
                                    value: monthBookings,
                                    gradient: 'from-accent-400 to-accent-600',
                                    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                                },
                                {
                                    label: 'Available Today',
                                    value: availableNow,
                                    gradient: 'from-emerald-400 to-emerald-600',
                                    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                                },
                            ].map((stat, i) => (
                                <div
                                    key={stat.label}
                                    className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-brand-800/80 border border-surface-100 dark:border-surface-700/60 p-4 card-shine shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                                                {stat.label}
                                            </p>
                                            <p className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white mt-0.5">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md shrink-0`}>
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Main two-column layout */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Left: Car List */}
                            <div className="w-full lg:w-64 xl:w-72 shrink-0">
                                <div className="card overflow-hidden flex flex-col h-full">
                                    {/* Filter chips + sort */}
                                    <div className="flex items-center gap-1 px-3 pt-2.5 pb-1.5 border-b border-surface-100 dark:border-surface-700/60">
                                        {(['all', 'available', 'booked'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setFilterMode(mode)}
                                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all capitalize ${
                                                    filterMode === mode
                                                        ? 'bg-accent-400/10 text-accent-600 dark:text-accent-400 shadow-sm'
                                                        : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300'
                                                }`}
                                            >
                                                {mode === 'all' ? 'All' : mode === 'available' ? 'Free' : 'Booked'}
                                            </button>
                                        ))}
                                        <span className="flex-1" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                            className="text-[10px] px-1.5 py-1 rounded-md bg-surface-50 dark:bg-surface-700/30 border border-surface-200 dark:border-surface-600/40 text-surface-500 dark:text-surface-400 focus:outline-none"
                                        >
                                            <option value="name">A–Z</option>
                                            <option value="rate">$$$</option>
                                            <option value="year">Year</option>
                                            <option value="plate">Plate</option>
                                        </select>
                                    </div>

                                    {/* Search */}
                                    <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-700/60">
                                        <div className="relative">
                                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                placeholder="Search vehicles..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-8 pr-2.5 py-2 text-xs bg-surface-50 dark:bg-surface-700/30 border border-surface-200 dark:border-surface-600/40 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-400/30 focus:border-accent-400/50 transition-all duration-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Car list */}
                                    <div
                                        className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide"
                                        style={{ maxHeight: 'calc(100vh - 380px)' }}
                                    >
                                        {filteredCars.length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700/40 flex items-center justify-center mx-auto mb-2">
                                                    <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">No vehicles found</p>
                                                <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-0.5">Try a different search term.</p>
                                            </div>
                                        ) : (
                                            (() => {
                                                const groups = new Map<string, Car[]>();
                                                filteredCars.forEach(car => {
                                                    const key = car.brand;
                                                    if (!groups.has(key)) groups.set(key, []);
                                                    groups.get(key)!.push(car);
                                                });
                                                return Array.from(groups.entries()).map(([brand, brandCars]) => (
                                                    <div key={brand}>
                                                        <div className="sticky top-0 z-10 bg-white dark:bg-brand-800 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 border-b border-surface-100 dark:border-surface-700/30">
                                                            {brand}
                                                            <span className="font-normal text-surface-300 dark:text-surface-600 ml-1">
                                                                {brandCars.length}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 pt-1 pb-2">
                                                            {brandCars.map(car => {
                                                                const isSelected = selectedCarIds.includes(car.id);
                                                                const carIdx = selectedCarIds.indexOf(car.id);
                                                                const paletteColor = carIdx >= 0 ? MULTI_CAR_COLORS[carIdx % MULTI_CAR_COLORS.length] : null;
                                                                const isAvailableToday = !car.bookings.some(
                                                                    (b) => todayIso >= b.start_date.slice(0, 10) && todayIso <= b.end_date.slice(0, 10)
                                                                );
                                                                const isFav = favorites.includes(car.id);
                                                                const monthData = carMonthBookings.get(car.id);
                                                                return (
                                                                    <button
                                                                        key={car.id}
                                                                        data-car-id={car.id}
                                                                        onClick={(e) => toggleCarSelection(car.id, e)}
                                                                        className="w-full text-left transition-all duration-200"
                                                                    >
                                                                        <div
                                                                            className={`relative group rounded-xl px-2.5 py-2 border transition-all duration-200 ${
                                                                                isSelected
                                                                                    ? `${paletteColor?.ring || 'ring-accent-400/50'} ring-2 bg-gradient-to-r from-accent-25/80 to-white dark:from-accent-900/15 dark:to-brand-800 shadow-md`
                                                                                    : 'border-transparent bg-white dark:bg-brand-800/40 hover:bg-surface-25 dark:hover:bg-brand-700/30 hover:border-surface-200 dark:hover:border-surface-600/30'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-start gap-2.5">
                                                                                {/* Favorite star */}
                                                                                <span
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setFavorites(prev =>
                                                                                            prev.includes(car.id) ? prev.filter(id => id !== car.id) : [...prev, car.id]
                                                                                        );
                                                                                    }}
                                                                                    className="shrink-0 mt-0.5 -ml-0.5 cursor-pointer"
                                                                                >
                                                                                    <svg className={`w-3 h-3 transition-colors ${isFav ? 'text-amber-400 fill-amber-400' : 'text-surface-300 dark:text-surface-600 hover:text-amber-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                                    </svg>
                                                                                </span>
                                                                                {/* Color swatch + left accent bar */}
                                                                                {isSelected && (
                                                                                    <div className={`w-0.5 self-stretch rounded-full shrink-0 ${paletteColor?.bg || 'bg-accent-400'}`} />
                                                                                )}
                                                                                <div className={`w-7 h-7 rounded-lg ${carColorClass(car.color)} flex items-center justify-center shadow-sm shrink-0`}>
                                                                                    <svg className="w-3.5 h-3.5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-4-4v4m-6 8h.01M18 15h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span className="text-xs font-semibold text-surface-900 dark:text-white truncate">
                                                                                            {car.brand} {car.model}
                                                                                        </span>
                                                                                        <span className="text-[10px] text-surface-400 dark:text-surface-500 font-medium shrink-0">
                                                                                            {car.year}
                                                                                        </span>
                                                                                        {isFav && (
                                                                                            <span className="text-amber-400 shrink-0">
                                                                                                <svg className="w-2.5 h-2.5 fill-amber-400" viewBox="0 0 20 20">
                                                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                                                </svg>
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1 text-[10px] text-surface-400 dark:text-surface-500 font-mono">
                                                                                        <span>{car.license_plate}</span>
                                                                                        <span>·</span>
                                                                                        <span>${car.daily_rate}/day</span>
                                                                                    </div>
                                                                                    {car.location && (
                                                                                        <div className="flex items-center gap-1 text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">
                                                                                            <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                            </svg>
                                                                                            <span className="truncate">{car.location.location}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {/* Mini availability strip */}
                                                                                    {monthData && (
                                                                                        <div className="mt-1.5 flex gap-px">
                                                                                            {monthData.map((booked, di) => (
                                                                                                <div
                                                                                                    key={di}
                                                                                                    className={`h-1 flex-1 rounded-sm ${
                                                                                                        booked
                                                                                                            ? isSelected
                                                                                                                ? 'bg-accent-400/60'
                                                                                                                : 'bg-amber-400/50'
                                                                                                            : 'bg-surface-200/60 dark:bg-surface-600/30'
                                                                                                    }`}
                                                                                                />
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                {/* Selection / availability indicator */}
                                                                                {isSelected && paletteColor && (
                                                                                    <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${paletteColor.bg} ring-2 ring-white dark:ring-brand-800`} />
                                                                                )}
                                                                 {!isSelected && (
                                                                     <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${isAvailableToday ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                                 )}
                                                                  {carConflicts.has(car.id) && (
                                                                      <span
                                                                          className="group/conflict relative shrink-0 mt-0.5"
                                                                          onClick={(e) => e.stopPropagation()}
                                                                          title="Booking conflicts detected"
                                                                      >
                                                                          <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                          </svg>
                                                                          <span className="absolute -top-1 -right-1 min-w-[10px] h-2.5 flex items-center justify-center px-0.5 text-[6px] font-bold text-white bg-red-500 rounded-full leading-none opacity-0 group-hover/conflict:opacity-100 transition-opacity">
                                                                              {carConflicts.get(car.id)!.length}
                                                                          </span>
                                                                      </span>
                                                                  )}
                                                                  {pendingConflicts.has(car.id) && (
                                                                      <span
                                                                          className="group/pending-conflict relative shrink-0 mt-0.5"
                                                                          onClick={(e) => e.stopPropagation()}
                                                                          title="Pending booking conflicts with confirmed — guest needs contact"
                                                                      >
                                                                          <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                          </svg>
                                                                          <span className="absolute -top-1 -right-1 min-w-[10px] h-2.5 flex items-center justify-center px-0.5 text-[6px] font-bold text-white bg-orange-500 rounded-full leading-none opacity-0 group-hover/pending-conflict:opacity-100 transition-opacity">
                                                                              {pendingConflicts.get(car.id)!.length}
                                                                          </span>
                                                                      </span>
                                                                  )}
                                                              </div>
                                                         </div>
                                                     </button>
                                                 );
                                             })}
                                                         </div>
                                                     </div>
                                                 ));
                                             })()
                                         )}
                                     </div>

                                     {/* Footer */}
                                    <div className="px-3 py-2 border-t border-surface-100 dark:border-surface-700/60 text-[10px] text-surface-400 dark:text-surface-500 font-medium flex items-center justify-between">
                                        <span>
                                            {selectedCarIds.length > 0
                                                ? `${selectedCarIds.length} selected · ${filteredCars.length} of ${cars.length} vehicles`
                                                : `${filteredCars.length} of ${cars.length} vehicles`}
                                        </span>
                                        {favorites.length > 0 && (
                                            <span className="text-amber-500 font-semibold">{favorites.length} starred</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Calendar + Detail */}
                            <div className="flex-1 min-w-0 space-y-4">
                                {/* View toggle + toolbar */}
                                <div className="flex items-center gap-2 bg-white dark:bg-brand-800/40 border border-surface-100 dark:border-surface-700/30 rounded-xl px-3 py-2 shadow-sm">
                                    <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-700/30 rounded-lg p-0.5">
                                        <button
                                            onClick={() => setViewMode('calendar')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                viewMode === 'calendar'
                                                    ? 'bg-white dark:bg-brand-700 shadow-sm text-surface-900 dark:text-white'
                                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                                            }`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Calendar
                                        </button>
                                        <button
                                            onClick={() => setViewMode('agenda')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                viewMode === 'agenda'
                                                    ? 'bg-white dark:bg-brand-700 shadow-sm text-surface-900 dark:text-white'
                                                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                                            }`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Agenda
                                        </button>
                                    </div>
                                    {viewMode === 'agenda' && selectedCars.length > 0 && (
                                        <span className="text-[11px] text-surface-400 dark:text-surface-500">
                                            {agendaItems.length} booking{agendaItems.length !== 1 ? 's' : ''} this month
                                        </span>
                                    )}
                                    <span className="flex-1" />
                                    {/* Drag handle for creating a new booking */}
                                    {selectedCars.length > 0 && (
                                        <div
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('text/plain', 'new-booking');
                                                e.dataTransfer.effectAllowed = 'move';
                                            }}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-accent-400/10 text-accent-600 dark:text-accent-400 border border-dashed border-accent-300/40 dark:border-accent-600/40 cursor-grab active:cursor-grabbing select-none hover:bg-accent-400/20 transition-all"
                                            title="Drag this onto a calendar date to create a booking"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m-8-8h16" />
                                            </svg>
                                            <span>New</span>
                                            <svg className="w-2.5 h-2.5 text-accent-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16" />
                                            </svg>
                                        </div>
                                    )}
                                    {/* Color Legend toggle */}
                                    <div className="relative popover-anchor">
                                        <button
                                            onClick={() => setShowColorLegend(!showColorLegend)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-surface-100 dark:bg-surface-700/40 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700/60 transition-all"
                                            title="Color legend"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                            Legend
                                        </button>
                                        {showColorLegend && (
                                            <div className="absolute right-0 top-full mt-1.5 z-50 w-48 bg-white dark:bg-brand-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3 space-y-1.5"
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">Status Colors</p>
                                                {[
                                                    { label: 'Pending', classes: 'bg-amber-400' },
                                                    { label: 'Confirmed', classes: 'bg-blue-400' },
                                                    { label: 'Active', classes: 'bg-emerald-400' },
                                                    { label: 'Completed', classes: 'bg-surface-300 dark:bg-surface-500' },
                                                    { label: 'Cancelled', classes: 'bg-red-400' },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center gap-2 text-[11px] text-surface-600 dark:text-surface-300">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${item.classes} shrink-0`} />
                                                        {item.label}
                                                    </div>
                                                ))}
                                                <div className="border-t border-surface-100 dark:border-surface-700/60 my-1.5 pt-1.5">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">Multi-Car Colors</p>
                                                    <div className="flex gap-1">
                                                        {MULTI_CAR_COLORS.slice(0, 4).map((c, i) => (
                                                            <span key={i} className={`w-3 h-3 rounded-full ${c.bg} ring-1 ring-white dark:ring-brand-700`} />
                                                        ))}
                                                        <span className="text-[10px] text-surface-400">+{MULTI_CAR_COLORS.length - 4}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Notifications bell */}
                                    <div className="relative popover-anchor">
                                        <button
                                            onClick={() => setShowNotifications(!showNotifications)}
                                            className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-surface-100 dark:bg-surface-700/40 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700/60 transition-all"
                                            title="Upcoming pickups & drop-offs"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            {(notifications.pickupsToday.length + notifications.dropoffsToday.length + notifications.pickupsTomorrow.length) > 0 && (
                                                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 flex items-center justify-center px-1 text-[8px] font-bold text-white bg-red-500 rounded-full leading-none">
                                                    {notifications.pickupsToday.length + notifications.dropoffsToday.length + notifications.pickupsTomorrow.length}
                                                </span>
                                            )}
                                            <span>Alerts</span>
                                        </button>
                                        {showNotifications && (
                                            <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-white dark:bg-brand-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3 space-y-2"
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                {(() => {
                                                    const sections: { title: string; icon: string; items: { booking: Booking; car: Car }[]; empty: string }[] = [
                                                        { title: 'Pickups Today', icon: 'M5 13l4 4L19 7', items: notifications.pickupsToday, empty: 'No pickups today' },
                                                        { title: 'Drop-offs Today', icon: 'M5 13l4 4L19 7', items: notifications.dropoffsToday, empty: 'No drop-offs today' },
                                                        { title: 'Pickups Tomorrow', icon: 'M13 7l5 5m0 0l-5 5m5-5H6', items: notifications.pickupsTomorrow, empty: 'No pickups tomorrow' },
                                                    ];
                                                    return sections.map((section) => (
                                                        <div key={section.title}>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1 flex items-center gap-1">
                                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={section.icon} />
                                                                </svg>
                                                                {section.title}
                                                            </p>
                                                            {section.items.length === 0 ? (
                                                                <p className="text-[11px] text-surface-400 dark:text-surface-500 pl-3.5">{section.empty}</p>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {section.items.map((item) => (
                                                                        <Link
                                                                            key={item.booking.id}
                                                                            href={route('admin.bookings.show', item.booking.id)}
                                                                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/30 text-[11px] text-surface-700 dark:text-surface-300 transition-colors"
                                                                        >
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig(item.booking.status).dot} shrink-0`} />
                                                                            <span className="truncate">{item.car.brand} {item.car.model}</span>
                                                                            <span className="text-surface-400 shrink-0">{getName(item.booking)}</span>
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    {selectedCarIds.length > 1 && (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent-600 dark:text-accent-400 bg-accent-400/10 px-2.5 py-1 rounded-md">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            {selectedCarIds.length} cars
                                        </span>
                                    )}
                                    {selectedRange ? (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Range
                                        </span>
                                    ) : selectedCars.length === 1 ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-surface-400 dark:text-surface-500 font-mono">
                                            ${selectedCars[0].daily_rate}/day
                                        </span>
                                    ) : null}
                                    <button
                                        onClick={handleExport}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-100 dark:bg-surface-700/40 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700/60 transition-all duration-200"
                                        title="Print / Export"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Export
                                    </button>
                                </div>

                                {viewMode === 'agenda' ? (
                                    /* ── Agenda View ── */
                                    <div className="card overflow-hidden">
                                        <div className="px-4 py-2.5 border-b border-surface-100 dark:border-surface-700/60">
                                            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                                                Upcoming Bookings
                                            </h3>
                                        </div>
                                        <div className="p-3 space-y-1 max-h-[500px] overflow-y-auto scrollbar-hide">
                                            {selectedCarIds.length === 0 ? (
                                                <div className="text-center py-8 text-xs text-surface-400">Select a vehicle to view bookings.</div>
                                            ) : agendaItems.length === 0 ? (
                                                <div className="text-center py-8 text-xs text-surface-400">No bookings this month for selected vehicles.</div>
                                            ) : (
                                                agendaItems.map((item, i) => {
                                                    const cfg = statusConfig(item.booking.status);
                                                    const carIdx = selectedCarIds.indexOf(item.car.id);
                                                    const paletteColor = carIdx >= 0 ? MULTI_CAR_COLORS[carIdx % MULTI_CAR_COLORS.length] : null;
                                                    return (
                                                        <div
                                                            key={item.booking.id}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData('text/plain', JSON.stringify({
                                                                    type: 'reschedule',
                                                                    bookingId: item.booking.id,
                                                                    carId: item.car.id,
                                                                    originalStart: item.booking.start_date.slice(0, 10),
                                                                    originalEnd: item.booking.end_date.slice(0, 10),
                                                                }));
                                                                e.dataTransfer.effectAllowed = 'move';
                                                            }}
                                                            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-25 dark:hover:bg-surface-700/20 transition-colors border border-transparent hover:border-surface-100 dark:hover:border-surface-700/30 cursor-grab active:cursor-grabbing"
                                                        >
                                                            {paletteColor && <div className={`w-1 h-9 rounded-full ${cfg.bar} shrink-0`} />}
                                                            {!paletteColor && <div className={`w-1 h-9 rounded-full ${cfg.bar} shrink-0`} />}
                                                            <Link
                                                                href={route('admin.bookings.show', item.booking.id)}
                                                                className="min-w-0 flex-1 group"
                                                            >
                                                                <div className="text-xs font-semibold text-surface-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors truncate">
                                                                    {item.car.brand} {item.car.model}
                                                                </div>
                                                                 <div className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">
                                                                     {fmtBookingRange(item.booking)}
                                                                     {' · '}
                                                                     <span className="inline-flex items-center gap-0.5">
                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                        </svg>
                                                                        {getName(item.booking)}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                            <span className={cfg.badge}>{item.booking.status}</span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Calendar View ── */
                                    <div className="card overflow-hidden">
                                        <div className="px-4 py-2.5 border-b border-surface-100 dark:border-surface-700/60 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={prevMonth}
                                                    className="w-7 h-7 rounded-lg bg-surface-50 dark:bg-surface-700/40 hover:bg-surface-100 dark:hover:bg-surface-700/60 text-surface-600 dark:text-surface-300 flex items-center justify-center transition-all duration-200 active:scale-90"
                                                    aria-label="Previous month"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <h2 className="text-sm font-bold text-surface-900 dark:text-white min-w-[140px] text-center select-none">
                                                    {monthLabel}
                                                </h2>
                                                <button
                                                    onClick={nextMonth}
                                                    className="w-7 h-7 rounded-lg bg-surface-50 dark:bg-surface-700/40 hover:bg-surface-100 dark:hover:bg-surface-700/60 text-surface-600 dark:text-surface-300 flex items-center justify-center transition-all duration-200 active:scale-90"
                                                    aria-label="Next month"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                onClick={goToToday}
                                                disabled={isCurrentMonth && selectedDate === todayIso}
                                                className="px-3 py-1 text-[10px] font-bold rounded-lg bg-accent-400/10 text-accent-600 dark:text-accent-400 hover:bg-accent-400/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Today
                                            </button>
                                        </div>

                                        <div className="p-3 sm:p-4">
                                            <div className="grid grid-cols-7 mb-1 gap-px">
                                                {weekDays.map((d) => (
                                                    <div
                                                        key={d}
                                                        className="text-center text-[10px] font-bold uppercase tracking-widest text-surface-400 dark:text-surface-500 py-0.5"
                                                    >
                                                        {d}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-px bg-surface-100/80 dark:bg-surface-700/40 rounded-lg overflow-hidden">
                                                {calendarDays.map((d, i) => {
                                                    const iso = toLocalDateStr(d);
                                                    const inMonth = d.getMonth() === currentMonth.getMonth();
                                                    const isTodayDate = iso === todayIso;
                                                    const isSel = iso === selectedDate;
                                                    const inRange = isDateInRange(iso);
                                                    const heatCount = dateHeatmap.get(iso) || 0;
                                                    const heatClass = heatmapIntensity(heatCount);

                                                    const bookedCarIndices = selectedCars
                                                        .map((car) => {
                                                            const dayBookings = car.bookings.filter(
                                                                (b) =>
                                                                    b.start_date.slice(0, 10) <= iso &&
                                                                    b.end_date.slice(0, 10) >= iso
                                                            );
                                                            return {
                                                                carIdx: selectedCarIds.indexOf(car.id),
                                                                hasBooking: dayBookings.length > 0,
                                                                hasConflict: conflictSpansDay(carConflicts.get(car.id), iso),
                                                                hasPendingConflict: dayBookings.some((b) => conflictingPendingIds.has(b.id)),
                                                            };
                                                        })
                                                        .filter((c) => c.hasBooking);
                                                    const multiDots = selectedCarIds.length > 1 ? bookedCarIndices : [];
                                                    const hasConflictToday = bookedCarIndices.some((c) => c.hasConflict);
                                                    const hasPendingConflictToday = bookedCarIndices.some((c) => c.hasPendingConflict);
                                                    const dailyRate = selectedCars.length === 1 ? selectedCars[0].daily_rate : null;
                                                    const isDragOver = dragOverDate === iso;

                                                    const handleDragOverDay = (e: React.DragEvent) => {
                                                        e.preventDefault();
                                                        e.dataTransfer.dropEffect = 'move';
                                                        setDragOverDate(iso);
                                                    };
                                                    const handleDropOnDay = (e: React.DragEvent) => {
                                                        e.preventDefault();
                                                        setDragOverDate(null);
                                                        const data = e.dataTransfer.getData('text/plain');
                                                        if (data === 'new-booking') {
                                                            setSelectedDate(iso);
                                                            setSelectedRange(null);
                                                            setShowQuickForm(true);
                                                        } else {
                                                            try {
                                                                const payload = JSON.parse(data);
                                                                if (payload.type === 'reschedule') {
                                                                    const daysDiff = Math.round(
                                                                        (new Date(iso + 'T00:00:00').getTime() - new Date(payload.originalStart + 'T00:00:00').getTime()) / 86400000
                                                                    );
                                                                    const newEnd = new Date(payload.originalEnd + 'T00:00:00');
                                                                    newEnd.setDate(newEnd.getDate() + daysDiff);
                                                                    const newEndIso = toLocalDateStr(newEnd);
                                                                    router.patch(route('admin.bookings.update', payload.bookingId), {
                                                                        start_date: iso,
                                                                        end_date: newEndIso,
                                                                    } as any, {
                                                                        preserveScroll: true,
                                                                        preserveState: true,
                                                                        onError: () => {
                                                                            router.reload({ only: ['cars', 'locations'] });
                                                                        },
                                                                    });
                                                                }
                                                            } catch {}
                                                        }
                                                    };

                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={(e) => handleDayClick(iso, e)}
                                                            onDragOver={inMonth ? handleDragOverDay : undefined}
                                                            onDragLeave={() => setDragOverDate(null)}
                                                            onDrop={inMonth ? handleDropOnDay : undefined}
                                                            disabled={!inMonth}
                                                            className={`relative min-h-[48px] sm:min-h-[60px] p-1 text-left transition-all duration-150 focus:outline-none ${
                                                                inMonth
                                                                    ? isDragOver
                                                                        ? 'bg-accent-100 dark:bg-accent-900/30 ring-2 ring-accent-400/60 ring-inset scale-[1.02] z-20 shadow-lg'
                                                                        : 'bg-white dark:bg-brand-800 hover:bg-accent-25/60 dark:hover:bg-accent-900/15 cursor-pointer'
                                                                    : 'bg-surface-25/30 dark:bg-brand-900/20 cursor-default'
                                                            } ${
                                                                inRange
                                                                    ? 'ring-2 ring-blue-400/50 ring-inset z-10 shadow-sm bg-blue-50/30 dark:bg-blue-900/10'
                                                                    : isSel
                                                                      ? 'ring-2 ring-accent-400/60 ring-inset z-10 shadow-sm'
                                                                      : ''
                                                            } ${hasConflictToday && inMonth ? 'ring-1 ring-red-400/40 ring-inset' : ''} ${hasPendingConflictToday && inMonth && !hasConflictToday ? 'ring-1 ring-orange-400/40 ring-inset' : ''}`}
                                                        >
                                                            {heatClass && inMonth && (
                                                                <div className={`absolute inset-0 rounded-sm ${heatClass}`} />
                                                            )}
                                                            {isDragOver && inMonth && (
                                                                <div className="absolute inset-0 rounded-sm bg-accent-400/10 border-2 border-dashed border-accent-400/50" />
                                                            )}
                                                            <div className="relative flex items-center gap-0.5">
                                                                <span
                                                                    className={`text-xs font-bold leading-none transition-colors duration-200 ${
                                                                        isTodayDate
                                                                            ? 'text-accent-600 dark:text-accent-400'
                                                                            : inMonth
                                                                              ? 'text-surface-800 dark:text-surface-200'
                                                                              : 'text-surface-300 dark:text-surface-600'
                                                                    }`}
                                                                >
                                                                    {d.getDate()}
                                                                </span>
                                                                {isTodayDate && (
                                                                    <span className="relative flex w-1 h-1">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                                                                        <span className="relative inline-flex rounded-full h-1 w-1 bg-accent-500" />
                                                                    </span>
                                                                )}
                                                                {(hasConflictToday || hasPendingConflictToday) && inMonth && (
                                                                    <span className="relative flex w-1 h-1 ml-auto" title={hasConflictToday ? 'Booking conflict' : 'Pending booking conflict — needs contact'}>
                                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasConflictToday ? 'bg-red-400' : 'bg-orange-400'} opacity-75`} />
                                                                        <span className={`relative inline-flex rounded-full h-1 w-1 ${hasConflictToday ? 'bg-red-500' : 'bg-orange-500'}`} />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {inMonth && (
                                                                <div className="relative mt-0.5 space-y-0.5">
                                                                    {multiDots.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-0.5">
                                                                            {multiDots.slice(0, 4).map((m, mi) => (
                                                                                <span
                                                                                    key={mi}
                                                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                                                        m.hasConflict
                                                                                            ? 'bg-red-400 ring-1 ring-red-300'
                                                                                            : m.hasPendingConflict
                                                                                                ? 'bg-orange-400 ring-1 ring-orange-300'
                                                                                                : MULTI_CAR_COLORS[m.carIdx % MULTI_CAR_COLORS.length].dot
                                                                                    } ring-1 ring-white dark:ring-brand-800`}
                                                                                />
                                                                            ))}
                                                                            {multiDots.length > 4 && (
                                                                                <span className="text-[7px] font-bold text-surface-400">+{multiDots.length - 4}</span>
                                                                            )}
                                                                        </div>
                                                                    ) : bookedCarIndices.length > 0 || selectedCarIds.length <= 1 ? (
                                                                        /* Single car: show status bar for first booking */
                                                                        (() => {
                                                                            const car = selectedCarIds.length === 1 ? selectedCars[0] : null;
                                                                            const bookingsForDay = car
                                                                                ? car.bookings.filter(
                                                                                      (b) =>
                                                                                          b.start_date.slice(0, 10) <= iso &&
                                                                                          b.end_date.slice(0, 10) >= iso
                                                                                  )
                                                                                : [];
                                                                             const dayHasConflict = car ? conflictSpansDay(carConflicts.get(car.id), iso) : false;
                                                                             const dayHasPendingConflict = car ? bookingsForDay.some((b) => conflictingPendingIds.has(b.id)) : false;
                                                                             if (selectedCarIds.length > 0 && bookingsForDay.length > 0) {
                                                                                 return (
                                                                                     <div className="flex gap-0.5">
                                                                                         {bookingsForDay.slice(0, 2).map((bk, bi) => (
                                                                                             <span
                                                                                                 key={bi}
                                                                                                 className={`block h-[2px] flex-1 rounded-full ${
                                                                                                     dayHasPendingConflict && conflictingPendingIds.has(bk.id)
                                                                                                         ? 'bg-orange-400'
                                                                                                         : dayHasConflict
                                                                                                             ? 'bg-red-400'
                                                                                                             : statusConfig(bk.status).bar
                                                                                                 }`}
                                                                                             />
                                                                                         ))}
                                                                                     </div>
                                                                                 );
                                                                             }
                                                                            if (selectedCarIds.length > 0) {
                                                                                return (
                                                                                    <span className="block w-1 h-1 mx-auto rounded-full bg-emerald-300/50 dark:bg-emerald-500/20" />
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()
                                                                    ) : null}
                                                                    {/* Pricing indicator */}
                                                                    {dailyRate !== null && inMonth && (
                                                                        <div className="text-[7px] font-mono text-surface-300 dark:text-surface-600 text-center leading-tight">
                                                                            ${dailyRate}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Day/Range Detail ── */}
                                <div className="card overflow-hidden">
                                    <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700/60">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-sm shrink-0">
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                {selectedRange ? (
                                                    <>
                                                        <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                                                            {new Date(selectedRange.start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            {' → '}
                                                            {new Date(selectedRange.end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </h3>
                                                        <p className="text-[10px] text-surface-400 dark:text-surface-500">
                                                            {rangeDates?.length || 0} days · {rangeBookings.length} booking{rangeBookings.length !== 1 ? 's' : ''}
                                                            {selectedCars.length === 1 && ` · $${(selectedCars[0].daily_rate * (rangeDates?.length || 0)).toFixed(2)} total`}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                                                            {selectedDateFormatted}
                                                        </h3>
                                                        <p className="text-[10px] text-surface-400 dark:text-surface-500">
                                                            {selectedCars.length === 1
                                                                ? `${selectedCars[0].brand} ${selectedCars[0].model} · $${selectedCars[0].daily_rate}/day`
                                                                : selectedCars.length > 0
                                                                    ? `${selectedCars.length} cars selected${selectedCars.length === 1 ? ` · $${selectedCars[0].daily_rate}/day` : ''}`
                                                                    : 'No vehicle selected'}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {/* Vehicle preview card */}
                                        {selectedCars.length === 1 && (() => {
                                            const car = selectedCars[0];
                                            const isAvail = !car.bookings.some(
                                                (b) => todayIso >= b.start_date.slice(0, 10) && todayIso <= b.end_date.slice(0, 10)
                                            );
                                            return (
                                                <div className="flex overflow-hidden rounded-xl border border-surface-100 dark:border-surface-700/30 bg-white dark:bg-brand-800/60 shadow-sm">
                                                    <div className="w-36 shrink-0 bg-surface-50 dark:bg-surface-700/20">
                                                        {car.image_path ? (
                                                            <img src={`/storage/${car.image_path}`} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className={`w-full h-full ${carColorClass(car.color)} flex items-center justify-center`}>
                                                                <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-4-4v4m-6 8h.01M18 15h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 p-3 space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-surface-900 dark:text-white">{car.brand} {car.model}</h4>
                                                                <p className="text-[11px] text-surface-400 dark:text-surface-500 font-mono">{car.license_plate} · {car.year}</p>
                                                            </div>
                                                            <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${isAvail ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                                                {isAvail ? 'Available Today' : 'Booked'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px] text-surface-500 dark:text-surface-400 flex-wrap">
                                                            <span className="flex items-center gap-1">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                ${car.daily_rate}/day
                                                            </span>
                                                            {car.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    {car.location.location}
                                                                </span>
                                                            )}
                                                            {car.color && (
                                                                <span className="flex items-center gap-1 capitalize">
                                                                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${carColorClass(car.color)}`} />
                                                                    {car.color}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        {selectedCars.length === 0 ? (
                                            <div className="text-center py-6">
                                                <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-700/40 flex items-center justify-center mx-auto mb-3">
                                                    <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-4-4v4m-6 8h.01M18 15h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Select a vehicle</p>
                                                <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-0.5">
                                                    Choose from the list or Ctrl+click to select multiple.
                                                </p>
                                            </div>
                                        ) : selectedCars.length === 1 && conflictSpansDay(carConflicts.get(selectedCars[0].id), selectedDate) && !selectedRange ? (
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200/60 dark:border-red-800/30">
                                                    <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-red-700 dark:text-red-400">Booking Conflict Detected</p>
                                                        <p className="text-[10px] text-red-500/80 dark:text-red-400/70 mt-0.5">
                                                            Overlapping bookings for {selectedCars[0].brand} {selectedCars[0].model} on this date
                                                        </p>
                                                        <div className="mt-2 space-y-1">
                                                            {carConflicts.get(selectedCars[0].id)!.filter((c) => {
                                                                const onDay = (b: Booking) => b.start_date.slice(0, 10) <= selectedDate && b.end_date.slice(0, 10) >= selectedDate;
                                                                return onDay(c.booking1) && onDay(c.booking2);
                                                            }).map((conflict, ci) => (
                                                                <div key={ci} className="text-[10px] text-red-600 dark:text-red-300 flex items-center gap-1.5">
                                                                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                                                                    <span>{getName(conflict.booking1)} vs {getName(conflict.booking2)}</span>
                                                                    <span className="text-red-400/60">
                                                                        ({fmtBookingRange(conflict.booking1)} / {fmtBookingRange(conflict.booking2)})
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                {pendingConflictSpansDay(pendingConflicts.get(selectedCars[0].id), selectedDate) && (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            Pending guests need contact
                                                        </p>
                                                        {pendingConflicts.get(selectedCars[0].id)!.map((pc, ci) => {
                                                            const g = pc.pending.guest;
                                                            const isExpanded = expandedContactId === pc.pending.id;
                                                            return (
                                                                <div key={ci} className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-800/30">
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                                                                        <div className="min-w-0 flex-1">
                                                                            <button
                                                                                onClick={() => setExpandedContactId(isExpanded ? null : pc.pending.id)}
                                                                                className="w-full text-left"
                                                                            >
                                                                                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                                                                                    {getName(pc.pending)}
                                                                                </p>
                                                                                <p className="text-[10px] text-orange-500/70 mt-0.5">
                                                                                    Conflicted by <span className="font-semibold">{getName(pc.confirmed)}</span>
                                                                                    {' · '}{fmtBookingRange(pc.confirmed)}
                                                                                </p>
                                                                            </button>
                                                                            {isExpanded && g && (
                                                                                <div className="mt-2 pt-2 border-t border-orange-200/50 dark:border-orange-700/30 text-[10px] text-orange-600 dark:text-orange-400 space-y-1">
                                                                                    <p className="flex items-center gap-1.5">
                                                                                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                                        </svg>
                                                                                        <span className="font-medium">{g.phone || '—'}</span>
                                                                                    </p>
                                                                                    <p className="flex items-center gap-1.5">
                                                                                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                                        </svg>
                                                                                        <span className="font-medium">{g.email || '—'}</span>
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <Link
                                                                            href={route('admin.bookings.show', pc.pending.id)}
                                                                            className="shrink-0 px-2 py-1 text-[9px] font-bold rounded-lg bg-orange-400/10 text-orange-600 dark:text-orange-400 hover:bg-orange-400/20 transition-all"
                                                                        >
                                                                            View
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : selectedRange ? (
                                            rangeBookings.length > 0 ? (
                                                <div className="space-y-2">
                                                    {(() => {
                                                        const rangeConflictCars = selectedCars.filter(c => carConflicts.has(c.id));
                                                        const rangePendingCars = selectedCars.filter(c => pendingConflicts.has(c.id));
                                                        return (
                                                            <>
                                                                {rangeConflictCars.length > 0 && (
                                                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200/60 dark:border-red-800/30 mb-2">
                                                                        <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                        </svg>
                                                                        <span className="text-[10px] font-semibold text-red-700 dark:text-red-400">
                                                                            {rangeConflictCars.length} car{rangeConflictCars.length !== 1 ? 's' : ''} with overlapping bookings in this range
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {rangePendingCars.length > 0 && (
                                                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-800/30 mb-2">
                                                                        <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                        </svg>
                                                                        <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-400">
                                                                            {rangePendingCars.length} car{rangePendingCars.length !== 1 ? 's' : ''} with pending bookings that conflict with confirmed — guests need contact
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                    {rangeBookings.map((item) => {
                                                        const cfg = statusConfig(item.booking.status);
                                                        const carIdx = selectedCarIds.indexOf(item.car.id);
                                                        const paletteColor = carIdx >= 0 ? MULTI_CAR_COLORS[carIdx % MULTI_CAR_COLORS.length] : null;
                                                        return (
                                                            <Link
                                                                key={item.booking.id}
                                                                href={route('admin.bookings.show', item.booking.id)}
                                                                className="group flex items-center justify-between p-2.5 rounded-xl bg-surface-25 dark:bg-surface-800/20 border border-surface-100 dark:border-surface-700/30 hover:border-accent-200/50 dark:hover:border-accent-700/30 hover:shadow-sm transition-all duration-200"
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    {paletteColor && <div className={`w-0.5 self-stretch rounded-full ${paletteColor.bar} shrink-0`} />}
                                                                    {!paletteColor && <div className={`w-0.5 self-stretch rounded-full ${cfg.bar} shrink-0`} />}
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-semibold text-surface-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors truncate">
                                                                            {item.car.brand} {item.car.model}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-surface-400 dark:text-surface-500 flex-wrap">
                                                                            <span>{item.car.license_plate}</span>
                                                                            {getName(item.booking) && (
                                                                                <>
                                                                                    <span>·</span>
                                                                                    <span>{getName(item.booking)}</span>
                                                                                </>
                                                                            )}
                                                                            <span>·</span>
                                                                             <span>
                                                                                 {fmtBookingRange(item.booking)}
                                                                             </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className={cfg.badge}>{item.booking.status}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-xs text-surface-400">
                                                    No bookings in this range for the selected vehicles.
                                                </div>
                                            )
                                        ) : activeBookingsForDate.length > 0 ? (
                                            <div className="space-y-2">
                                                {(() => {
                                                    const conflictCars = selectedCars.filter(c => conflictSpansDay(carConflicts.get(c.id), selectedDate));
                                                    const pendingConflictCars = selectedCars.filter(c => pendingConflictSpansDay(pendingConflicts.get(c.id), selectedDate));
                                                    return (
                                                        <>
                                                            {conflictCars.length > 0 && (
                                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200/60 dark:border-red-800/30">
                                                                    <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="text-[10px] font-semibold text-red-700 dark:text-red-400">
                                                                        Overlapping bookings detected — check schedule
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {pendingConflictCars.length > 0 && (
                                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-800/30">
                                                                    <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                    </svg>
                                                                    <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-400">
                                                                        Pending bookings conflict with confirmed — guests need contact
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                                {activeBookingsForDate.map(({ booking, car }) => {
                                                    const cfg = statusConfig(booking.status);
                                                    const carIdx = selectedCarIds.indexOf(car.id);
                                                    const paletteColor = carIdx >= 0 ? MULTI_CAR_COLORS[carIdx % MULTI_CAR_COLORS.length] : null;
                                                    const isPendingConflict = conflictingPendingIds.has(booking.id);
                                                    const pendConf = isPendingConflict && pendingConflicts.get(car.id)?.find(pc => pc.pending.id === booking.id);
                                                    const isExpanded = expandedContactId === booking.id;
                                                    return (
                                                        <div key={booking.id} className={isPendingConflict ? 'space-y-1.5' : ''}>
                                                            <Link
                                                                href={route('admin.bookings.show', booking.id)}
                                                                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                                                                    isPendingConflict
                                                                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200/60 dark:border-orange-800/30 hover:border-orange-300 dark:hover:border-orange-700'
                                                                        : 'bg-surface-25 dark:bg-surface-800/20 border-surface-100 dark:border-surface-700/30 hover:border-accent-200/50 dark:hover:border-accent-700/30 hover:shadow-sm'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    {paletteColor && <div className={`w-0.5 self-stretch rounded-full ${isPendingConflict ? 'bg-orange-400' : paletteColor.bar} shrink-0`} />}
                                                                    {!paletteColor && <div className={`w-0.5 self-stretch rounded-full ${isPendingConflict ? 'bg-orange-400' : cfg.bar} shrink-0`} />}
                                                                    <div className="min-w-0">
                                                                        <div className={`text-xs font-semibold transition-colors truncate ${
                                                                            isPendingConflict
                                                                                ? 'text-orange-700 dark:text-orange-300'
                                                                                : 'text-surface-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400'
                                                                        }`}>
                                                                            {car.brand} {car.model}
                                                                            {isPendingConflict && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        setExpandedContactId(isExpanded ? null : booking.id);
                                                                                    }}
                                                                                    className="ml-1.5 inline-flex items-center gap-0.5 px-1 py-0.5 text-[8px] font-bold rounded bg-orange-200/60 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300 hover:bg-orange-300/60 dark:hover:bg-orange-700/40 transition-all cursor-pointer"
                                                                                >
                                                                                    {isExpanded ? 'Hide contact' : 'Needs contact'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-surface-400 dark:text-surface-500 flex-wrap">
                                                                            <span>{car.license_plate}</span>
                                                                            {getName(booking) && (
                                                                                <>
                                                                                    <span>·</span>
                                                                                    <span className="flex items-center gap-0.5">
                                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                        </svg>
                                                                                        {getName(booking)}
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                             <span>·</span>
                                                                             <span>
                                                                                 {fmtBookingRange(booking)}
                                                                             </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className={cfg.badge}>{booking.status}</span>
                                                            </Link>
                                                            {isPendingConflict && pendConf && isExpanded && (
                                                                <div className="px-2.5 py-1.5 rounded-lg bg-orange-50/70 dark:bg-orange-900/5 border border-orange-200/40 dark:border-orange-800/20 text-[10px] text-orange-600 dark:text-orange-400">
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <span className="flex items-center gap-1">
                                                                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                            </svg>
                                                                            <span className="font-medium">{pendConf.pending.guest?.phone || '—'}</span>
                                                                        </span>
                                                                        <span className="text-orange-300/50 dark:text-orange-600/50">|</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                            </svg>
                                                                            <span className="font-medium">{pendConf.pending.guest?.email || '—'}</span>
                                                                        </span>
                                                                        <span className="text-orange-300/50 dark:text-orange-600/50">|</span>
                                                                        <span>Conflicts with <span className="font-semibold">{getName(pendConf.confirmed)}</span></span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-3 py-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-700/20 shrink-0">
                                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Available</p>
                                                        <p className="text-[11px] text-surface-400 dark:text-surface-500">
                                                            {selectedCars.length === 1
                                                                ? `The ${selectedCars[0].brand} ${selectedCars[0].model} is not booked on this day.`
                                                                : 'No bookings on this day for the selected vehicles.'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowQuickForm(true)}
                                                        className="shrink-0 group relative px-4 py-2 text-xs font-bold rounded-lg bg-accent-400/10 text-accent-600 dark:text-accent-400 hover:bg-accent-400/20 transition-all duration-300 overflow-hidden"
                                                    >
                                                        <span className="relative z-10 flex items-center gap-1.5">
                                                            <span className="relative flex w-1.5 h-1.5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-500" />
                                                            </span>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                            Quick Book
                                                            <span className="text-[8px] font-mono font-medium text-accent-400/60 dark:text-accent-500/60 bg-accent-400/10 px-1 py-0.5 rounded">Q</span>
                                                        </span>
                                                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>

            <QuickBookingPanel
                open={showQuickForm}
                onClose={() => setShowQuickForm(false)}
                selectedCarIds={selectedCarIds}
                selectedCars={selectedCars}
                defaultDate={selectedDate}
                locations={locations}
                bookingTerms={bookingTerms}
            />
        </>
    );
}
