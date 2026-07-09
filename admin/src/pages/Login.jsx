import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [savePassword, setSavePassword] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('saved_username');
        const savedPass = localStorage.getItem('saved_password');
        if (savedUser && savedPass) {
            setUsername(savedUser);
            setPassword(savedPass);
            setSavePassword(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);

            if (savePassword) {
                localStorage.setItem('saved_username', username);
                localStorage.setItem('saved_password', password);
            } else {
                localStorage.removeItem('saved_username');
                localStorage.removeItem('saved_password');
            }

            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to login');
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-bold text-gray-900">Admin Sign in</CardTitle>
                    <p className="text-sm text-gray-500">
                        Enter your credentials to access the dashboard
                    </p>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email Address / Phone"
                            id="username"
                            name="username"
                            autoComplete="email"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={savePassword}
                                onChange={(e) => setSavePassword(e.target.checked)}
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                                Save password
                            </label>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                        >
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
