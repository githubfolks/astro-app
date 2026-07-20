import React from 'react';

export interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    faqs: FAQItem[];
    title?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs, title = "Frequently Asked Questions" }) => {
    if (!faqs || faqs.length === 0) return null;

    return (
        <section className="faq-section max-w-4xl mx-auto px-6 py-12" data-aos="fade-up">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-normal text-white mb-4">{title}</h2>
                <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <details 
                        key={index} 
                        className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-amber-500/30 open:border-amber-500/50 open:bg-white/10"
                    >
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none text-lg font-medium text-white select-none">
                            <span className="pr-6">{faq.question}</span>
                            <span className="flex-shrink-0 text-amber-500 transition-transform duration-300 group-open:rotate-180">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0 text-gray-300 leading-relaxed font-light">
                            {faq.answer}
                        </div>
                    </details>
                ))}
            </div>
        </section>
    );
};

export default FAQSection;
