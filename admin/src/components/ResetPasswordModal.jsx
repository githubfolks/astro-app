import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import api from '../services/api';

export const ResetPasswordModal = ({ isOpen, onClose, userId, userEmail }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.put(`/admin/users/${userId}/reset-password`, { new_password: password });
            alert('Password reset successfully and notification email sent.');
            setPassword('');
            onClose();
        } catch (error) {
            console.error('Reset failed', error);
            setError(error.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    Enter a new password for <strong>{userEmail || `User #${userId}`}</strong>. 
                    An automated email will be sent after the reset.
                </p>
                
                {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="New Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        disabled={loading}
                        required
                        autoFocus
                    />
                    
                    <div className="flex gap-3 pt-2">
                        <Button 
                            variant="outlined" 
                            type="button" 
                            onClick={onClose} 
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
