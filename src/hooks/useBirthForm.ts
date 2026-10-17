'use client';

import { useCallback, useState } from 'react';
import { findFirstInvalidStep, toBirthInput, validateStep } from '@/lib/validators';
import type {
  BirthFieldKey,
  BirthFormErrors,
  BirthFormValues,
  BirthInput,
  OnboardingStep,
  SetBirthField,
  SubmitStatus,
} from '@/types/birth';

const INITIAL_VALUES: BirthFormValues = {
  nickname: '',
  year: '',
  month: '',
  day: '',
  hour: '',
  minute: '',
  timeUnknown: false,
  city: null,
};

const FIELD_TO_ERROR_KEY: Record<keyof BirthFormValues, BirthFieldKey> = {
  nickname: 'nickname',
  year: 'date',
  month: 'date',
  day: 'date',
  hour: 'time',
  minute: 'time',
  timeUnknown: 'time',
  city: 'city',
};

const NEXT_STEP: Record<OnboardingStep, OnboardingStep> = { 0: 1, 1: 2, 2: 3, 3: 3 };
const PREV_STEP: Record<OnboardingStep, OnboardingStep> = { 0: 0, 1: 0, 2: 1, 3: 2 };
const FALLBACK_ERROR_MESSAGE = '잠시 문제가 생겼어요. 다시 시도해 주세요.';

export interface UseBirthFormResult {
  values: BirthFormValues;
  step: OnboardingStep;
  direction: 1 | -1;
  errors: BirthFormErrors;
  submitStatus: SubmitStatus;
  submitError: string | null;
  setField: SetBirthField;
  goNext: () => void;
  goPrev: () => void;
  submit: (onSubmit: (input: BirthInput) => Promise<void>) => Promise<void>;
}

export interface UseBirthFormOptions {
  /** 이전에 입력한 값을 고치러 돌아왔을 때 채워 둘 값 */
  initialValues?: BirthFormValues;
  initialStep?: OnboardingStep;
}

export function useBirthForm({ initialValues, initialStep = 0 }: UseBirthFormOptions = {}): UseBirthFormResult {
  const [values, setValues] = useState<BirthFormValues>(initialValues ?? INITIAL_VALUES);
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [errors, setErrors] = useState<BirthFormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField: SetBirthField = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const errorKey = FIELD_TO_ERROR_KEY[key];
      if (prev[errorKey] === undefined) return prev;
      const next: BirthFormErrors = { ...prev };
      delete next[errorKey];
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setDirection(1);
    setStep(NEXT_STEP[step]);
  }, [step, values]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep(PREV_STEP[step]);
    setSubmitStatus('idle');
    setSubmitError(null);
  }, [step]);

  const submit = useCallback(
    async (onSubmit: (input: BirthInput) => Promise<void>): Promise<void> => {
      const invalid = findFirstInvalidStep(values);
      if (invalid) {
        setErrors(invalid.errors);
        setDirection(invalid.step < step ? -1 : 1);
        setStep(invalid.step);
        return;
      }

      const input = toBirthInput(values);
      if (input === null) return;

      setSubmitStatus('submitting');
      setSubmitError(null);
      try {
        await onSubmit(input);
        setSubmitStatus('success');
      } catch (error: unknown) {
        setSubmitStatus('error');
        setSubmitError(error instanceof Error ? error.message : FALLBACK_ERROR_MESSAGE);
      }
    },
    [values, step],
  );

  return { values, step, direction, errors, submitStatus, submitError, setField, goNext, goPrev, submit };
}
