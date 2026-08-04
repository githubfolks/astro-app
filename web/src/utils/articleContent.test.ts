import { describe, it, expect } from 'vitest';
import { normalizeArticleHtml } from './articleContent';

describe('normalizeArticleHtml', () => {
    it('removes empty heading tags', () => {
        const out = normalizeArticleHtml('<p>Intro</p><h3></h3><p>More</p>');
        expect(out).not.toContain('<h3');
        expect(out).toContain('Intro');
        expect(out).toContain('More');
    });

    it('removes whitespace-only heading tags', () => {
        const out = normalizeArticleHtml('<h2>   </h2><p>Body</p>');
        expect(out).not.toContain('<h2');
    });

    it('demotes an embedded h1 to h2 instead of deleting it', () => {
        const out = normalizeArticleHtml('<h1>Duplicate Title</h1><p>Body</p>');
        expect(out).not.toContain('<h1');
        expect(out).toContain('<h2>Duplicate Title</h2>');
    });

    it('leaves normal h2/h3 content unchanged', () => {
        const html = '<h2>Section</h2><p>Text</p><h3>Sub</h3>';
        expect(normalizeArticleHtml(html)).toBe(html);
    });
});
