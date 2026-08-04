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
    return container.innerHTML;
}
