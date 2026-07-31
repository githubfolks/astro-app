import React from 'react';

const reviews = [
    {
        initials: 'A.S.',
        name: 'Anjali S.',
        rating: 5,
        quote: 'The consultation was spot on! My astrologer helped me understand my career path clearly within minutes.',
    },
    {
        initials: 'R.K.',
        name: 'Rahul K.',
        rating: 4,
        quote: 'Very intuitive reading on my kundli. The chat connected instantly and the astrologer was genuinely helpful.',
    },
    {
        initials: 'P.M.',
        name: 'Priya M.',
        rating: 5,
        quote: "I love the daily horoscope and Panchang section. It's become my go-to ritual every morning.",
    },
    {
        initials: 'V.N.',
        name: 'Vikas N.',
        rating: 5,
        quote: 'Got a love & compatibility reading before a big decision. Honest, detailed, and worth every rupee.',
    },
];

const Testimonials: React.FC = () => {
    return (
        <section className="testimonials-section py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto mb-16 text-center" data-aos="fade-up">
                    <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Customer Reviews</span>
                    <h2 className="text-3xl md:text-4xl text-gray-900 mb-6">
                        What Our <span className="text-indigo-600">Users Say</span>
                    </h2>
                    <p className="text-xl text-gray-600 leading-relaxed">Real experiences from seekers who found clarity through our astrologers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {reviews.map((review, idx) => (
                        <div
                            key={review.initials}
                            className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1"
                            data-aos="fade-up"
                            data-aos-delay={idx * 100}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                    {review.initials}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
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
