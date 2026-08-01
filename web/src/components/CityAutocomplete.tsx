import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

interface PlaceSuggestion {
    label: string;
    city: string;
    state: string;
    lat: number;
    lon: number;
}

interface CityAutocompleteProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    className: string;
    placeholder?: string;
    required?: boolean;
    dropdownClassName?: string;
}

/** Debounced "City, State, India" suggestions for Place of Birth fields, backed by /places/autocomplete. */
const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
    id,
    value,
    onChange,
    className,
    placeholder,
    required,
    dropdownClassName = "bg-white text-gray-900",
}) => {
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

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
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const fetchSuggestions = (query: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            const requestId = ++requestIdRef.current;
            try {
                const results = await api.places.autocomplete(query);
                if (requestId !== requestIdRef.current) return; // stale response
                setSuggestions(results);
                setOpen(results.length > 0);
                setHighlightIndex(-1);
            } catch {
                if (requestId !== requestIdRef.current) return;
                setSuggestions([]);
                setOpen(false);
            }
        }, 300);
    };

    const selectSuggestion = (suggestion: PlaceSuggestion) => {
        onChange(suggestion.label);
        setOpen(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((i) => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        } else if (e.key === 'Enter') {
            if (highlightIndex >= 0) {
                e.preventDefault();
                selectSuggestion(suggestions[highlightIndex]);
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                id={id}
                type="text"
                required={required}
                autoComplete="off"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    fetchSuggestions(e.target.value);
                }}
                onFocus={() => {
                    if (suggestions.length > 0) setOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className={className}
                placeholder={placeholder}
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
            />
            {open && (
                <ul className={`absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl shadow-lg border border-black/10 ${dropdownClassName}`}>
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={`${suggestion.label}-${suggestion.lat}-${suggestion.lon}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectSuggestion(suggestion);
                            }}
                            onMouseEnter={() => setHighlightIndex(index)}
                            className={`px-4 py-2 text-sm cursor-pointer ${index === highlightIndex ? 'bg-amber-500/20' : ''}`}
                        >
                            {suggestion.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CityAutocomplete;
