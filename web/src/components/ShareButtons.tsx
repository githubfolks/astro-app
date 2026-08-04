import React, { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Copy, Check } from 'lucide-react';

interface ShareButtonsProps {
    url: string;
    title: string;
}

// On mobile, the OS-native share sheet (navigator.share) already lists every
// app the user has installed, so a bespoke platform-icon row would just
// duplicate it with a worse UX. Desktop browsers don't implement
// navigator.share, so they get the icon-row fallback instead.
const ShareButtons: React.FC<ShareButtonsProps> = ({ url, title }) => {
    const [copied, setCopied] = useState(false);

    const canUseNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

    const handleNativeShare = async () => {
        try {
            await navigator.share({ title, url });
        } catch {
            // User dismissed the share sheet — not an error worth surfacing.
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard access can be denied by browser permissions; the link
            // is still visible/selectable in the address bar as a fallback.
        }
    };

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const links = [
        { name: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
        { name: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
        { name: 'X', icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
        { name: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    ];

    if (canUseNativeShare) {
        return (
            <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium"
                aria-label="Share this article"
            >
                <Share2 className="w-4 h-4" />
                Share
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {links.map(({ name, icon: Icon, href }) => (
                <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Share on ${name}`}
                    className="p-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                    <Icon className="w-4 h-4" />
                </a>
            ))}
            <button
                onClick={handleCopy}
                aria-label="Copy link"
                className="p-2 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    );
};

export default ShareButtons;
