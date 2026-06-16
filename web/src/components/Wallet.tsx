import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Wallet as WalletIcon, PlusCircle } from 'lucide-react';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export const Wallet: React.FC = () => {
    const [balance, setBalance] = useState<number>(0);
    const [isRecharging, setIsRecharging] = useState(false);
    const [amount, setAmount] = useState('');

    const fetchBalance = async () => {
        try {
            const data = await api.wallet.getBalance();
            setBalance(Number(data.balance));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchBalance();
        const interval = setInterval(fetchBalance, 10000); // Polling for updates
        return () => clearInterval(interval);
    }, []);

    const handleRecharge = async () => {
        const amt = Number(amount);
        if (!amount || isNaN(amt) || amt <= 0) {
            alert("Please enter a valid positive amount");
            return;
        }

        try {
            setIsRecharging(true);

            // 1. Create Order
            const orderData = await api.payment.createOrder(amt);

            // Mock Mode Handling
            if (orderData.key_id === "mock_key" || !orderData.key_id) {
                const confirmMock = confirm(`[DEV MODE] Simulate successful payment of ₹${orderData.amount / 100}?`);
                if (confirmMock) {
                    await api.payment.verifyPayment({
                        razorpay_order_id: orderData.order_id,
                        razorpay_payment_id: "pay_mock_" + Date.now(),
                        razorpay_signature: "mock_signature"
                    });
                    alert("Mock Payment Successful!");
                    setAmount('');
                    fetchBalance();
                }
                setIsRecharging(false);
                return;
            }

            // 2. Open Razorpay
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "AstroApp",
                description: "Wallet Recharge",
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    try {
                        await api.payment.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert("Payment Successful!");
                        setAmount('');
                        fetchBalance();
                    } catch (err) {
                        console.error(err);
                        alert("Payment Verification Failed");
                    }
                },
                prefill: {
                    name: "Astro User", // Ideally fetched from user profile
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#E91E63"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert("Payment Failed: " + response.error.description);
            });
            rzp.open();

        } catch (e: any) {
            console.error(e);
            alert('Failed to initiate payment: ' + (e.message || "Unknown error"));
        } finally {
            setIsRecharging(false);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 text-white border border-gray-700">
            <div className="flex items-center gap-2">
                <WalletIcon className="text-purple-400" />
                <span className="font-bold text-xl">₹{balance.toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Amt"
                    min="1"
                    className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-sm focus:border-purple-500 outline-none"
                />
                <button
                    onClick={handleRecharge}
                    disabled={isRecharging}
                    className="bg-green-600 hover:bg-green-700 p-1 px-3 rounded text-sm font-bold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PlusCircle size={16} /> {isRecharging ? '...' : 'Add'}
                </button>
            </div>
        </div>
    );
};
