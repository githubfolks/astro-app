// CMS-authored post content can contain an <h1> (duplicating the page's own
// title heading) or empty heading tags left over from editing — both muddy
// the heading outline crawlers/answer-engines use to read the article
// structure. Run on already-sanitized HTML, after DOMPurify.

const KEYWORD_LINK_MAP: Array<{ keyword: string; url: string }> = [
    { keyword: 'planetary transits', url: '/services/vedic-astrology' },
    { keyword: 'planetary transit', url: '/services/vedic-astrology' },
    { keyword: 'Gochar', url: '/services/vedic-astrology' },
    { keyword: 'Kundli matching', url: '/tools/kundli-matching' },
    { keyword: 'Kundli match', url: '/tools/kundli-matching' },
    { keyword: 'Kundli chart', url: '/tools/kundli-chart' },
    { keyword: 'Janam Kundli', url: '/tools/kundli-chart' },
    { keyword: 'Kundli', url: '/tools/kundli-chart' },
    { keyword: 'birth chart', url: '/tools/kundli-chart' },
    { keyword: 'astrologer', url: '/astrologers' },
    { keyword: 'astrologers', url: '/astrologers' },
    { keyword: 'Manglik Dosha', url: '/tools/manglik-dosha-checker' },
    { keyword: 'Manglik', url: '/tools/manglik-dosha-checker' },
    { keyword: 'AI Astrologer', url: '/ai-astrologer' }
];

function injectInternalKeywordLinks(container: HTMLElement): void {
    const paragraphs = Array.from(container.querySelectorAll('p'));
    const linkedKeywords = new Set<string>();

    for (const p of paragraphs) {
        // Skip if paragraph is inside an anchor or inside a CTA banner
        if (p.closest('a') || p.closest('.mid-article-cta')) continue;

        // Collect all text nodes inside p that are not inside an <a> tag
        const textNodes: Text[] = [];
        const walkNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.parentNode?.nodeName !== 'A') {
                textNodes.push(node as Text);
            } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'A') {
                node.childNodes.forEach(walkNode);
            }
        };
        walkNode(p);

        for (const { keyword, url } of KEYWORD_LINK_MAP) {
            const keyLower = keyword.toLowerCase();
            if (linkedKeywords.has(keyLower)) continue;

            const regex = new RegExp(`\\b(${keyword})\\b`, 'i');
            for (const textNode of textNodes) {
                const text = textNode.nodeValue || '';
                const match = regex.exec(text);
                if (match) {
                    const matchIdx = match.index;
                    const matchText = match[0];
                    const beforeText = text.substring(0, matchIdx);
                    const afterText = text.substring(matchIdx + matchText.length);

                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.textContent = matchText;
                    anchor.className = 'text-indigo-600 font-semibold underline hover:text-indigo-800';

                    const parent = textNode.parentNode;
                    if (parent) {
                        if (beforeText) {
                            parent.insertBefore(document.createTextNode(beforeText), textNode);
                        }
                        parent.insertBefore(anchor, textNode);
                        if (afterText) {
                            parent.insertBefore(document.createTextNode(afterText), textNode);
                        }
                        parent.removeChild(textNode);
                    }
                    linkedKeywords.add(keyLower);
                    break;
                }
            }
        }
    }
}

function injectMidArticleCTA(container: HTMLElement): void {
    const headings = container.querySelectorAll('h2');
    if (headings.length >= 2) {
        const targetH2 = headings[1];
        if (container.querySelector('.mid-article-cta')) return;

        const midCta = document.createElement('div');
        midCta.className = 'mid-article-cta my-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-950 text-white shadow-xl border border-indigo-700/50';
        midCta.innerHTML = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <span class="inline-block px-2.5 py-0.5 bg-amber-400 text-gray-950 font-bold text-[10px] uppercase tracking-wider rounded-full mb-1.5">Personalized Jyotish Guidance</span>
                    <h4 class="text-lg font-bold text-white mb-1">Want to know how planetary transits affect your birth chart?</h4>
                    <p class="text-indigo-200 text-xs max-w-md">Consult top verified Vedic astrologers or ask our 24/7 AI Astrologer instantly.</p>
                </div>
                <div class="flex flex-wrap items-center gap-2.5 shrink-0">
                    <a href="/astrologers" class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-xs text-center shadow transition-all">Talk to Astrologers &rarr;</a>
                    <a href="/ai-astrologer" class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs text-center border border-white/20 transition-all">Ask AI 🤖</a>
                </div>
            </div>
        `;
        targetH2.parentNode?.insertBefore(midCta, targetH2.nextSibling);
    }
}

export function normalizeArticleHtml(html: string): string {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el) => {
        if (!el.textContent?.trim()) {
            el.remove();
            return;
        }
        if (el.tagName === 'H1') {
            const h2 = document.createElement('h2');
            h2.innerHTML = el.innerHTML;
            el.replaceWith(h2);
        }
    });
    // Normalize dev/staging URLs to production domain for SEO link equity
    container.querySelectorAll('a').forEach((link) => {
        let href = link.getAttribute('href') || '';
        if (href.includes('dev.aadikarta.org')) {
            href = href.replace('dev.aadikarta.org', 'aadikarta.org');
            link.setAttribute('href', href);
        }
        if (href.startsWith('https://aadikarta.org') || href.startsWith('/')) {
            link.classList.add('text-indigo-600', 'font-semibold', 'underline', 'hover:text-indigo-800');
        } else if (href.startsWith('http')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer nofollow');
            link.classList.add('text-indigo-600', 'hover:underline');
        }
    });

    // In-article images (unlike the featured image above the fold) are below
    // the fold by definition, so let's defer fetching them until
    // they're near the viewport.
    container.querySelectorAll('img').forEach((img) => {
        img.loading = 'lazy';
        img.decoding = 'async';
    });

    // Auto-link high-value keywords for SEO internal link architecture
    injectInternalKeywordLinks(container);

    // Inject contextual engagement CTA after the 2nd H2 heading
    injectMidArticleCTA(container);

    return container.innerHTML;
}
