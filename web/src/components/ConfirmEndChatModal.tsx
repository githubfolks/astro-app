import React from 'react';
import { PhoneOff, X } from 'lucide-react';

interface ConfirmEndChatModalProps {
    isOpen: boolean;
    astrologerName?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmEndChatModal: React.FC<ConfirmEndChatModalProps> = ({
    isOpen,
    astrologerName,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold mb-1">End Chat?</h2>
                            <p className="text-white/80 text-sm">
                                {astrologerName ? `with ${astrologerName}` : 'This will end your current session'}
                            </p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                    <p className="text-gray-600">
                        Are you sure you want to end this chat? This action cannot be undone.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <PhoneOff size={18} />
                        End Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmEndChatModal;
