'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { CallEventPublic, CallStatus } from '@callmebackwhen/shared';
import Link from 'next/link';

const STATUS_LABELS: Record<CallStatus, string> = {
  pending: 'Pending',
  dialing: 'Dialing',
  in_ivr: 'In Phone Menu',
  on_hold: 'On Hold',
  with_rep: 'With Representative',
  transferring: 'Transferring',
  completed: 'Completed',
  failed: 'Failed',
};

function formatEventType(eventType: string): string {
  const labels: Record<string, string> = {
    call_started: 'Call started',
    ivr_detected: 'Navigating phone menu',
    hold_started: 'Put on hold',
    hold_ended: 'Hold ended',
    callback_offered: 'Callback option offered',
    callback_accepted: 'Callback accepted',
    rep_available: 'Connected to representative',
    transfer_initiated: 'Transfer starting',
    transfer_completed: 'Transfer complete',
    info_requested: 'Information requested',
    info_received: 'Information received',
    speech_update: 'Conversation update',
    resolved: 'Call resolved',
    error: 'Error',
  };
  return labels[eventType] ?? eventType;
}

export default function CallDetailClient() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const callId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['call', callId],
    queryFn: () => api.getCall(callId),
    enabled: isAuthenticated && !!callId,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Call not found
            </h2>
            <p className="text-gray-500 mb-4">
              This call doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/calls">
              <Button>Back to Call History</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { call, events } = data;

  const outcomeColors: Record<string, string> = {
    resolved_auto: 'bg-green-100 text-green-800',
    resolved_transfer: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-yellow-100 text-yellow-800',
  };

  const outcomeLabels: Record<string, string> = {
    resolved_auto: 'Resolved by AI',
    resolved_transfer: 'Resolved via Transfer',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/calls">
            <Button variant="secondary" className="!px-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Call Details</h1>
        </div>

        {/* Call Summary */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {call.targetPhoneNumber}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date(call.createdAt).toLocaleDateString()} at{' '}
                {new Date(call.createdAt).toLocaleTimeString()}
              </p>
            </div>
            {call.outcome && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  outcomeColors[call.outcome] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {outcomeLabels[call.outcome]}
              </span>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Your request</h3>
            <p className="text-gray-900">{call.userPrompt}</p>
          </div>

          {call.outcomeSummary && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-green-700 mb-1">Result</h3>
              <p className="text-green-900">{call.outcomeSummary}</p>
            </div>
          )}

          {/* Call Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium text-gray-900">{STATUS_LABELS[call.status]}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium text-gray-900">
                {call.durationSeconds !== undefined
                  ? `${Math.floor(call.durationSeconds / 60)}:${(call.durationSeconds % 60)
                      .toString()
                      .padStart(2, '0')}`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hold Time</p>
              <p className="font-medium text-gray-900">
                {call.holdDurationSeconds !== undefined
                  ? `${Math.floor(call.holdDurationSeconds / 60)}:${(call.holdDurationSeconds % 60)
                      .toString()
                      .padStart(2, '0')}`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cost</p>
              <p className="font-medium text-gray-900">
                {call.costCents !== undefined ? `$${(call.costCents / 100).toFixed(2)}` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Event Timeline */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>

          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No activity recorded</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {events.map((event, index) => (
                  <EventItem key={event.id} event={event} isLast={index === events.length - 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EventDataDisplay({ data }: { data: Record<string, unknown> }) {
  const items: React.ReactNode[] = [];

  if (data.text) {
    items.push(<p key="text">&quot;{String(data.text)}&quot;</p>);
  }
  if (data.summary) {
    items.push(<p key="summary">{String(data.summary)}</p>);
  }
  if (data.reason) {
    items.push(<p key="reason">{String(data.reason)}</p>);
  }
  if (data.message) {
    items.push(<p key="message">{String(data.message)}</p>);
  }
  if (data.minutes) {
    items.push(<p key="minutes">Expected wait: {String(data.minutes)} minutes</p>);
  }
  if (data.expectedMinutes) {
    items.push(<p key="expectedMinutes">Callback expected in: {String(data.expectedMinutes)} minutes</p>);
  }
  if (data.question) {
    items.push(<p key="question">Question: &quot;{String(data.question)}&quot;</p>);
  }

  if (items.length === 0) return null;

  return <div className="mt-1 text-sm text-gray-600">{items}</div>;
}

function EventItem({ event, isLast }: { event: CallEventPublic; isLast: boolean }) {
  const eventColors: Record<string, string> = {
    call_started: 'bg-blue-500',
    rep_available: 'bg-green-500',
    resolved: 'bg-green-500',
    error: 'bg-red-500',
    transfer_initiated: 'bg-indigo-500',
    transfer_completed: 'bg-indigo-500',
    hold_started: 'bg-orange-500',
    callback_accepted: 'bg-purple-500',
    info_requested: 'bg-yellow-500',
    info_received: 'bg-yellow-500',
  };

  return (
    <div className="relative flex items-start gap-4 pl-8">
      <div
        className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white ${
          eventColors[event.eventType] ?? 'bg-gray-400'
        }`}
      />
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{formatEventType(event.eventType)}</p>
          <span className="text-xs text-gray-400">
            {new Date(event.createdAt).toLocaleTimeString()}
          </span>
        </div>
        {event.eventData && (
          <EventDataDisplay data={event.eventData} />
        )}
      </div>
    </div>
  );
}
