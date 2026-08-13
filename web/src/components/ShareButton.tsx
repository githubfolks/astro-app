import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2, MessageCircle, Check, Loader2 } from 'lucide-react';

interface ShareButtonProps {
    title: string;
    text: string;
    url?: string;
    /** Optional element reference to snapshot as an image for native file sharing */
    targetRef?: React.RefObject<HTMLElement | null>;
    className?: string;
    buttonText?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
    title,
    text,
    url = 'https://aadikarta.org',
    targetRef,
    className = '',
    buttonText = 'Share Result',
}) => {
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = `${url}?utm_source=user_share&utm_medium=social&utm_campaign=viral_match`;
    const fullShareText = `${text}\n\n👉 Calculate yours free on Aadikarta: ${shareUrl}`;

    const handleWhatsAppShare = async () => {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
    };

    const handleNativeShare = async () => {
        if (sharing) return;
        setSharing(true);

        try {
            // Check if native navigator.share with files is supported
            if (targetRef?.current && navigator.canShare && typeof ClipboardItem !== 'undefined') {
                try {
                    const canvas = await html2canvas(targetRef.current, { backgroundColor: '#ffffff', scale: 2 });
                    const blob = await new Promise<Blob | null>((resolve) =>
                        canvas.toBlob((b) => resolve(b), 'image/png')
                    );

                    if (blob) {
                        const file = new File([blob], 'aadikarta-kundli-match.png', { type: 'image/png' });
                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title,
                                text: fullShareText,
                                files: [file],
                            });
                            setSharing(false);
                            return;
                        }
                    }
                } catch {
                    // Fall back to standard native text share if canvas file share fails
                }
            }

            if (navigator.share) {
                await navigator.share({
                    title,
                    text: fullShareText,
                    url: shareUrl,
                });
            } else {
                // Fallback to copying to clipboard
                await navigator.clipboard.writeText(fullShareText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            // Ignore user cancellation errors
        } finally {
            setSharing(false);
        }
    };

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            {/* Direct WhatsApp Share Button */}
            <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs md:text-sm px-3.5 py-1.5 rounded-full transition-all shadow-sm hover:shadow active:scale-95"
                title="Share on WhatsApp"
            >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>WhatsApp</span>
            </button>

            {/* General Native Share / Copy Button */}
            <button
                onClick={handleNativeShare}
                disabled={sharing}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs md:text-sm px-3.5 py-1.5 rounded-full border border-white/20 transition-all active:scale-95 disabled:opacity-60"
            >
                {sharing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                    <Share2 className="w-4 h-4 text-amber-400" />
                )}
                <span>{copied ? 'Link Copied!' : buttonText}</span>
            </button>
        </div>
    );
};

export default ShareButton;
