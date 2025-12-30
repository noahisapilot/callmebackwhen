'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { CallPublic } from '@callmebackwhen/shared';
import Link from 'next/link';

export default function CallHistoryClient() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['calls', page],
    queryFn: () => api.listCalls(page, limit),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const calls = data?.calls ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="card">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          </div>
        ) : calls.length === 0 ? (
          <div className="card text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No calls yet
            </h2>
            <p className="text-gray-500 mb-4">
              Start your first call from the dashboard
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="card divide-y divide-gray-100">
              {calls.map((call) => (
                <CallRow key={call.id} call={call} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} calls)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CallRow({ call }: { call: CallPublic }) {
  const statusColors: Record<string, string> = {
    completed: 'bg-gray-100 text-gray-700',
    failed: 'bg-red-100 text-red-700',
    resolved_auto: 'bg-green-100 text-green-700',
    resolved_transfer: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-yellow-100 text-yellow-700',
  };

  const outcomeLabels: Record<string, string> = {
    resolved_auto: 'Resolved by AI',
    resolved_transfer: 'Transferred',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  return (
    <Link
      href={`/calls/${call.id}`}
      className="block p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="font-medium text-gray-900">
              {call.targetPhoneNumber}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                statusColors[call.outcome ?? call.status] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {call.outcome ? outcomeLabels[call.outcome] : call.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {call.userPrompt}
          </p>
          {call.outcomeSummary && (
            <p className="text-sm text-gray-600 mt-2 italic">
              &quot;{call.outcomeSummary}&quot;
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 text-right">
          <p className="text-sm text-gray-500">
            {new Date(call.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(call.createdAt).toLocaleTimeString()}
          </p>
          {call.durationSeconds !== undefined && (
            <p className="text-sm font-mono text-gray-600 mt-1">
              {Math.floor(call.durationSeconds / 60)}:
              {(call.durationSeconds % 60).toString().padStart(2, '0')}
            </p>
          )}
          {call.costCents !== undefined && call.costCents > 0 && (
            <p className="text-xs text-gray-500">
              ${(call.costCents / 100).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
