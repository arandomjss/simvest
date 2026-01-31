import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUpstoxStore } from '../stores/upstoxStore';

export const UpstoxCallbackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { handleCallback } = useUpstoxStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Connecting to Upstox...');
    const hasProcessed = useRef(false); // Prevent duplicate requests

    useEffect(() => {
        // Prevent duplicate execution
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const processCallback = async () => {
            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                const error = searchParams.get('error');

                // Check for errors
                if (error) {
                    setStatus('error');
                    setMessage(`Authentication failed: ${error}`);
                    setTimeout(() => navigate('/dashboard'), 3000);
                    return;
                }

                // Validate code
                if (!code) {
                    setStatus('error');
                    setMessage('No authorization code received');
                    setTimeout(() => navigate('/dashboard'), 3000);
                    return;
                }

                // Verify state (CSRF protection)
                const savedState = localStorage.getItem('upstox_state');
                if (state !== savedState) {
                    setStatus('error');
                    setMessage('Invalid state parameter');
                    setTimeout(() => navigate('/dashboard'), 3000);
                    return;
                }

                // Exchange code for token (only once!)
                await handleCallback(code);

                setStatus('success');
                setMessage('Successfully connected to Upstox!');

                // Redirect to dashboard after 2 seconds
                setTimeout(() => navigate('/dashboard'), 2000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Failed to connect to Upstox');
                setTimeout(() => navigate('/dashboard'), 3000);
            }
        };

        processCallback();
    }, []); // Empty dependency array - only run once!

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="card p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            Connecting to Upstox
                        </h2>
                        <p className="text-text-secondary">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-profit text-6xl mb-4">✓</div>
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            Success!
                        </h2>
                        <p className="text-text-secondary">{message}</p>
                        <p className="text-sm text-profit mt-2 font-medium">
                            Live market data is now available for all users!
                        </p>
                        <p className="text-sm text-text-secondary mt-4">
                            Redirecting to dashboard...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-loss text-6xl mb-4">✗</div>
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            Connection Failed
                        </h2>
                        <p className="text-text-secondary">{message}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mt-6 btn-primary"
                        >
                            Go to Dashboard
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
