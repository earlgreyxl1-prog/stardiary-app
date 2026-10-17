'use client';

import { FieldError } from '@/components/ui/FieldError';
import { INPUT_CLASS } from '@/components/ui/inputStyles';
import type { BirthStepProps } from '@/types/birth';

export function StepNickname({ values, errors, setField }: BirthStepProps) {
  const invalid = Boolean(errors.nickname);
  return (
    <div>
      <label htmlFor="nickname" className="text-lg font-bold text-white">
        뭐라고 불러드릴까요?
      </label>
      <p className="mt-1 text-sm text-indigo-200/80">별자리 결과에 나올 이름이에요. 본명이 아니어도 괜찮아요.</p>
      <input
        id="nickname"
        type="text"
        autoComplete="nickname"
        maxLength={10}
        placeholder="예: 별이"
        value={values.nickname}
        aria-invalid={invalid}
        aria-describedby={invalid ? 'nickname-error' : undefined}
        onChange={(event) => setField('nickname', event.target.value)}
        className={`${INPUT_CLASS} mt-4`}
      />
      <p className="mt-2 text-right text-xs text-indigo-300/70">{values.nickname.trim().length}/10</p>
      <FieldError id="nickname-error" message={errors.nickname} />
    </div>
  );
}
