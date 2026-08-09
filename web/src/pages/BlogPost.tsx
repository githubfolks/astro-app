import type { BlogPost } from '../types';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';

import SEO from '../components/SEO';
import ShareButtons from '../components/ShareButtons';
import FAQSection from '../components/FAQSection';
import { normalizeArticleHtml } from '../utils/articleContent';

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://aadikarta.org';

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const getStructuredData = (p: BlogPost) => ({
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "@id": `https://aadikarta.org/blog/${p.slug || slug}#article`,
                "headline": p.title,
                "url": `https://aadikarta.org/blog/${p.slug || slug}`,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": `https://aadikarta.org/blog/${p.slug || slug}`
                },
                "image": p.featured_image || "https://aadikarta.org/assets/blog-default.jpg",
                "datePublished": p.published_at,
                "dateModified": p.updated_at || p.published_at,
                "author": p.author_name
                    ? {
                        "@type": "Person",
                        "name": p.author_name,
                        "jobTitle": "Certified Astrologer & Columnist",
                        "worksFor": { "@id": "https://aadikarta.org/#organization" }
                    }
                    : { "@type": "Organization", "name": "Aadikarta Vedic Astrology", "@id": "https://aadikarta.org/#organization" },
                "publisher": {
                    "@type": "Organization",
                    "name": "Aadikarta Vedic Astrology",
                    "@id": "https://aadikarta.org/#organization",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://aadikarta.org/assets/logo.png"
                    }
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://aadikarta.org" },
                    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://aadikarta.org/blog" },
                    { "@type": "ListItem", "position": 3, "name": p.title, "item": `https://aadikarta.org/blog/${p.slug || slug}` },
                ]
            },
            ...(p.faqs?.length
                ? [{
                    "@type": "FAQPage",
                    "mainEntity": p.faqs.map((faq) => ({
                        "@type": "Question",
                        "name": faq.question,
                        "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
                    }))
                }]
                : [])
        ]
    });

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
                <div className="flex-1 container mx-auto px-4 py-6 md:py-12 text-center">
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">Post Not Found</h1>
                    <p className="text-gray-600 mb-8">The article you're looking for might have been moved or deleted.</p>
                    <Link to="/blog" className="text-indigo-600 hover:text-indigo-800 font-medium" aria-label="Return to blog list">Return to Blog</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title={post.title}
                description={(post.excerpt || post.content.replace(/<[^>]*>/gm, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()).substring(0, 155)}
                image={post.featured_image}
                imageAlt={post.title}
                type="article"
                publishedTime={post.published_at}
                modifiedTime={post.updated_at || post.published_at}
                structuredData={getStructuredData(post)}
            />
            <Header />
            <main className="flex-1 container mx-auto px-4 py-6 md:py-12 max-w-4xl">
                <Link to="/blog" className="inline-flex items-center text-gray-900 hover:text-indigo-600 mb-4 mt-4 md:mb-8 md:mt-8 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Blog
                </Link>

                <article>
                    <header className="mb-5 md:mb-10 text-center">
                        <div className="text-sm text-indigo-600 font-semibold uppercase tracking-wide mb-2 flex items-center justify-center">
                            <span>{new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            {post.author_name && (
                                <span className="ml-3 pl-3 border-l border-indigo-200 text-gray-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    By {post.author_name}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

                        <div className="flex justify-center">
                            <ShareButtons url={`${BASE_URL}/blog/${post.slug}`} title={post.title} />
                        </div>

                        {post.featured_image && (
                            <div className="mt-8 rounded-2xl overflow-hidden shadow-lg">
                                <img src={post.featured_image} alt={post.title} className="w-full h-auto max-h-[500px] object-cover" fetchPriority="high" />
                            </div>
                        )}
                    </header>

                    <div
                        className="post-content prose prose-indigo max-w-none"
                        dangerouslySetInnerHTML={{ __html: normalizeArticleHtml(DOMPurify.sanitize(post.content)) }}
                    />

                    {post.faqs && post.faqs.length > 0 && (
                        <div className="mt-12 rounded-3xl bg-gradient-to-b from-[#130c2c] to-[#04010a] overflow-hidden">
                            <FAQSection faqs={post.faqs} />
                        </div>
                    )}

                    <aside className="mt-8 mb-8 md:mt-12 md:mb-16 pt-4 md:pt-8 border-t border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Related Services</h2>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/services/kundli-matching" className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium">Kundli Matching</Link>
                            <Link to="/services/love-advice" className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium">Love Advice</Link>
                            <Link to="/services/tarot-reading" className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium">Tarot Reading</Link>
                            <Link to="/services/vastu-shastra" className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium">Vastu Shastra</Link>
                        </div>
                    </aside>
                </article>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPost;
