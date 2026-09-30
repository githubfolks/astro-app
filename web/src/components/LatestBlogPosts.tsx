import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BlogPostSummary } from '../types';
import { api } from '../services/api';

const POST_COUNT = 3;

// Homepage "Latest from the Blog" strip — gives the blog a crawlable link path
// from the homepage (it previously had none). Renders nothing on error or when
// there are no published posts rather than showing an empty/fake section.
const LatestBlogPosts: React.FC = () => {
    const [posts, setPosts] = useState<BlogPostSummary[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    useEffect(() => {
        let cancelled = false;
        api.cms.getPosts(0, POST_COUNT)
            .then((res) => {
                if (cancelled) return;
                setPosts(res.posts || []);
                setStatus('ready');
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Failed to fetch latest blog posts', error);
                setStatus('error');
            });
        return () => { cancelled = true; };
    }, []);

    if (status === 'error' || (status === 'ready' && posts.length === 0)) return null;

    return (
        <section className="latest-blog-section py-24 bg-gray-50" aria-labelledby="latest-blog-heading">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto mb-12 text-center">
                    <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Learn Jyotish</span>
                    <h2 id="latest-blog-heading" className="text-3xl md:text-4xl text-gray-900 mb-4">
                        Latest from the <span className="text-indigo-600">Blog</span>
                    </h2>
                    <p className="text-lg text-gray-600">Clear, myth-free guides on Vedic astrology, kundli and planetary timing.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {status === 'loading'
                        ? Array.from({ length: POST_COUNT }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse" aria-hidden="true">
                                <div className="w-full h-48 bg-gray-200" />
                                <div className="p-6 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded" />
                                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                                </div>
                            </div>
                        ))
                        : posts.map((post) => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                            >
                                {post.featured_image ? (
                                    <img
                                        src={post.featured_image}
                                        alt={post.title}
                                        width={400}
                                        height={192}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-indigo-600" aria-hidden="true" />
                                )}
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {post.title}
                                    </h3>
                                    {post.excerpt && (
                                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{post.excerpt}</p>
                                    )}
                                    <span className="mt-auto text-indigo-600 font-semibold">Read Article →</span>
                                </div>
                            </Link>
                        ))}
                </div>

                <div className="text-center mt-10">
                    <Link
                        to="/blog"
                        className="inline-flex items-center px-6 py-3 rounded-full border border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                        View all articles
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default LatestBlogPosts;
