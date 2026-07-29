import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

interface FormTextareaProps {
    label: string;
    error?: string;
    required?: boolean;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    disabled?: boolean;
    className?: string;
}

export default function FormTextarea({
    label,
    error,
    required,
    placeholder,
    value,
    onChange,
    rows = 3,
    disabled,
    className,
}: FormTextareaProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label>
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <textarea
                rows={rows}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    'flex w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500 focus-visible:ring-red-400',
                    className,
                )}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
