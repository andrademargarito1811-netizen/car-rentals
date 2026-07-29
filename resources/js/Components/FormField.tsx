import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    value: string | number;
    onChange: (value: string) => void;
    step?: string;
    disabled?: boolean;
    className?: string;
}

export default function FormField({
    label,
    error,
    required,
    type = 'text',
    placeholder,
    value,
    onChange,
    step,
    disabled,
    className,
}: FormFieldProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label>
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <Input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                step={step}
                disabled={disabled}
                className={cn(error && 'border-red-500 focus-visible:ring-red-400')}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
