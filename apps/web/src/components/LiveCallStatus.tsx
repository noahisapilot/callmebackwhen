'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/Button';
import { api } from '@/lib/api';
import type { CallPublic, CallEventPublic, CallStatus, CallStreamEvent } from '@callmebackwhen/shared';

interface LiveCallStatusProps {
  call: CallPublic;
  onCallEnded: () => void;
}

const STATUS_LABELS: Record<CallStatus, string> = {
  pending: 'Preparing call...',
  dialing: 'Dialing...',
  in_ivr: 'Navigating phone menu...',
  on_hold: 'On hold...',
  with_rep: 'Speaking with representative',
  transferring: 'Transferring to you...',
  completed: 'Call completed',
  failed: 'Call failed',
};

const STATUS_COLORS: Record<CallStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  dialing: 'bg-blue-100 text-blue-800',
  in_ivr: 'bg-purple-100 text-purple-800',
  on_hold: 'bg-orange-100 text-orange-800',
  with_rep: 'bg-green-100 text-green-800',
  transferring: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-gray-100 text-gray-800',
  failed: 'bg-red-100 text-red-800',
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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
    info_requested: 'Information needed',
    info_received: 'Information received',
    speech_update: 'Conversation update',
    resolved: 'Issue resolved',
    error: 'Error occurred',
  };
  return labels[eventType] ?? eventType;
}

function getEventText(eventData: Record<string, unknown> | undefined): React.ReactNode {
  if (!eventData || !('text' in eventData) || !eventData.text) {
    return null;
  }
  const text = String(eventData.text);
  return (
    <span className="text-gray-500 ml-1">
      - &quot;{text.slice(0, 50)}{text.length > 50 ? '...' : ''}&quot;
    </span>
  );
}

export function LiveCallStatus({ call, onCallEnded }: LiveCallStatusProps) {
  const [currentStatus, setCurrentStatus] = useState<CallStatus>(call.status);
  const [events, setEvents] = useState<CallEventPublic[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [holdTime, setHoldTime] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelCall(call.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCall'] });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      onCallEnded();
    },
  });

  const isActive = ['pending', 'dialing', 'in_ivr', 'on_hold', 'with_rep', 'transferring'].includes(
    currentStatus
  );

  // Timer for elapsed time
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  // Hold time tracking
  useEffect(() => {
    if (currentStatus === 'on_hold') {
      holdTimerRef.current = setInterval(() => {
        setHoldTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    }

    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, [currentStatus]);

  // SSE connection for real-time updates
  useEffect(() => {
    const streamUrl = api.getCallStreamUrl(call.id);
    const token = api.getToken();

    if (!streamUrl || !token) {
      return;
    }

    // Use fetch with EventSource-like handling since we need auth headers
    const setupStream = async () => {
      try {
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok || !response.body) {
          console.error('Failed to connect to stream');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: CallStreamEvent = JSON.parse(line.slice(6));
                handleStreamEvent(event);
              } catch {
                console.error('Failed to parse SSE event');
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      }
    };

    setupStream();

    return () => {
      // Cleanup handled by the fetch abort
    };
  }, [call.id]);

  const handleStreamEvent = useCallback((event: CallStreamEvent) => {
    switch (event.type) {
      case 'status_update':
        if (event.data.status) {
          setCurrentStatus(event.data.status);
          if (!['pending', 'dialing', 'in_ivr', 'on_hold', 'with_rep', 'transferring'].includes(event.data.status)) {
            onCallEnded();
          }
        }
        break;

      case 'event':
        if (event.data.event) {
          setEvents((prev) => [...prev, event.data.event!]);
        }
        break;

      case 'transcript':
        // Could show real-time transcript if needed
        break;

      case 'error':
        console.error('Stream error:', event.data.message);
        break;
    }
  }, [onCallEnded]);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="text-center">
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[currentStatus]}`}
        >
          {currentStatus === 'on_hold' && (
            <span className="animate-pulse mr-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="10" />
              </svg>
            </span>
          )}
          {STATUS_LABELS[currentStatus]}
        </div>

        <div className="mt-4 text-3xl font-mono font-bold text-gray-900">
          {formatDuration(elapsedTime)}
        </div>
        <p className="text-sm text-gray-500">Total call time</p>

        {currentStatus === 'on_hold' && holdTime > 0 && (
          <div className="mt-2">
            <span className="text-lg font-mono text-orange-600">
              {formatDuration(holdTime)}
            </span>
            <p className="text-sm text-gray-500">Time on hold</p>
          </div>
        )}

        {call.expectedWaitMinutes && (
          <p className="mt-2 text-sm text-gray-600">
            Expected wait: ~{call.expectedWaitMinutes} minutes
          </p>
        )}
      </div>

      {/* Call Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Calling</h3>
        <p className="text-gray-700">{call.targetPhoneNumber}</p>
        <h3 className="font-medium text-gray-900 mt-4 mb-2">Your request</h3>
        <p className="text-gray-700 text-sm">{call.userPrompt}</p>
      </div>

      {/* Events Timeline */}
      {events.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Activity</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 text-sm"
              >
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </span>
                <span className="text-gray-700">
                  {formatEventType(event.eventType)}
                  {getEventText(event.eventData)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div className="pt-4 border-t">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Call'}
          </Button>
        </div>
      )}
    </div>
  );
}
