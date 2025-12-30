'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { CallForm } from '@/components/CallForm';
import { LiveCallStatus } from '@/components/LiveCallStatus';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { CallPublic } from '@callmebackwhen/shared';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  // Fetch active call on mount
  const { data: activeCallData, isLoading: activeCallLoading } = useQuery({
    queryKey: ['activeCall'],
    queryFn: () => api.getActiveCall(),
    enabled: isAuthenticated,
    refetchInterval: activeCallId ? false : 10000, // Poll if no active call tracked
  });

  // Fetch recent calls
  const { data: callsData } = useQuery({
    queryKey: ['calls'],
    queryFn: () => api.listCalls(1, 5),
    enabled: isAuthenticated,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  // Set active call from API response
  useEffect(() => {
    if (activeCallData?.call && !activeCallId) {
      setActiveCallId(activeCallData.call.id);
    }
  }, [activeCallData, activeCallId]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const activeCall = activeCallData?.call ?? null;
  const recentCalls = callsData?.calls ?? [];

  const handleCallStarted = (callId: string) => {
    setActiveCallId(callId);
  };

  const handleCallEnded = () => {
    setActiveCallId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Active Call or New Call Section */}
        <div className="card mb-6">
          {activeCall ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Active Call
              </h2>
              <LiveCallStatus call={activeCall} onCallEnded={handleCallEnded} />
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Make a call
              </h2>
              <CallForm onCallStarted={handleCallStarted} />
            </>
          )}
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

        {/* Recent Calls */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent calls
            </h2>
            {recentCalls.length > 0 && (
              <Link
                href="/calls"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            )}
          </div>

          {recentCalls.length === 0 ? (
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
          ) : (
            <div className="space-y-3">
              {recentCalls.map((call) => (
                <CallListItem key={call.id} call={call} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CallListItem({ call }: { call: CallPublic }) {
  const statusColors: Record<string, string> = {
    completed: 'bg-gray-100 text-gray-700',
    failed: 'bg-red-100 text-red-700',
    resolved_auto: 'bg-green-100 text-green-700',
    resolved_transfer: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-yellow-100 text-yellow-700',
  };

  const statusLabel = call.outcome
    ? call.outcome.replace('_', ' ')
    : call.status;

  return (
    <Link
      href={`/calls/${call.id}`}
      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {call.targetPhoneNumber}
          </p>
          <p className="text-sm text-gray-500 truncate mt-1">
            {call.userPrompt.slice(0, 60)}
            {call.userPrompt.length > 60 ? '...' : ''}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(call.createdAt).toLocaleDateString()} at{' '}
            {new Date(call.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
              statusColors[call.outcome ?? call.status] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {statusLabel}
          </span>
          {call.durationSeconds !== undefined && (
            <p className="text-xs text-gray-400 mt-1 text-right">
              {Math.floor(call.durationSeconds / 60)}:
              {(call.durationSeconds % 60).toString().padStart(2, '0')}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
