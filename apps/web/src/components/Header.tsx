'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary-600">
          CallMeBackWhen
        </Link>

        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Balance:</span>{' '}
              <span className="font-medium">${(user.balanceCents / 100).toFixed(2)}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
