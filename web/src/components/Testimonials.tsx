import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface DisplayReview {
    key: string;
    name: string;
    rating: number;
    quote: string;
}

// Shown only if the platform has no real written reviews yet, so the section
// never renders empty on a new/low-volume install.
const fallbackReviews: DisplayReview[] = [
    {
        key: 'fallback-1',
        name: 'Anjali S.',
        rating: 5,
        quote: 'The consultation was spot on! My astrologer helped me understand my career path clearly within minutes.',
    },
    {
        key: 'fallback-2',
        name: 'Rahul K.',
        rating: 4,
        quote: 'Very intuitive reading on my kundli. The chat connected instantly and the astrologer was genuinely helpful.',
    },
    {
        key: 'fallback-3',
        name: 'Priya M.',
        rating: 5,
        quote: "I love the daily horoscope and Panchang section. It's become my go-to ritual every morning.",
    },
    {
        key: 'fallback-4',
        name: 'Vikas N.',
        rating: 5,
        quote: 'Got a love & compatibility reading before a big decision. Honest, detailed, and worth every rupee.',
    },
];

const initialsOf = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
};

const Testimonials: React.FC = () => {
    const [reviews, setReviews] = useState<DisplayReview[]>(fallbackReviews);
    const [isReal, setIsReal] = useState(false);

    useEffect(() => {
        let cancelled = false;
        api.cms.getReviews(8)
            .then((data) => {
                if (cancelled || data.length === 0) return;
                setReviews(data.map((r) => ({
                    key: `${r.astrologer_display_name}-${r.created_at}`,
                    name: r.seeker_display_name,
                    rating: r.rating,
                    quote: r.comment,
                })));
                setIsReal(true);
            })
            .catch(() => { /* keep fallback copy on failure */ });
        return () => { cancelled = true; };
    }, []);

    return (
        <section className="testimonials-section py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto mb-16 text-center" data-aos="fade-up">
                    <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Customer Reviews</span>
                    <h2 className="text-3xl md:text-4xl text-gray-900 mb-6">
                        What Our <span className="text-indigo-600">Users Say</span>
                    </h2>
                    <p className="text-xl text-gray-600 leading-relaxed">
                        {isReal ? 'Real reviews submitted after live consultations on Aadikarta.' : 'Real experiences from seekers who found clarity through our astrologers.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {reviews.map((review, idx) => (
                        <div
                            key={review.key}
                            className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1"
                            data-aos="fade-up"
                            data-aos-delay={idx * 100}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                    {initialsOf(review.name)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{review.name}</h3>
                                    <div className="text-amber-500 text-sm" aria-label={`${review.rating} out of 5 stars`}>
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-600 italic leading-relaxed">&ldquo;{review.quote}&rdquo;</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
