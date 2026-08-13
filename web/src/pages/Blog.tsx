import type { BlogPost } from '../types';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';

import SEO from '../components/SEO';

const Blog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Blog",
                "@id": "https://aadikarta.org/blog#blog",
                "name": "Aadikarta Vedic Astrology Blog",
                "description": "Discover the ancient wisdom of Vedic astrology, horoscopes, and planetary insights on Aadikarta Vedic Astrology.",
                "url": "https://aadikarta.org/blog",
                "publisher": {
                    "@type": "Organization",
                    "@id": "https://aadikarta.org/#organization",
                    "name": "Aadikarta Vedic Astrology",
                    "logo": "https://aadikarta.org/assets/logo.png"
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://aadikarta.org" },
                    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://aadikarta.org/blog" },
                ]
            }
        ]
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await api.cms.getPosts();
            setPosts(response.posts);
        } catch (error) {
            console.error('Failed to fetch blog posts', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradient = (id: number) => {
        const gradients = [
            'from-purple-500 to-indigo-600',
            'from-blue-500 to-cyan-500',
            'from-rose-500 to-orange-500',
            'from-emerald-500 to-teal-600',
            'from-violet-600 to-fuchsia-600',
            'from-amber-500 to-pink-500'
        ];
        return gradients[id % gradients.length];
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <SEO
                title="Vedic Astrology Blog & Guides | Aadikarta"
                description="Read expert articles on Vedic astrology, horoscopes, kundli, tarot & spiritual guidance on Aadikarta Vedic Astrology."
                keywords="Aadikarta Vedic Astrology blog, Vedic astrology articles, daily horoscope blog, astrology tips Aadikarta"
                structuredData={structuredData}
            />
            <Header />
            <main className="flex-1 container mx-auto px-4 py-6 md:py-12">
                <div className="text-center mb-6 md:mb-12">
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 mt-4">Vedic Astrology Blog</h1>
                    <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
                        Expert guidance on Vedic astrology, horoscopes, kundli matching & spiritual wisdom.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10 md:py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 md:py-20 text-gray-900">
                        No articles found. Check back soon!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {post.featured_image ? (
                                    <img
                                        src={post.featured_image}
                                        alt={post.title}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-48 bg-gradient-to-br ${getGradient(post.id)} flex items-center justify-center`}>
                                        <div className="text-center text-white p-4">
                                            <span className="text-4xl block mb-2 opacity-80">✨</span>
                                            {/* Optional: Show first letter of title? */}
                                        </div>
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="text-sm text-indigo-600 font-medium mb-2">
                                        {new Date(post.published_at).toLocaleDateString()}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                                        {/* Strip HTML tags for preview */}
                                        {post.content.replace(/<[^>]*>?/gm, '')}
                                    </p>
                                    <Link
                                        to={`/blog/${post.slug}`}
                                        className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700"
                                        aria-label={`Read article: ${post.title}`}
                                    >
                                        Read Article
                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Blog;
