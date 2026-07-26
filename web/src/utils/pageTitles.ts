const ROUTE_TITLES: Record<string, string> = {
    '/': 'Aadikarta',
    '/login': 'Login',
    '/signup': 'Sign Up',
    '/forgot-password': 'Forgot Password',
    '/verify-otp': 'Verify OTP',
    '/verify-email': 'Verify Email',
    '/reset-password': 'Reset Password',
    '/ai-astrologer': 'AI Astrologer',
    '/astrologers': 'Astrologers',
    '/about-us': 'About Us',
    '/contact-us': 'Contact Us',
    '/privacy-policy': 'Privacy Policy',
    '/refund-policy': 'Refund Policy',
    '/disclaimer': 'Disclaimer',
    '/terms-of-service': 'Terms of Service',
    '/join-as-astrologer': 'Join as Astrologer',
    '/how-it-works': 'How It Works',
    '/pricing': 'Pricing',
    '/horoscope': 'Horoscope',
    '/blog': 'Blog',
    '/memory-guru': 'Memory Guru',
    '/book': 'Book a Session',
    '/panchang': 'Panchang',
    '/dashboard': 'Dashboard',
    '/kundli': 'Kundli',
    '/kundli/matching': 'Kundli Matching',
    '/kundli/muhurat': 'Muhurat Search',
    '/services/kundli-matching': 'Kundli Matching',
    '/services/love-advice': 'Love Advice',
    '/services/daily-horoscope': 'Daily Horoscope',
    '/services/vedic-astrology': 'Vedic Astrology',
    '/services/tarot-reading': 'Tarot Reading',
    '/services/vastu-shastra': 'Vastu Shastra',
};

const PREFIX_TITLES: Array<[string, string]> = [
    ['/astrologers/', 'Astrologer Profile'],
    ['/astrologer/', 'Astrologer Profile'],
    ['/horoscope/', 'Horoscope'],
    ['/blog/', 'Blog Post'],
    ['/chat/', 'Chat'],
    ['/classroom/', 'Classroom'],
];

const titleCase = (slug: string): string =>
    slug
        .split('-')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export const getPageTitle = (pathname: string): string => {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

    for (const [prefix, title] of PREFIX_TITLES) {
        if (pathname.startsWith(prefix)) return title;
    }

    const lastSegment = pathname.split('/').filter(Boolean).pop();
    return lastSegment ? titleCase(lastSegment) : 'Aadikarta';
};
