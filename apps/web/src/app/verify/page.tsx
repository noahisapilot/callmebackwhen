'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { OtpInput } from '@/components/OtpInput';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatPhoneDisplay } from '@/lib/phone';
import { OTP_CONFIG } from '@callmebackwhen/shared';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Get phone number from session storage
  useEffect(() => {
    const storedPhone = sessionStorage.getItem('verify_phone');
    if (!storedPhone) {
      router.push('/');
      return;
    }
    setPhoneNumber(storedPhone);
  }, [router]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const verifyMutation = useMutation({
    mutationFn: () => api.verifyOtp({ phoneNumber, code }),
    onSuccess: (data) => {
      login(data.token, data.user);
      sessionStorage.removeItem('verify_phone');
      router.push('/dashboard');
    },
    onError: (err: Error) => {
      setError(err.message);
      setCode('');
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => api.sendOtp({ phoneNumber }),
    onSuccess: () => {
      setResendCountdown(OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
      setError('');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    verifyMutation.mutate();
  };

  const handleResend = () => {
    if (resendCountdown > 0) return;
    resendMutation.mutate();
  };

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6 && !verifyMutation.isPending) {
      verifyMutation.mutate();
    }
  }, [code]);

  if (!phoneNumber) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verify your phone
          </h1>
          <p className="text-gray-600">
            We sent a code to{' '}
            <span className="font-medium">{formatPhoneDisplay(phoneNumber)}</span>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <OtpInput
              value={code}
              onChange={setCode}
              error={error}
              disabled={verifyMutation.isPending}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={verifyMutation.isPending}
              disabled={code.length !== 6}
            >
              Verify
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive it?{' '}
              {resendCountdown > 0 ? (
                <span className="text-gray-400">
                  Resend in {resendCountdown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendMutation.isPending}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {resendMutation.isPending ? 'Sending...' : 'Resend code'}
                </button>
              )}
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Use a different number
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
