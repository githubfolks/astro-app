// CMS-authored post content can contain an <h1> (duplicating the page's own
// title heading) or empty heading tags left over from editing — both muddy
// the heading outline crawlers/answer-engines use to read the article
// structure. Run on already-sanitized HTML, after DOMPurify.
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
    // the fold by definition, so let the browser defer fetching them until
    // they're near the viewport instead of racing the visible content for
    // bandwidth on page load.
    container.querySelectorAll('img').forEach((img) => {
        img.loading = 'lazy';
        img.decoding = 'async';
    });
    return container.innerHTML;
}
