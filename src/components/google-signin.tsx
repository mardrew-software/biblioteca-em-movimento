'use client';

import { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
    onSuccess?: (credential: string) => void;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Wait for Google script to load
        const initializeGoogleButton = () => {
            if (window.google && buttonRef.current) {
                window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                    callback: (response: { credential: string }) => {
                        if (onSuccess) {
                            onSuccess(response.credential);
                        }
                    },
                });

                window.google.accounts.id.renderButton(buttonRef.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular',
                });
            }
        };

        // Check if Google script is already loaded
        if (document.readyState === 'complete') {
            initializeGoogleButton();
        } else {
            window.addEventListener('load', initializeGoogleButton);
            return () => window.removeEventListener('load', initializeGoogleButton);
        }
    }, [onSuccess]);

    return <div ref={buttonRef} className="inline-block" />;
}

// Add TypeScript declaration for Google API
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }) => void;
                    renderButton: (
                        element: HTMLElement,
                        options: {
                            type?: string;
                            theme?: string;
                            size?: string;
                            text?: string;
                            shape?: string;
                        }
                    ) => void;
                };
            };
        };
    }
}
