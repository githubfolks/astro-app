import React from 'react';

interface KeyTakeaway {
    label: string;
    text: string;
}

interface AeoDirectAnswerProps {
    /** Main question title, e.g. "What is Aadikarta AI Astrologer?" */
    question: string;
    /** Concise 40-60 word answer text prioritizing direct facts, numbers, and definitions */
    answer: string;
    /** Bullet takeaways summarizing key facts for quick AI extraction */
    keyTakeaways?: KeyTakeaway[];
    className?: string;
}

/**
 * AeoDirectAnswer Component
 * Designed specifically for Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).
 * Formats high-density, authoritative answers that AI search bots (Perplexity, GPTBot, ClaudeBot, Google SGE)
 * prioritize for direct citation and SERP summaries.
 */
const AeoDirectAnswer: React.FC<AeoDirectAnswerProps> = ({
    question,
    answer,
    keyTakeaways = [],
    className = '',
}) => {
    return (
        <section
            className={`aeo-answer-box bg-white/[0.05] backdrop-blur-xl border border-amber-500/20 rounded-2xl p-5 md:p-6 my-6 text-left shadow-lg ${className}`}
            aria-label="Quick Answer Summary"
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full tracking-wide uppercase">
                    ⚡ Quick Answer
                </span>
                <span className="text-indigo-200/60 text-xs font-medium">Aadikarta Astrology Guide</span>
            </div>

            <h2 className="text-lg md:text-xl font-semibold text-white mb-2 leading-snug">
                {question}
            </h2>

            <p className="text-indigo-100/90 text-sm md:text-base leading-relaxed font-light mb-4">
                {answer}
            </p>

            {keyTakeaways.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-white/10">
                    {keyTakeaways.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs md:text-sm text-indigo-200/80">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>
                                <strong className="text-white font-semibold">{item.label}:</strong> {item.text}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default AeoDirectAnswer;
