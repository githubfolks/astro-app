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
                "keywords": [
                    p.title,
                    ...(p.tags || []),
                    ...(p.secondary_keywords || []),
                    ...(p.longtail_keywords || [])
                ].filter(Boolean).join(', '),
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

    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

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
            
            // Fetch related posts for internal backlink grid
            try {
                const res = await api.cms.getPosts(0, 5);
                const filtered = (res.posts || []).filter((p: BlogPost) => p.slug !== postSlug).slice(0, 3);
                setRelatedPosts(filtered);
            } catch (relErr) {
                console.warn('Could not load related posts', relErr);
            }
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
                <div className="flex-1 container mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
                    <p className="text-gray-600 mb-6">The blog article you are looking for does not exist or has been removed.</p>
                    <Link to="/blog" className="inline-flex items-center text-indigo-600 font-semibold hover:underline">
                        ← Back to Blog
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    // Calculate concise SERP title to ensure <= 55-60 chars in Google search results
    let seoTitle = post.title;
    if (seoTitle.includes(':')) {
        seoTitle = seoTitle.split(':')[0].trim();
    }
    if (seoTitle.length > 45) {
        seoTitle = seoTitle.slice(0, 42).trim() + '...';
    }

    const derivedKeywords = [
        post.title,
        ...(post.tags || []),
        ...(post.secondary_keywords || []),
        ...(post.longtail_keywords || []),
        ...(post.slug ? [post.slug.replace(/-/g, ' ')] : []),
        "Aadikarta Vedic Astrology",
        "Kundli",
        "Horoscope & Jyotish Guidance"
    ].filter(Boolean).join(', ');

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title={seoTitle}
                description={(post.excerpt || post.content.replace(/<[^>]*>/gm, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()).substring(0, 155)}
                keywords={derivedKeywords}
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
                            <ShareButtons url={`${BASE_URL}/blog/${post.slug || slug}`} title={post.title} />
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

                    {/* Contextual Internal Backlink Callout Card */}
                    <div className="my-10 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-950 text-white shadow-xl">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <span className="inline-block px-3 py-1 bg-amber-400 text-gray-950 font-bold text-xs uppercase tracking-wider rounded-full mb-2">
                                    Aadikarta Astrology Hub
                                </span>
                                <h3 className="text-xl font-bold text-white mb-2">Want Personal Answers for Your Birth Chart?</h3>
                                <p className="text-indigo-200 text-sm max-w-xl">
                                    Calculate your 36-Guna Kundli Match, get 24/7 instant AI insights, or consult verified Vedic experts starting at ₹10/min.
                                </p>
                            </div>
                            <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
                                <Link
                                    to="/astrologers"
                                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-sm text-center shadow transition-all transform hover:scale-105"
                                >
                                    Talk to Astrologers →
                                </Link>
                                <Link
                                    to="/tools/kundli-matching"
                                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm text-center border border-white/20 transition-all"
                                >
                                    Free Kundli Match
                                </Link>
                                <Link
                                    to="/ai-astrologer"
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm text-center transition-all"
                                >
                                    Ask AI Astrologer 🤖
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Topic Tags, Secondary & Long-tail Keywords Backlink Section */}
                    {((post.tags && post.tags.length > 0) || (post.secondary_keywords && post.secondary_keywords.length > 0) || (post.longtail_keywords && post.longtail_keywords.length > 0)) && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Tags & Focus Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {post.tags?.map((tag, idx) => (
                                    <Link
                                        key={`tag-${idx}`}
                                        to={`/blog?search=${encodeURIComponent(tag)}`}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 transition-colors"
                                    >
                                        # {tag}
                                    </Link>
                                ))}
                                {post.secondary_keywords?.map((kw, idx) => (
                                    <Link
                                        key={`sec-${idx}`}
                                        to={`/blog?search=${encodeURIComponent(kw)}`}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
                                    >
                                        {kw}
                                    </Link>
                                ))}
                                {post.longtail_keywords?.map((kw, idx) => (
                                    <Link
                                        key={`lt-${idx}`}
                                        to={`/blog?search=${encodeURIComponent(kw)}`}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-normal bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
                                    >
                                        🔍 {kw}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {post.faqs && post.faqs.length > 0 && (
                        <div className="mt-12 rounded-3xl bg-gradient-to-b from-[#130c2c] to-[#04010a] overflow-hidden">
                            <FAQSection faqs={post.faqs} />
                        </div>
                    )}

                    {/* Related Articles Internal Backlinks Grid */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Related Astrology Articles</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {relatedPosts.map((relPost) => (
                                    <Link
                                        key={relPost.id}
                                        to={`/blog/${relPost.slug}`}
                                        className="group block bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            {relPost.featured_image && (
                                                <img
                                                    src={relPost.featured_image}
                                                    alt={relPost.title}
                                                    className="w-full h-32 object-cover rounded-xl mb-3"
                                                />
                                            )}
                                            <h3 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                                                {relPost.title}
                                            </h3>
                                        </div>
                                        <span className="text-xs text-indigo-600 font-semibold group-hover:underline mt-2 inline-flex items-center">
                                            Read Article →
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <aside className="mt-8 mb-8 md:mt-12 md:mb-16 pt-6 border-t border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Related Services & Tools</h2>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/tools/kundli-matching" className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium">Free Kundli Matching</Link>
                            <Link to="/tools/kundli-chart" className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium">Janam Kundli Generator</Link>
                            <Link to="/tools/manglik-dosha-checker" className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium">Manglik Checker</Link>
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
