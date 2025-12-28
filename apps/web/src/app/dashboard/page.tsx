'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="card mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            You're all set up. Start a call whenever you're ready.
          </p>
        </div>

        {/* New Call Card */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Make a call
          </h2>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600 mb-4">
              Call functionality will be available in Phase 2. Stay tuned!
            </p>
            <Button disabled className="opacity-50 cursor-not-allowed">
              Start a Call
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your balance
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                ${(user.balanceCents / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                ~{Math.floor(user.balanceCents / 5)} minutes of calls
              </p>
            </div>
            <Button variant="secondary" disabled>
              Add Funds (Phase 3)
            </Button>
          </div>
        </div>

        {/* Call History */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent calls
          </h2>

          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p>No calls yet</p>
            <p className="text-sm mt-1">Your call history will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}
