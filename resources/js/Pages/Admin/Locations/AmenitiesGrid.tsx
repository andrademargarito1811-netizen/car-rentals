import { cn } from '@/lib/utils';
import { Label } from '@/Components/ui/label';
import {
    Wifi,
    Car,
    Coffee,
    Shield,
    Clock,
    Luggage,
    Snowflake,
    Building2,
    Soup,
    Tv,
    Sparkles,
} from 'lucide-react';

const AMENITIES = [
    { key: 'wifi', label: 'Free Wi-Fi', icon: Wifi },
    { key: 'parking', label: 'Free Parking', icon: Car },
    { key: 'shuttle', label: 'Airport Shuttle', icon: Building2 },
    { key: 'coffee', label: 'Complimentary Coffee', icon: Coffee },
    { key: 'insurance', label: 'Insurance Included', icon: Shield },
    { key: '247', label: '24/7 Counter Service', icon: Clock },
    { key: 'luggage', label: 'Luggage Storage', icon: Luggage },
    { key: 'ac', label: 'Air Conditioning', icon: Snowflake },
    { key: 'snacks', label: 'Complimentary Snacks', icon: Soup },
    { key: 'entertainment', label: 'Entertainment System', icon: Tv },
    { key: 'premium', label: 'Premium Vehicles', icon: Sparkles },
] as const;

interface AmenitiesGridProps {
    selected: string[];
    onChange: (selected: string[]) => void;
    error?: string;
}

export default function AmenitiesGrid({ selected, onChange, error }: AmenitiesGridProps) {
    function toggle(key: string) {
        if (selected.includes(key)) {
            onChange(selected.filter(k => k !== key));
        } else {
            onChange([...selected, key]);
        }
    }

    const selectedSet = new Set(selected);

    return (
        <div className="space-y-3">
            <Label className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Services & Amenities
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES.map(({ key, label, icon: Icon }) => {
                    const active = selectedSet.has(key);
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => toggle(key)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                                active
                                    ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 shadow-sm'
                                    : 'border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-500',
                            )}
                        >
                            <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-accent-500' : 'text-surface-400')} />
                            <span className="text-xs">{label}</span>
                        </button>
                    );
                })}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

export { AMENITIES };
