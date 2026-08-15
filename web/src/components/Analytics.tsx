import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { initGA, trackPageView } from '../utils/analytics';

const GSC_VERIFICATION = import.meta.env.VITE_GSC_VERIFICATION as string | undefined;

// GA4 init + SPA page-view tracking (mirrors ScrollToTop's pattern of a
// route-change effect) and the Search Console HTML-tag verification meta —
// both no-op until their env vars are set, see analytics.ts.
const Analytics = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        initGA();
    }, []);

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
