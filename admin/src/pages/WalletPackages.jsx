import React, { useEffect, useState, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Plus, Trash2 } from 'lucide-react';
import { walletPackages } from '../services/api';

export default function WalletPackages() {
    const [packages, setPackages] = useState([]);
    const [newAmount, setNewAmount] = useState('');
    const [newBonus, setNewBonus] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    const fetchPackages = useCallback(async () => {
        try {
            const response = await walletPackages.list();
            setPackages(response.data);
        } catch (err) {
            console.error('Failed to fetch wallet packages', err);
        }
    }, []);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);
        const amount = Number(newAmount);
        const bonus = Number(newBonus);
        if (!amount || amount <= 0) {
            setError('Enter a valid recharge amount');
            return;
        }
        if (bonus < 0) {
            setError('Bonus cannot be negative');
            return;
        }
        setCreating(true);
        try {
            await walletPackages.create({ amount, bonus_amount: bonus });
            setNewAmount('');
            setNewBonus('');
            fetchPackages();
        } catch (err) {
            setError(err.message || 'Failed to create package');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleActive = async (pkg) => {
        try {
            await walletPackages.update(pkg.id, { is_active: !pkg.is_active });
            fetchPackages();
        } catch (err) {
            console.error('Failed to update package', err);
        }
    };

    const handleDeactivate = async (pkg) => {
        if (!window.confirm('Deactivate this package? It will stop showing in the recharge flow.')) return;
        try {
            await walletPackages.deactivate(pkg.id);
            fetchPackages();
        } catch (err) {
            console.error('Failed to deactivate package', err);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl text-gray-900">Wallet Recharge Packages</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Bonus tiers shown alongside the custom-amount recharge flow (e.g. "recharge ₹500, get ₹550 wallet credit").
                </p>
            </div>

            <Card className="p-4">
                <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
                    <Input
                        label="Recharge Amount (₹)"
                        type="number"
                        min="1"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-40"
                    />
                    <Input
                        label="Bonus Amount (₹)"
                        type="number"
                        min="0"
                        value={newBonus}
                        onChange={(e) => setNewBonus(e.target.value)}
                        placeholder="e.g. 50"
                        className="w-40"
                    />
                    <Button type="submit" disabled={creating}>
                        <Plus size={16} className="mr-2" /> Add Package
                    </Button>
                </form>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Recharge Amount</TableHead>
                            <TableHead>Bonus Amount</TableHead>
                            <TableHead>Wallet Credit</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {packages.map((pkg) => (
                            <TableRow key={pkg.id}>
                                <TableCell className="font-medium">₹{Number(pkg.amount).toFixed(0)}</TableCell>
                                <TableCell className="text-green-600">+₹{Number(pkg.bonus_amount).toFixed(0)}</TableCell>
                                <TableCell>₹{(Number(pkg.amount) + Number(pkg.bonus_amount)).toFixed(0)}</TableCell>
                                <TableCell>
                                    <Switch checked={pkg.is_active} onCheckedChange={() => handleToggleActive(pkg)} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeactivate(pkg)}>
                                        <Trash2 size={18} className="text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {packages.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-900">
                                    No wallet packages yet — add one above.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
