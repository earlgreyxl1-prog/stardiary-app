'use client';

import { forwardRef } from 'react';
import { INPUT_CLASS } from '@/components/ui/inputStyles';

interface NumberFieldProps {
  id: string;
  label: string;
  suffix: string;
  placeholder: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
  /** 입력이 maxLength에 도달하면 호출된다. 다음 칸으로 포커스를 넘길 때 사용. */
  onComplete?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  widthClass?: string;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    id,
    label,
    suffix,
    placeholder,
    value,
    maxLength,
    onChange,
    onComplete,
    disabled = false,
    invalid = false,
    describedBy,
    widthClass = 'flex-1',
  },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${widthClass}`}>
      <label htmlFor={id} className="text-xs text-indigo-200/80">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`${INPUT_CLASS} pr-9`}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, maxLength);
            onChange(digits);
            if (digits.length === maxLength) onComplete?.();
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-indigo-200/60"
        >
          {suffix}
        </span>
      </div>
    </div>
  );
});
