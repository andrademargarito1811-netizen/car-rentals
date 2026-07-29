interface InputErrorProps {
    message?: string;
    className?: string;
}

export default function InputError({ message, className }: InputErrorProps) {
    return message ? (
        <div className={className}>
            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
    ) : null;
}
