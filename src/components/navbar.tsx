'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, LogIn } from 'lucide-react';

interface User {
  email: string;
  name: string;
  picture?: string;
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Load Google Sign-In button when modal is shown
  useEffect(() => {
    if (showLoginModal) {
      // Wait a bit for the modal to render
      setTimeout(() => {
        if (window.google && document.getElementById('modal-google-signin-button')) {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
            callback: handleGoogleSignIn,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('modal-google-signin-button'),
            {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
            }
          );
        }
      }, 100);
    }
  }, [showLoginModal]);

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
        setShowLoginModal(false);
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

  // Links públicos (visíveis para todos)
  const publicLinks = [{ href: '/', label: 'Livros' }];

  // Links de admin (visíveis apenas para usuários logados)
  const adminLinks = [
    { href: '/locatarios', label: 'Locatários' },
    { href: '/admin', label: 'Admin' },
  ];

  const navLinks = user ? [...publicLinks, ...adminLinks] : publicLinks;

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-[#ff4e00]">
                Biblioteca em Movimento
              </Link>

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
                    <Button
                      onClick={() => setShowLoginModal(true)}
                      className="bg-[#ff4e00] hover:bg-[#e64500]"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Login Admin
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff4e00] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Login Admin</h2>
                  <p className="text-sm text-gray-500">Acesso restrito a administradores</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Faça login com sua conta Google para acessar o painel administrativo.
                </p>
              </div>

              <div id="modal-google-signin-button" className="flex justify-center py-4">
                {/* Google Sign-In button will be rendered here */}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar e voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
