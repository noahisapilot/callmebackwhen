'use client';

import { useRef, useState, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  error,
  disabled,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (!/^\d*$/.test(digit)) return;

      const newValue = value.split('');
      newValue[index] = digit.slice(-1);
      const updatedValue = newValue.join('').slice(0, length);
      onChange(updatedValue);

      // Move to next input
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, onChange, length]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!value[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, onChange, length]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      onChange(pastedData);

      // Focus the next empty input or last input
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    },
    [onChange, length]
  );

  return (
    <div>
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={value[index] ?? ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            disabled={disabled}
            className={`
              w-12 h-14 text-center text-xl font-semibold rounded-lg border
              transition-colors focus:outline-none focus:ring-2
              ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : focusedIndex === index
                    ? 'border-primary-500 ring-2 ring-primary-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
