import { Link } from 'react-router-dom';
import { Star, Heart, FileText, Sun, Moon, Compass } from 'lucide-react';
import './Services.css';

const services = [
    {
        icon: <FileText size={32} />,
        title: "Kundli Matching",
        description: "Detailed compatibility analysis for marriage and relationships.",
        color: "#9C27B0",
        slug: "kundli-matching"
    },
    {
        icon: <Heart size={32} />,
        title: "Love Advice",
        description: "Expert guidance for your romantic life and future partners.",
        color: "#E91E63",
        slug: "love-advice"
    },
    {
        icon: <Sun size={32} />,
        title: "Daily Horoscope",
        description: "Get your daily predictions for health, wealth, and luck.",
        color: "#FF9800",
        slug: "daily-horoscope"
    },
    {
        icon: <Moon size={32} />,
        title: "Vedic Astrology",
        description: "Ancient wisdom to solve modern life problems.",
        color: "#673AB7",
        slug: "vedic-astrology"
    },
    {
        icon: <Star size={32} />,
        title: "Tarot Reading",
        description: "Unveil the hidden mysteries of your life with cards.",
        color: "#2196F3",
        slug: "tarot-reading"
    },
    {
        icon: <Compass size={32} />,
        title: "Vastu Shastra",
        description: "Harmonize your living space for positivity and success.",
        color: "#4CAF50",
        slug: "vastu-shastra"
    }
];

const Services: React.FC = () => {
    return (
        <section className="services-section">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <h2 className="section-title">Services We Offer</h2>
                    <p className="section-description">
                        Explore a wide range of astrological services tailored to your needs.
                    </p>
                </div>

                <div className="services-grid">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="service-card"
                            style={{ '--service-color': service.color } as React.CSSProperties}
                            data-aos="fade-up"
                            data-aos-delay={index * 100}
                        >
                            <div className="service-icon-wrapper">
                                {service.icon}
                            </div>
                            <h3 className="service-title">{service.title}</h3>
                            <p className="service-description">{service.description}</p>
                            <Link to={`/services/${service.slug}`} className="service-link" aria-label={`Learn more about ${service.title}`}>Learn More →</Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
