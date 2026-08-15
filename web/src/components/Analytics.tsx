import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { trackPageView } from '../utils/analytics';

const GSC_VERIFICATION = import.meta.env.VITE_GSC_VERIFICATION as string | undefined;

// SPA page-view tracking (mirrors ScrollToTop's pattern of a route-change
// effect) — GTM's own snippet in index.html handles loading/booting GA4, see
// analytics.ts — and the Search Console HTML-tag verification meta, a no-op
// until VITE_GSC_VERIFICATION is set.
const Analytics = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        trackPageView(pathname + search);
    }, [pathname, search]);

    if (!GSC_VERIFICATION) return null;
    return (
        <Helmet>
            <meta name="google-site-verification" content={GSC_VERIFICATION} />
        </Helmet>
    );
};

export default Analytics;
