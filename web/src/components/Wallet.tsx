import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Wallet as WalletIcon, PlusCircle } from 'lucide-react';

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
        if (!amount || isNaN(Number(amount))) return;
        try {
            setIsRecharging(true);
            await api.wallet.addMoney(Number(amount));
            setAmount('');
            await fetchBalance();
            alert('Recharge Successful!');
        } catch (e) {
            alert('Recharge Failed');
        } finally {
            setIsRecharging(false);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 text-white border border-gray-700">
            <div className="flex items-center gap-2">
                <WalletIcon className="text-purple-400" />
                <span className="font-bold text-xl">₹{balance}</span>
            </div>

            <div className="flex gap-2">
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Amt"
                    className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-sm focus:border-purple-500 outline-none"
                />
                <button
                    onClick={handleRecharge}
                    disabled={isRecharging}
                    className="bg-green-600 hover:bg-green-700 p-1 px-3 rounded text-sm font-bold flex items-center gap-1"
                >
                    <PlusCircle size={16} /> Add
                </button>
            </div>
        </div>
    );
};
