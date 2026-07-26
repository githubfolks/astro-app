import React, { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { storage } from '../utils/storage';
import './Onboarding.css';

interface Slide {
    image: string;
    title: string;
    description: string;
}

const slides: Slide[] = [
    {
        image: '/assets/hero_astrology.webp',
        title: 'Discover Your Cosmic Blueprint',
        description: 'Personalized Vedic astrology insights based on your unique birth chart.',
    },
    {
        image: '/assets/about-mission.webp',
        title: 'Unlock Your Birth Chart',
        description: 'Explore Kundli, horoscope, and planetary insights made just for you.',
    },
    {
        image: '/assets/contact-illustration.webp',
        title: 'Connect with Verified Astrologers',
        description: "Live chat with India's top astrologers anytime, from ₹10/min.",
    },
];

interface Props {
    onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const finish = () => {
        storage.setItem('onboarding_complete', 'true');
        onComplete();
    };

    const goToSlide = (index: number) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
    };

    const handleScroll = () => {
        const track = trackRef.current;
        if (!track) return;
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setActiveIndex(index);
    };

    const handleNext = () => {
        if (activeIndex === slides.length - 1) {
            finish();
        } else {
            goToSlide(activeIndex + 1);
        }
    };

    return (
        <div className="onboarding-screen">
            <button className="onboarding-skip" onClick={finish}>Skip</button>

            <div className="onboarding-track" ref={trackRef} onScroll={handleScroll}>
                {slides.map((slide) => (
                    <div className="onboarding-slide" key={slide.title}>
                        <img src={slide.image} alt="" className="onboarding-image" />
                        <h2 className="onboarding-title">{slide.title}</h2>
                        <p className="onboarding-description">{slide.description}</p>
                    </div>
                ))}
            </div>

            <div className="onboarding-footer">
                <div className="onboarding-dots">
                    {slides.map((slide, index) => (
                        <span
                            key={slide.title}
                            className={`onboarding-dot ${index === activeIndex ? 'active' : ''}`}
                        />
                    ))}
                </div>
                <button className="onboarding-next" onClick={handleNext} aria-label="Next">
                    <ArrowRight size={22} />
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
