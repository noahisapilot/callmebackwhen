'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PhoneInput } from './PhoneInput';
import { Button } from './ui/Button';
import { api } from '@/lib/api';

interface CallFormProps {
  onCallStarted: (callId: string) => void;
}

export function CallForm({ onCallStarted }: CallFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const createCallMutation = useMutation({
    mutationFn: () =>
      api.createCall({
        targetPhoneNumber: phoneNumber,
        prompt,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeCall'] });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      onCallStarted(data.call.id);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    if (prompt.length < 10) {
      setError('Please provide more details about what you need (at least 10 characters)');
      return;
    }

    createCallMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone number to call
        </label>
        <PhoneInput
          value={phoneNumber}
          onChange={setPhoneNumber}
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter the customer service number you want us to call
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What do you need help with?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: I need to dispute a charge of $47.99 from December 15th on my credit card"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[120px] resize-none"
          maxLength={2000}
        />
        <p className="mt-1 text-sm text-gray-500">
          {prompt.length}/2000 characters
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={createCallMutation.isPending}
      >
        {createCallMutation.isPending ? 'Starting call...' : 'Start Call'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        You will be charged $0.05/minute while our AI handles your call
      </p>
    </form>
  );
}
