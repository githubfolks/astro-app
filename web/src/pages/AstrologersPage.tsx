import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AstrologerList from '../components/AstrologerList';

const AstrologersPage: React.FC = () => {
    return (
        <div className="astrologers-page">
            <Header />
            <div className="page-content" style={{ marginTop: '20px', minHeight: '60vh' }}>
                <AstrologerList />
            </div>
            <Footer />
        </div>
    );
};

export default AstrologersPage;
