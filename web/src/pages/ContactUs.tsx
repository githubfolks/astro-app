import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ContactUs: React.FC = () => {
    return (
        <div className="contact-page">
            <Header />
            <div className="container" style={{ padding: '60px 20px', minHeight: '60vh', textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#1A1A1A' }}>Contact Us</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto 40px', color: '#666' }}>
                    Have questions? We'd love to hear from you. Reach out to our support team.
                </p>
                <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', maxWidth: '500px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <p><strong>Email:</strong> support@aadikarta.org</p>
                    <p style={{ marginTop: '10px' }}><strong>Phone:</strong> +91 98765 43210</p>
                    <p style={{ marginTop: '10px' }}><strong>Address:</strong> 123 Cosmic Tower, Startown, India</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ContactUs;
