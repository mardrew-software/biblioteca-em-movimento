'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface User {
  email: string;
  name: string;
  picture?: string;
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

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
        window.location.href = '/admin';
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

  // Admin links (only visible when logged in)
  const adminLinks = [
    { href: '/locatarios', label: 'Locatários' },
    { href: '/admin', label: 'Admin' },
  ];

  const navLinks = user ? adminLinks : [];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-16 mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" >
              <img src="/logo.png" alt="centro em movimento" className="h-8" />
            </Link>

            {navLinks.length > 0 && (
              <div className="hidden md:flex items-center gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-[#ff4e00] ${pathname === link.href
                      ? 'text-[#ff4e00]'
                      : 'text-gray-600'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="text-2xl font-bold text-[#ff4e00]">
            biblioteca em movimento
          </div>

          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    {user.picture && (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-600 hidden md:block">
                      {user.name}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
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
