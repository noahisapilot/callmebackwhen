'use client';

import { useState, useCallback, forwardRef, type ChangeEvent } from 'react';
import { Input } from './ui/Input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, error, disabled }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => formatForDisplay(value));

    function formatForDisplay(phone: string): string {
      const digits = phone.replace(/\D/g, '').slice(0, 10);

      if (digits.length === 0) return '';
      if (digits.length <= 3) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const digits = input.replace(/\D/g, '').slice(0, 10);

        setDisplayValue(formatForDisplay(digits));

        // Convert to E.164 for the value
        if (digits.length === 10) {
          onChange(`+1${digits}`);
        } else {
          onChange(digits);
        }
      },
      [onChange]
    );

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="(555) 123-4567"
        value={displayValue}
        onChange={handleChange}
        error={error}
        disabled={disabled}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
