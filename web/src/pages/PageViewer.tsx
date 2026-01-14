import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';

const PageViewer: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchPage(slug);
        }
    }, [slug]);

    const fetchPage = async (pageSlug: string) => {
        setLoading(true);
        setError(false);
        try {
            const data = await api.cms.getPageBySlug(pageSlug);
            setPage(data);

            // Update document metadata for SEO
            document.title = data.seo_title || data.title || 'AstroApp';
            if (data.seo_description) {
                let metaDescription = document.querySelector('meta[name="description"]');
                if (!metaDescription) {
                    metaDescription = document.createElement('meta');
                    metaDescription.setAttribute('name', 'description');
                    document.head.appendChild(metaDescription);
                }
                metaDescription.setAttribute('content', data.seo_description);
            }
        } catch (err) {
            console.error('Failed to load page', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 container mx-auto px-4 py-12 text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4 mt-4">404</h1>
                    <p className="text-gray-600 mb-8">Page not found</p>
                    <a href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">Return Home</a>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{page.title}</h1>
                <div
                    className="prose prose-lg max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </main>
            <Footer />
        </div>
    );
};

export default PageViewer;
