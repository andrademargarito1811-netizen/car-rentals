import { InputHTMLAttributes, useEffect, useRef } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TextInput({ value, onChange, ...props }: TextInputProps) {
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (input.current?.hasAttribute('autofocus')) {
            input.current?.focus();
        }
    }, []);

    return (
        <input
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600"
            value={value}
            onChange={onChange}
            ref={input}
            {...props}
        />
    );
}
