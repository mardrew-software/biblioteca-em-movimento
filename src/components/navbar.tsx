'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface User {
  email: string;
  name: string;
  picture?: string;
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Close menu when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Load Google Sign-In button when not logged in
  useEffect(() => {
    if (!loading && !user && googleButtonRef.current) {
      const initializeGoogleButton = () => {
        if (window.google && googleButtonRef.current) {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
            callback: handleGoogleSignIn,
          });
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              type: 'standard',
              theme: 'outline',
              size: 'medium',
              text: 'signin_with',
              shape: 'rectangular',
            }
          );
        }
      };

      // Check if Google script is already loaded
      if (document.readyState === 'complete') {
        initializeGoogleButton();
      } else {
        window.addEventListener('load', initializeGoogleButton);
        return () => window.removeEventListener('load', initializeGoogleButton);
      }
    }
  }, [loading, user]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (response: { credential: string }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      if (res.ok) {
        await checkAuth();
        window.location.href = '/';
      } else {
        throw new Error('Falha na autenticação');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-[100] py-1">
      <div className="px-12 grid grid-cols-2 lg:grid-cols-3 h-16 w-full items-center">
        <Link href="/" className="flex-shrink-0">
          <img src="/logo.png" alt="centro em movimento" className="h-8" />
        </Link>

        <div className="hidden lg:block text-2xl font-bold text-[#ff4e00] truncate px-4 text-center">
          biblioteca em movimento
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-4">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-6">
                  <div className='flex flex-row gap-2 items-center'>
                    {user.picture && (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-600 hidden sm:block">
                      {user.name}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-sm py-1 px-4"
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                <div ref={googleButtonRef} />
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
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
            element: HTMLElement | null,
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
