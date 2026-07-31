import React from 'react';

interface FreeToolResultProps {
    /** Raw JSON payload from the FreeAstroAPI-backed endpoint — shape isn't fully
     * fixed on our side, so this renders defensively: known array-of-items shapes
     * get a card layout, anything else falls back to a readable JSON dump. */
    data: unknown;
}

const pickString = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
    for (const key of keys) {
        const value = obj[key];
        if (typeof value === 'string' && value.trim()) return value;
    }
    return undefined;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const ItemCard: React.FC<{ item: Record<string, unknown> }> = ({ item }) => {
    const title = pickString(item, ['name', 'title', 'yoga', 'label', 'id']);
    const description = pickString(item, ['description', 'interpretation', 'summary', 'text', 'meaning']);
    const otherEntries = Object.entries(item).filter(
        ([key, value]) => !['name', 'title', 'yoga', 'label', 'id', 'description', 'interpretation', 'summary', 'text', 'meaning'].includes(key)
            && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    );

    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
            {title && <h3 className="font-semibold text-white mb-1">{title}</h3>}
            {description && <p className="text-gray-300 text-sm leading-relaxed mb-2">{description}</p>}
            {otherEntries.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {otherEntries.map(([key, value]) => (
                        <span key={key} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-400">
                            {key}: <span className="font-medium text-gray-200">{String(value)}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

const FreeToolResult: React.FC<FreeToolResultProps> = ({ data }) => {
    // Look for the first array of objects anywhere at the top level — that's the
    // most likely "list of results" shape (yogas, vargas, numerology numbers).
    let items: Record<string, unknown>[] | null = null;
    if (Array.isArray(data) && data.every(isPlainObject)) {
        items = data as Record<string, unknown>[];
    } else if (isPlainObject(data)) {
        for (const value of Object.values(data)) {
            if (Array.isArray(value) && value.length > 0 && value.every(isPlainObject)) {
                items = value as Record<string, unknown>[];
                break;
            }
        }
    }

    if (items && items.length > 0) {
        return (
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <ItemCard key={idx} item={item} />
                ))}
            </div>
        );
    }

    return (
        <pre className="bg-white/5 rounded-2xl border border-white/10 p-5 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
        </pre>
    );
};

export default FreeToolResult;
