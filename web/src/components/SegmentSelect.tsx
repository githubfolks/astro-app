import React, { useEffect, useRef, useState } from 'react';

interface Option {
    value: number;
    label: string;
}

interface SegmentSelectProps {
    id?: string;
    value: number | undefined;
    options: Option[];
    onChange: (value: number) => void;
    className: string;
    placeholder: string;
    required?: boolean;
}

/**
 * A single dropdown segment rendered entirely in the DOM (button + absolutely
 * positioned list), used to build DatePicker/TimePicker. Unlike a native
 * `<select>`, Android WebView never delegates this to a system popup/dialog,
 * so it can't pick up unrelated OS-level dialog theming (e.g. app icon
 * bleed-through in native list dialogs).
 */
const LIST_MAX_HEIGHT = 224; // px, matches max-h-56

const SegmentSelect: React.FC<SegmentSelectProps> = ({ id, value, options, onChange, className, placeholder, required }) => {
    const [open, setOpen] = useState(false);
    // Compact modals/forms often have little room below a mid-form field, so a
    // dropdown that always opens downward spills over and hides whatever comes
    // next (e.g. the field right after Date of Birth). Flip it upward when
    // there isn't enough space below the trigger at open time.
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const isDark = className.includes('text-white');

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (open && listRef.current) {
            const selected = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
            selected?.scrollIntoView({ block: 'center' });
        }
    }, [open]);

    const selectedLabel = options.find((o) => o.value === value)?.label;

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={buttonRef}
                id={id}
                type="button"
                onClick={() => {
                    if (!open && buttonRef.current) {
                        // A trigger positioned in the upper half of a tall,
                        // scrollable form (e.g. a Dashboard "My Profile" card)
                        // still has far more raw viewport space *below* it than
                        // above — comparing total space above vs. below alone
                        // picks "below" there, which then buries the very next
                        // button (e.g. "Save Profile") under the list even
                        // though it easily could have opened upward instead.
                        // Prefer upward whenever the list can fully fit there;
                        // only fall back to downward (or whichever side has
                        // more room, if neither fully fits) when it can't.
                        const rect = buttonRef.current.getBoundingClientRect();
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const spaceAbove = rect.top;
                        const fitsAbove = spaceAbove >= LIST_MAX_HEIGHT;
                        const fitsBelow = spaceBelow >= LIST_MAX_HEIGHT;
                        setOpenUpward(fitsAbove || (!fitsBelow && spaceAbove > spaceBelow));
                    }
                    setOpen((o) => !o);
                }}
                className={`${className} flex items-center justify-between gap-1 text-left`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={selectedLabel === undefined ? 'opacity-50' : ''}>{selectedLabel ?? placeholder}</span>
                <span aria-hidden="true" className="opacity-60 text-xs">▾</span>
            </button>
            {required && (
                <input
                    type="text"
                    required
                    value={value ?? ''}
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                    onFocus={() => setOpen(true)}
                />
            )}
            {open && (
                <ul
                    ref={listRef}
                    role="listbox"
                    className={`absolute z-20 ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} max-h-56 w-full overflow-y-auto rounded-xl shadow-lg border border-black/10 ${isDark ? 'bg-[#1a1530] text-white divide-y divide-white/5' : 'bg-white text-gray-900 divide-y divide-black/5'}`}
                >
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            role="option"
                            aria-selected={opt.value === value}
                            data-selected={opt.value === value}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            className={`px-4 py-2 text-sm cursor-pointer ${opt.value === value ? 'bg-amber-500/20 font-semibold' : ''}`}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SegmentSelect;
