import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import api from '../services/api';
import { getPasswordError, PASSWORD_REQUIREMENTS } from '../utils/password';

export const ResetPasswordModal = ({ isOpen, onClose, userId, userEmail }) => {
    const [password, setPassword] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClose = () => {
        setPassword('');
        setGeneratedPassword('');
        setError('');
        onClose();
    };

    const generatePassword = () => {
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const special = "!@#$%^&*()_+~}{[]:;?><,./-=";
        const all = uppercase + lowercase + numbers + special;
        
        let generated = "";
        // Ensure at least one of each character type
        generated += uppercase[Math.floor(Math.random() * uppercase.length)];
        generated += lowercase[Math.floor(Math.random() * lowercase.length)];
        generated += numbers[Math.floor(Math.random() * numbers.length)];
        generated += special[Math.floor(Math.random() * special.length)];
        
        // Add random characters up to length 12
        for (let i = 0; i < 8; i++) {
            generated += all[Math.floor(Math.random() * all.length)];
        }
        
        // Shuffle the string
        generated = generated.split('').sort(() => 0.5 - Math.random()).join('');
        
        setPassword(generated);
        setGeneratedPassword(generated);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const passwordError = getPasswordError(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.put(`/admin/users/${userId}/reset-password`, { new_password: password });
            alert('Password reset successfully and notification email sent.');
            handleClose();
        } catch (error) {
            console.error('Reset failed', error);
            setError(error.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password">
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
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setGeneratedPassword('');
                        }}
                        placeholder="Min 8 characters"
                        disabled={loading}
                        required
                        autoFocus
                        fullWidth
                    />
                    
                    <div className="flex justify-between items-start gap-4 -mt-2">
                        <p className="text-xs text-gray-500 max-w-[70%]">{PASSWORD_REQUIREMENTS}</p>
                        <button
                            type="button"
                            onClick={generatePassword}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer shrink-0"
                        >
                            Suggest Password
                        </button>
                    </div>

                    {generatedPassword && (
                        <div className="p-3 text-sm bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between animate-fadeIn">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-indigo-500 block tracking-wider mb-0.5">Suggested Password</span>
                                <code className="font-mono font-bold text-indigo-900 text-base selection:bg-indigo-200">{generatedPassword}</code>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedPassword);
                                }}
                                className="text-xs bg-white text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-md font-bold border border-indigo-200 shadow-sm active:scale-95 transition-transform"
                            >
                                Copy
                            </button>
                        </div>
                    )}
                    
                    <div className="flex gap-3 pt-2">
                        <Button 
                            variant="outlined" 
                            type="button" 
                            onClick={handleClose} 
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
