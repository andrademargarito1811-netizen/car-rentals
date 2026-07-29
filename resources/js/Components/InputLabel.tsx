interface InputLabelProps {
    value?: string;
    children?: React.ReactNode;
    className?: string;
    htmlFor?: string;
}

export default function InputLabel({ value, children, className, htmlFor }: InputLabelProps) {
    return (
        <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className || ''}`}>
            {value || children}
        </label>
    );
}
