import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    checked: boolean;
    value?: any;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Checkbox({ checked, value, onChange, ...props }: CheckboxProps) {
    return (
        <input
            type="checkbox"
            checked={checked}
            value={value}
            onChange={onChange}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:ring-indigo-600 dark:focus:ring-offset-gray-800"
            {...props}
        />
    );
}
