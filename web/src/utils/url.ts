const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Resolves a potentially relative image URL by prefixing it with the API base URL.
 * Also handles fallback avatars.
 */
export const resolveImageUrl = (url: string | null | undefined, fallbackName?: string) => {
    if (!url) {
        return fallbackName 
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`
            : `https://ui-avatars.com/api/?name=User&background=random`;
    }
    
    if (url.startsWith('http')) {
        return url;
    }
    
    // Ensure API_URL doesn't end with slash and url doesn't start with double slash
    const base = API_URL.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    
    return `${base}${path}`;
};
