'use client';

import { useRef } from 'react';
import { FieldError } from '@/components/ui/FieldError';
import { NumberField } from '@/components/ui/NumberField';
import type { BirthStepProps } from '@/types/birth';

export function StepDate({ values, errors, setField }: BirthStepProps) {
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const invalid = Boolean(errors.date);
  const describedBy = invalid ? 'date-error' : undefined;

  return (
    <fieldset>
      <legend className="text-lg font-bold text-white">{values.nickname.trim()}님은 언제 태어났나요?</legend>
      <p className="mt-1 text-sm text-indigo-200/80">
        양력 기준이에요. 음력 생일이라면 양력으로 바꿔서 입력해 주세요.
      </p>
      <div className="mt-4 flex gap-3">
        <NumberField
          id="birth-year"
          label="연도"
          suffix="년"
          placeholder="1998"
          maxLength={4}
          widthClass="flex-[1.5]"
          value={values.year}
          invalid={invalid}
          describedBy={describedBy}
          onChange={(value) => setField('year', value)}
          onComplete={() => monthRef.current?.focus()}
        />
        <NumberField
          id="birth-month"
          ref={monthRef}
          label="월"
          suffix="월"
          placeholder="3"
          maxLength={2}
          value={values.month}
          invalid={invalid}
          describedBy={describedBy}
          onChange={(value) => setField('month', value)}
          onComplete={() => dayRef.current?.focus()}
        />
        <NumberField
          id="birth-day"
          ref={dayRef}
          label="일"
          suffix="일"
          placeholder="14"
          maxLength={2}
          value={values.day}
          invalid={invalid}
          describedBy={describedBy}
          onChange={(value) => setField('day', value)}
        />
      </div>
      <FieldError id="date-error" message={errors.date} />
    </fieldset>
  );
}
