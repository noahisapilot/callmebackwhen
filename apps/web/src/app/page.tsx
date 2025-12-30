'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { PhoneInput } from '@/components/PhoneInput';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isValidUSPhone } from '@/lib/phone';

export default function LandingPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const sendOtpMutation = useMutation({
    mutationFn: () => api.sendOtp({ phoneNumber }),
    onSuccess: () => {
      // Store phone number for verify page
      sessionStorage.setItem('verify_phone', phoneNumber);
      router.push('/verify');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidUSPhone(phoneNumber)) {
      setError('Please enter a valid US phone number');
      return;
    }

    sendOtpMutation.mutate();
  };

  // Show loading while checking auth
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Never wait on hold again
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Our AI handles the call for you. Navigate menus, wait on hold, and get
            transferred when a human is ready.
          </p>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your phone number
                </label>
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  error={error}
                  disabled={sendOtpMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={sendOtpMutation.isPending}
              >
                Get Started
              </Button>
            </form>

            <p className="mt-4 text-xs text-gray-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white border-t border-gray-200 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Tell us who to call
              </h3>
              <p className="text-sm text-gray-600">
                Enter the phone number and describe what you need help with.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                We handle the wait
              </h3>
              <p className="text-sm text-gray-600">
                Our AI navigates menus and waits on hold so you don't have to.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Get connected
              </h3>
              <p className="text-sm text-gray-600">
                We'll call you when a human is ready, or resolve it automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Call Me Back When. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
