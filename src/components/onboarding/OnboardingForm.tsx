'use client';

import type { FormEvent } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Mascot } from '@/components/onboarding/Mascot';
import { StepCity } from '@/components/onboarding/StepCity';
import { StepDate } from '@/components/onboarding/StepDate';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { StepNickname } from '@/components/onboarding/StepNickname';
import { StepTime } from '@/components/onboarding/StepTime';
import { useBirthForm, type UseBirthFormOptions } from '@/hooks/useBirthForm';
import type { BirthInput, BirthStepProps, OnboardingStep } from '@/types/birth';

interface OnboardingFormProps extends UseBirthFormOptions {
  onSubmit: (input: BirthInput) => Promise<void>;
}

const TOTAL_STEPS = 4;
const LAST_STEP: OnboardingStep = 3;

const MASCOT_MESSAGES: Record<OnboardingStep, string> = {
  0: '안녕! 나는 별길을 안내하는 달토리야. 먼저 이름부터 알려줄래?',
  1: '좋아! 네가 태어난 날, 하늘에는 어떤 별이 떠 있었을까?',
  2: '태어난 시간까지 알면 상승궁을 볼 수 있어. 몰라도 괜찮아!',
  3: '마지막이야! 태어난 곳에 따라 하늘이 조금씩 달라 보이거든.',
};

const stepVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -28 }),
};

interface CurrentStepProps extends BirthStepProps {
  step: OnboardingStep;
}

function CurrentStep({ step, values, errors, setField }: CurrentStepProps) {
  switch (step) {
    case 0:
      return <StepNickname values={values} errors={errors} setField={setField} />;
    case 1:
      return <StepDate values={values} errors={errors} setField={setField} />;
    case 2:
      return <StepTime values={values} errors={errors} setField={setField} />;
    case 3:
      return <StepCity values={values} errors={errors} setField={setField} />;
  }
}

export function OnboardingForm({ onSubmit, initialValues, initialStep }: OnboardingFormProps) {
  const { values, step, direction, errors, submitStatus, submitError, setField, goNext, goPrev, submit } =
    useBirthForm({ initialValues, initialStep });

  const isLast = step === LAST_STEP;
  const isBusy = submitStatus === 'submitting' || submitStatus === 'success';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    if (isLast) {
      void submit(onSubmit);
    } else {
      goNext();
    }
  };

  const primaryLabel = (): string => {
    if (submitStatus === 'submitting') return '별을 모으는 중이에요';
    if (submitStatus === 'success') return '결과로 이동 중이에요';
    return isLast ? '내 별자리 보러 가기' : '다음';
  };

  return (
    <div className="flex flex-col gap-5">
      <Mascot message={MASCOT_MESSAGES[step]} />

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isBusy}
        className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(10,6,40,0.45)] backdrop-blur"
      >
        <div className="mb-5 flex justify-end">
          <StepIndicator current={step} total={TOTAL_STEPS} />
        </div>

        <div className="min-h-[15rem] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <CurrentStep step={step} values={values} errors={errors} setField={setField} />
            </motion.div>
          </AnimatePresence>
        </div>

        {submitStatus === 'error' && (
          <div
            role="alert"
            className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-[#ffb3c7]/40 bg-[#ffb3c7]/10 p-4 text-sm text-[#ffd3df]"
          >
            <p>{submitError}</p>
            <button
              type="button"
              onClick={() => void submit(onSubmit)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 font-medium text-white transition hover:bg-white/20 active:scale-95"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              다시 시도
            </button>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <motion.button
              type="button"
              onClick={goPrev}
              disabled={isBusy}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 px-4 py-3.5 text-sm text-indigo-100 transition hover:bg-white/10 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              이전
            </motion.button>
          )}
          <motion.button
            type="submit"
            disabled={isBusy}
            whileHover={{ scale: isBusy ? 1 : 1.02 }}
            whileTap={{ scale: isBusy ? 1 : 0.96 }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] px-5 py-3.5 font-bold text-[#2a2260] shadow-[0_8px_24px_rgba(255,198,224,0.25)] disabled:opacity-70"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : isLast ? (
              <Sparkles className="h-4 w-4" aria-hidden />
            ) : null}
            {primaryLabel()}
            {!isBusy && !isLast && <ArrowRight className="h-4 w-4" aria-hidden />}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
