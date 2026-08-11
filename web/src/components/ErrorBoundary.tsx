import React from 'react';
import { reportReactCrash } from '../errorReporting';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        reportReactCrash(error.message, error.stack || info.componentStack || undefined);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '100vh', padding: '24px', textAlign: 'center', gap: '16px',
                }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Something went wrong</h1>
                    <p style={{ color: '#666', maxWidth: '360px' }}>
                        The app hit an unexpected error. Try reloading — if it keeps happening, please let us know.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 24px', borderRadius: '8px', border: 'none',
                            background: '#d97706', color: '#fff', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
