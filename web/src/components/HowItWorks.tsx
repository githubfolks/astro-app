import React from 'react';
import { UserPlus, Search, UserCheck, MessageCircle } from 'lucide-react';
import './HowItWorks.css';

const steps = [
    {
        icon: <UserPlus size={32} />,
        title: "Sign Up",
        description: "Create an account in just 5 seconds using your mobile number or email.",
        stepNumber: "01"
    },
    {
        icon: <Search size={32} />,
        title: "Choose Service",
        description: "Browse our list of services: Chat, Call, or detailed manual Reports.",
        stepNumber: "02"
    },
    {
        icon: <UserCheck size={32} />,
        title: "Select Astrologer",
        description: "Check ratings, reviews, and profiles to find the best expert for you.",
        stepNumber: "03"
    },
    {
        icon: <MessageCircle size={32} />,
        title: "Start Consultation",
        description: "Fill in your birth details and start your consultation instantly.",
        stepNumber: "04"
    }
];

const HowItWorks: React.FC = () => {
    return (
        <section className="how-it-works-section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-description">
                        Get connected with the world's best astrologers in just 4 simple steps.
                    </p>
                </div>

                <div className="steps-container">
                    {steps.map((step, index) => (
                        <div key={index} className="step-card">
                            <div className="step-number">{step.stepNumber}</div>
                            <div className="step-icon-wrapper">
                                {step.icon}
                            </div>
                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-description">{step.description}</p>
                            {index < steps.length - 1 && <div className="step-connector"></div>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
