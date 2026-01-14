import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchPost(slug);
        }
    }, [slug]);

    const fetchPost = async (postSlug: string) => {
        setLoading(true);
        try {
            const data = await api.cms.getPostBySlug(postSlug);
            setPost(data);
            document.title = data.title; // Basic SEO update
        } catch (err) {
            console.error('Failed to fetch post', err);
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

    if (error || !post) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 container mx-auto px-4 py-12 text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Post not found</p>
                    <Link to="/blog" className="text-indigo-600 hover:text-indigo-800 font-medium">Return to Blog</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
                <Link to="/blog" className="inline-flex items-center text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Blog
                </Link>

                <article>
                    <header className="mb-10 text-center">
                        <div className="text-sm text-indigo-600 font-semibold uppercase tracking-wide mb-2">
                            {new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

                        {post.featured_image && (
                            <div className="mt-8 rounded-2xl overflow-hidden shadow-lg">
                                <img src={post.featured_image} alt={post.title} className="w-full h-auto max-h-[500px] object-cover" />
                            </div>
                        )}
                    </header>

                    <div
                        className="prose prose-lg prose-indigo mx-auto text-gray-700"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPost;
