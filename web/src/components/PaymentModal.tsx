import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Wallet, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (amount: number) => void;
}

type PaymentMethod = 'card' | 'upi' | 'paytm';

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState<number>(100);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const presetAmounts = [100, 200, 500, 1000, 2000];

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (amount <= 0) return;
        setProcessing(true);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        setProcessing(false);
        setSuccess(true);

        // After showing success, close and notify parent
        setTimeout(() => {
            onSuccess(amount);
            setSuccess(false);
            setAmount(100);
        }, 1500);
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-500" size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-600">₹{amount} added to your wallet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Add Money</h2>
                            <p className="text-white/80 text-sm">Recharge your wallet</p>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Amount Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Select Amount</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {presetAmounts.map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => setAmount(preset)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${amount === preset
                                            ? 'bg-[#E91E63] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    ₹{preset}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-lg font-bold focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                        <div className="space-y-2">
                            <button
                                onClick={() => setPaymentMethod('upi')}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'upi' ? 'border-[#E91E63] bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <Smartphone className="text-green-600" size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-900">UPI</div>
                                    <div className="text-xs text-gray-500">Google Pay, PhonePe, BHIM, etc.</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-[#E91E63] bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <CreditCard className="text-blue-600" size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-900">Credit / Debit Card</div>
                                    <div className="text-xs text-gray-500">Visa, Mastercard, RuPay</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('paytm')}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'paytm' ? 'border-[#E91E63] bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Wallet className="text-blue-600" size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-900">Paytm Wallet</div>
                                    <div className="text-xs text-gray-500">Pay using Paytm balance</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={handlePayment}
                        disabled={amount <= 0 || processing}
                        className="w-full py-4 rounded-xl font-bold text-white bg-[#E91E63] hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                    >
                        {processing ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                                Processing...
                            </>
                        ) : (
                            <>Pay ₹{amount}</>
                        )}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">
                        Secure payment powered by Razorpay
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
