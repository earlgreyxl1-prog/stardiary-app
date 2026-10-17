'use client';

import { useRef } from 'react';
import { Check } from 'lucide-react';
import { FieldError } from '@/components/ui/FieldError';
import { NumberField } from '@/components/ui/NumberField';
import type { BirthStepProps } from '@/types/birth';

export function StepTime({ values, errors, setField }: BirthStepProps) {
  const minuteRef = useRef<HTMLInputElement>(null);
  const unknown = values.timeUnknown;
  const invalid = Boolean(errors.time);
  const describedBy = invalid ? 'time-error' : undefined;

  return (
    <fieldset>
      <legend className="text-lg font-bold text-white">몇 시쯤 태어났나요?</legend>
      <p className="mt-1 text-sm text-indigo-200/80">
        24시간제로 입력해 주세요. 오후 3시 30분이라면 15시 30분이에요.
      </p>
      <div className="mt-4 flex gap-3">
        <NumberField
          id="birth-hour"
          label="시"
          suffix="시"
          placeholder="15"
          maxLength={2}
          value={values.hour}
          disabled={unknown}
          invalid={invalid}
          describedBy={describedBy}
          onChange={(value) => setField('hour', value)}
          onComplete={() => minuteRef.current?.focus()}
        />
        <NumberField
          id="birth-minute"
          ref={minuteRef}
          label="분"
          suffix="분"
          placeholder="30"
          maxLength={2}
          value={values.minute}
          disabled={unknown}
          invalid={invalid}
          describedBy={describedBy}
          onChange={(value) => setField('minute', value)}
        />
      </div>

      <button
        type="button"
        aria-pressed={unknown}
        onClick={() => setField('timeUnknown', !unknown)}
        className={`mt-4 flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition active:scale-[0.98] ${
          unknown
            ? 'border-[#ffe9a8]/60 bg-[#ffe9a8]/10 text-[#ffe9a8]'
            : 'border-white/15 bg-white/5 text-indigo-100 hover:bg-white/10'
        }`}
      >
        <span
          aria-hidden
          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
            unknown ? 'border-[#ffe9a8] bg-[#ffe9a8] text-[#2a2260]' : 'border-white/30'
          }`}
        >
          {unknown && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
        태어난 시간을 몰라요
      </button>

      {unknown && (
        <p className="mt-3 text-sm leading-relaxed text-indigo-200/80">
          괜찮아요! 상승궁은 시간이 있어야 알 수 있어서, 태양과 달 별자리 중심으로 보여드릴게요.
        </p>
      )}
      <FieldError id="time-error" message={errors.time} />
    </fieldset>
  );
}
