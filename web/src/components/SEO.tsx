import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://aadikarta.org';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    imageAlt?: string;
    type?: string;
    structuredData?: object;
    noindex?: boolean;
    publishedTime?: string;
    modifiedTime?: string;
    /**
     * Overrides the auto-derived (from the current URL) canonical path.
     * Needed for pages reachable under more than one URL for the same
     * content (e.g. an astrologer profile at both its legacy numeric-ID
     * path and its slug path) — without this, a crawler that reads the
     * page before any client-side redirect fires sees a self-referencing
     * canonical on the non-preferred URL, producing duplicate-content
     * signals instead of a clear preferred-URL signal.
     */
    canonicalPath?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords = 'Aadikarta Vedic Astrology, Aadikarta Astro, online astrology, Vedic astrologers, Kundli matching, daily horoscope, tarot reading, Vastu Shastra',
    image = `${BASE_URL}/assets/og-image.png`,
    imageAlt,
    type = 'website',
    structuredData,
    noindex = false,
    publishedTime,
    modifiedTime,
    canonicalPath,
}) => {
    const { pathname } = useLocation();
    const resolvedPath = canonicalPath ?? pathname;
    const canonical = `${BASE_URL}${resolvedPath === '/' ? '/' : resolvedPath}`;
    
    let fullTitle = title;
    if (!title.includes('Aadikarta Vedic Astrology')) {
        if (title.includes('Aadikarta')) {
            fullTitle = title.replace(/\bAadikarta\b/g, 'Aadikarta Vedic Astrology');
        } else {
            fullTitle = `${title} | Aadikarta Vedic Astrology`;
        }
    }
    const resolvedImageAlt = imageAlt || fullTitle;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={canonical} />
            <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonical} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:image:alt" content={resolvedImageAlt} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:locale" content="en_IN" />
            <meta property="og:site_name" content="Aadikarta Vedic Astrology" />

            {/* Article-specific Open Graph */}
            {type === 'article' && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            {type === 'article' && modifiedTime && (
                <meta property="article:modified_time" content={modifiedTime} />
            )}
            {type === 'article' && (
                <meta property="article:author" content="https://aadikarta.org/about-us" />
            )}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@astro_aadikarta_2026" />
            <meta name="twitter:url" content={canonical} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:image:alt" content={resolvedImageAlt} />

            {/* JSON-LD structured data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
