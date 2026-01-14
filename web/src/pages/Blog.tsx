import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';

const Blog: React.FC = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">AstroApp Blog</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Discover the ancient wisdom of the stars and how they influence your daily life.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        No articles found. Check back soon!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
