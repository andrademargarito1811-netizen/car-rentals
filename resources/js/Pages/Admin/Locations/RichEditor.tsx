import { useRef, useCallback, useEffect } from 'react';
import { Label } from '@/Components/ui/label';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface RichEditorProps {
    label: string;
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const TOOLS = [
    { icon: Bold, cmd: 'bold', title: 'Bold' },
    { icon: Italic, cmd: 'italic', title: 'Italic' },
    { icon: List, cmd: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Numbered List' },
];

export default function RichEditor({ label, value, onChange, placeholder }: RichEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternal = useRef(false);

    useEffect(() => {
        const el = editorRef.current;
        if (!el || isInternal.current) {
            isInternal.current = false;
            return;
        }
        if (el.innerHTML !== value) {
            el.innerHTML = value;
        }
    }, [value]);

    const exec = useCallback((cmd: string) => {
        document.execCommand(cmd, false);
        editorRef.current?.focus();
        isInternal.current = true;
        onChange(editorRef.current?.innerHTML || '');
    }, [onChange]);

    const handleInput = useCallback(() => {
        isInternal.current = true;
        onChange(editorRef.current?.innerHTML || '');
    }, [onChange]);

    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-input bg-muted/30">
                    {TOOLS.map(tool => (
                        <button
                            key={tool.cmd}
                            type="button"
                            title={tool.title}
                            onMouseDown={e => { e.preventDefault(); exec(tool.cmd); }}
                            className="p-1.5 rounded-md text-surface-500 hover:text-surface-800 hover:bg-surface-200 dark:hover:text-surface-200 dark:hover:bg-surface-700 transition-colors"
                        >
                            <tool.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
                <div
                    ref={el => {
                        if (el && !el.innerHTML) {
                            el.innerHTML = value;
                        }
                        editorRef.current = el;
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    data-placeholder={placeholder}
                    className="px-3 py-2.5 text-sm min-h-[160px] focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:mb-1"
                />
            </div>
        </div>
    );
}
