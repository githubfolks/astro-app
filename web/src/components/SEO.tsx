import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://aadikarta.org';

interface SEOProps {
    title: string;
    description: string;
    image?: string;
    type?: string;
    structuredData?: object;
    noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image = `${BASE_URL}/assets/og-image.jpg`,
    type = 'website',
    structuredData,
    noindex = false,
}) => {
    const { pathname } = useLocation();
    const canonical = `${BASE_URL}${pathname === '/' ? '' : pathname}` || BASE_URL;
    const fullTitle = `${title} | Aadikarta`;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonical} />
            <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonical} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:locale" content="en_IN" />
            <meta property="og:site_name" content="Aadikarta" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonical} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

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
