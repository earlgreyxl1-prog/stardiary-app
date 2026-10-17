'use client';

import { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { StarBackground } from '@/components/ui/StarBackground';
import { useSavedBirthInput } from '@/hooks/useSavedBirthInput';
import { saveBirthInput } from '@/lib/birthStorage';
import { stepFromParam, toFormValues } from '@/lib/validators';
import type { BirthInput } from '@/types/birth';

/** 저장된 값을 읽기 전 잠깐 보이는 자리 표시. 실제 폼과 같은 크기를 유지한다. */
function OnboardingSkeleton() {
  return (
    <div aria-busy="true" aria-label="입력 화면을 준비하는 중이에요" className="flex flex-col gap-5">
      <div className="flex items-end gap-3">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-white/10" />
        <div className="h-14 flex-1 animate-pulse rounded-2xl bg-white/10" />
      </div>
      <div className="h-[24rem] animate-pulse rounded-3xl bg-white/10" />
    </div>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saved = useSavedBirthInput();

  const handleSubmit = useCallback(
    async (input: BirthInput): Promise<void> => {
      saveBirthInput(input);
      router.push('/result');
    },
    [router],
  );

  if (!saved.hydrated) return <OnboardingSkeleton />;

  // 결과에서 "?step=time" 등으로 돌아왔다면 저장된 값이 있을 때만 그 단계부터 보여준다.
  const savedInput = saved.input;
  const initialStep = savedInput ? (stepFromParam(searchParams.get('step')) ?? 0) : 0;

  return (
    <OnboardingForm
      onSubmit={handleSubmit}
      initialValues={savedInput ? toFormValues(savedInput) : undefined}
      initialStep={initialStep}
    />
  );
}

export default function OnboardingPage() {
  return (
    <>
      <StarBackground />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">내 별자리 알아보기</h1>
        <Suspense fallback={<OnboardingSkeleton />}>
          <OnboardingContent />
        </Suspense>
      </main>
    </>
  );
}
