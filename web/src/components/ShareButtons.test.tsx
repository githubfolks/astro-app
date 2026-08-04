import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButtons from './ShareButtons';

describe('ShareButtons', () => {
    // jsdom has no navigator.share, so this exercises the desktop fallback path.
    it('renders per-platform links and a working copy-link button', async () => {
        Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

        render(<ShareButtons url="https://aadikarta.org/blog/example" title="Example Post" />);

        expect(screen.getByLabelText('Share on WhatsApp')).toHaveAttribute(
            'href',
            expect.stringContaining('wa.me')
        );
        expect(screen.getByLabelText('Share on Facebook')).toHaveAttribute(
            'href',
            expect.stringContaining('facebook.com/sharer')
        );
        expect(screen.getByLabelText('Share on X')).toHaveAttribute(
            'href',
            expect.stringContaining('twitter.com/intent/tweet')
        );
        expect(screen.getByLabelText('Share on LinkedIn')).toHaveAttribute(
            'href',
            expect.stringContaining('linkedin.com/sharing')
        );

        fireEvent.click(screen.getByLabelText('Copy link'));
        await waitFor(() =>
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://aadikarta.org/blog/example')
        );
    });

    it('uses the native share sheet when available, instead of the icon row', () => {
        Object.assign(navigator, { share: vi.fn().mockResolvedValue(undefined) });

        render(<ShareButtons url="https://aadikarta.org/blog/example" title="Example Post" />);

        const shareButton = screen.getByLabelText('Share this article');
        fireEvent.click(shareButton);

        expect(navigator.share).toHaveBeenCalledWith({
            title: 'Example Post',
            url: 'https://aadikarta.org/blog/example',
        });
        expect(screen.queryByLabelText('Share on WhatsApp')).not.toBeInTheDocument();

        // @ts-expect-error cleanup for the next test in this file
        delete navigator.share;
    });
});
