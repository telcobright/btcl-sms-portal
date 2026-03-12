'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import AdminSidebar from './components/AdminSidebar';

interface DecodedToken {
  roles?: { id: number; name: string; description: string }[];
  idPartner?: number;
  exp?: number;
  [key: string]: unknown;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'en';
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const checkAdminRole = () => {
      try {
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
          router.push(`/${locale}/login`);
          return;
        }

        const decoded = jwtDecode<DecodedToken>(authToken);

        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('authToken');
          router.push(`/${locale}/login`);
          return;
        }

        // Check for ROLE_ADMIN
        const isAdmin = decoded.roles?.some(
          (role) => role.name === 'ROLE_ADMIN'
        );

        if (!isAdmin) {
          // Not an admin, redirect to user dashboard
          router.push(`/${locale}/dashboard`);
          return;
        }

        // Set user name from token if available
        if (decoded.sub) {
          setUserName(String(decoded.sub));
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push(`/${locale}/login`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [router, locale]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push(`/${locale}/login`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-500">BTCL Services Management</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-[#00A651]">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
