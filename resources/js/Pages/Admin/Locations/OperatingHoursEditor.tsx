import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Clock, Sparkles } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export interface DayHours {
    open: string;
    close: string;
    closed: boolean;
}

function parseHoursString(hours: string): Record<string, DayHours> {
    const defaults: Record<string, DayHours> = {};
    for (const day of DAYS) {
        defaults[day] = { open: '09:00', close: '18:00', closed: day === 'Sunday' };
    }
    if (!hours) return defaults;

    const entries = hours.split('\n');
    for (const entry of entries) {
        const [dayName, range] = entry.split(':').map(s => s.trim());
        if (!dayName || !range) continue;
        const day = DAYS.find(d => d.toLowerCase().startsWith(dayName.toLowerCase()));
        if (!day) continue;
        if (range.toLowerCase() === 'closed') {
            defaults[day] = { ...defaults[day], closed: true };
        } else {
            const [open, close] = range.split('-').map(s => s.trim());
            if (open && close) {
                defaults[day] = {
                    open: to24h(open),
                    close: to24h(close),
                    closed: false,
                };
            }
        }
    }
    return defaults;
}

function to24h(time: string): string {
    const match = time.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)$/i);
    if (match) {
        let h = parseInt(match[1]);
        const m = match[2] || '00';
        const mer = match[3].toLowerCase();
        if (mer === 'pm' && h !== 12) h += 12;
        if (mer === 'am' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m}`;
    }
    if (/^\d{2}:\d{2}$/.test(time)) return time;
    return '09:00';
}

function to12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const mer = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${mer}`;
}

function serializeHours(days: Record<string, DayHours>): string {
    return DAYS
        .map(day => {
            const d = days[day];
            if (d.closed) return `${day}: Closed`;
            return `${day}: ${to12h(d.open)} - ${to12h(d.close)}`;
        })
        .join('\n');
}

interface OperatingHoursEditorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

const PRESETS: { label: string; apply: () => Record<string, DayHours> }[] = [
    {
        label: 'Standard (9–6 M–F, Closed S–S)',
        apply: () => {
            const r: Record<string, DayHours> = {};
            for (const day of DAYS) {
                const isWeekend = day === 'Saturday' || day === 'Sunday';
                r[day] = isWeekend
                    ? { open: '09:00', close: '18:00', closed: true }
                    : { open: '09:00', close: '18:00', closed: false };
            }
            return r;
        },
    },
    {
        label: '9–9 Daily',
        apply: () => {
            const r: Record<string, DayHours> = {};
            for (const day of DAYS) r[day] = { open: '09:00', close: '21:00', closed: false };
            return r;
        },
    },
    {
        label: '24/7',
        apply: () => {
            const r: Record<string, DayHours> = {};
            for (const day of DAYS) r[day] = { open: '00:00', close: '23:59', closed: false };
            return r;
        },
    },
];

export default function OperatingHoursEditor({ value, onChange, error }: OperatingHoursEditorProps) {
    const days = parseHoursString(value);

    function updateDay(day: string, updates: Partial<DayHours>) {
        const next = { ...days, [day]: { ...days[day], ...updates } };
        onChange(serializeHours(next));
    }

    function applyPreset(preset: typeof PRESETS[number]) {
        onChange(serializeHours(preset.apply()));
    }

    return (
        <div className="space-y-3">
            <Label className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Operating Hours
            </Label>
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <Sparkles className="w-3.5 h-3.5 text-surface-400" />
                {PRESETS.map(p => (
                    <Button key={p.label} type="button" variant="outline" size="sm" onClick={() => applyPreset(p)}>
                        {p.label}
                    </Button>
                ))}
            </div>
            <div className="space-y-4">
                {[{ label: 'Weekdays', days: DAYS.filter(d => d !== 'Saturday' && d !== 'Sunday') }, { label: 'Weekend', days: DAYS.filter(d => d === 'Saturday' || d === 'Sunday') }].map(section => (
                    <div key={section.label}>
                        <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">{section.label}</h4>
                        <div className="space-y-2">
                            {section.days.map(day => {
                                const d = days[day];
                                return (
                                    <div key={day} className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
                                        <span className="w-16 text-sm font-semibold text-surface-900 dark:text-white">
                                            {day.slice(0, 3)}
                                        </span>
                                        <label className="flex items-center gap-1.5 text-sm cursor-pointer shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={d.closed}
                                                onChange={e => updateDay(day, { closed: e.target.checked })}
                                                className="w-3.5 h-3.5 rounded border-surface-300 text-accent-500 focus:ring-accent-400"
                                            />
                                            Closed
                                        </label>
                                        {!d.closed && (
                                            <div className="flex items-center gap-2 ml-auto">
                                                <Input
                                                    type="time"
                                                    value={d.open}
                                                    onChange={e => updateDay(day, { open: e.target.value })}
                                                    className="w-28 h-8 text-xs"
                                                />
                                                <span className="text-xs text-surface-400">to</span>
                                                <Input
                                                    type="time"
                                                    value={d.close}
                                                    onChange={e => updateDay(day, { close: e.target.value })}
                                                    className="w-28 h-8 text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

export { serializeHours, parseHoursString };
