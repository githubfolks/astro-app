import React from 'react';
import './Testimonials.css';

const Testimonials: React.FC = () => {
    return (
        <section className="testimonials-section">
            <div className="container">
                <div className="section-header">
                    <h2>Customer Reviews</h2>
                    <p>See what our users say about their experience.</p>
                </div>

                <div className="reviews-grid">
                    <div className="review-card">
                        <div className="user-info">
                            <div className="avatar">A</div>
                            <div className="details">
                                <h4>Anjali S.</h4>
                                <div className="stars">★★★★★</div>
                            </div>
                        </div>
                        <p className="comment">"The consultation was spot on! Guru Dev helped me understand my career path clearly."</p>
                    </div>

                    <div className="review-card">
                        <div className="user-info">
                            <div className="avatar">R</div>
                            <div className="details">
                                <h4>Rahul K.</h4>
                                <div className="stars">★★★★☆</div>
                            </div>
                        </div>
                        <p className="comment">"Very intuitive reading. The UI is easy to use and connecting was seamless."</p>
                    </div>

                    <div className="review-card">
                        <div className="user-info">
                            <div className="avatar">P</div>
                            <div className="details">
                                <h4>Priya M.</h4>
                                <div className="stars">★★★★★</div>
                            </div>
                        </div>
                        <p className="comment">"I love the daily horoscope feature. It's my go-to app for starting the day!"</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
