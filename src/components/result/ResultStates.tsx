import Link from 'next/link';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';

/** 결과를 불러오는 동안 보여주는 Skeleton. 실제 결과와 같은 배치를 유지한다. */
export function ResultSkeleton() {
  return (
    <div aria-busy="true" aria-label="별자리를 계산하는 중이에요" className="flex flex-col gap-4">
      <div className="mx-auto h-7 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="mx-auto h-4 w-64 animate-pulse rounded-full bg-white/10" />
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-72 animate-pulse rounded-3xl bg-white/10" />
      ))}
      <div className="h-64 animate-pulse rounded-3xl bg-white/10" />
    </div>
  );
}

interface ResultErrorProps {
  onRetry: () => void;
}

export function ResultError({ onRetry }: ResultErrorProps) {
  return (
    <div role="alert" className="rounded-3xl border border-[#ffb3c7]/40 bg-[#ffb3c7]/10 p-6 text-center">
      <p className="font-bold text-white">별자리를 계산하지 못했어요</p>
      <p className="mt-2 text-sm leading-relaxed text-[#ffd3df]">
        네트워크 연결을 확인한 뒤 다시 시도해 주세요. 계속 안 되면 정보를 다시 입력해 주세요.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          다시 시도
        </button>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-sm text-indigo-100 transition hover:bg-white/10 active:scale-95"
        >
          다시 입력하기
        </Link>
      </div>
    </div>
  );
}

export function ResultEmpty() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/20 px-6 py-10 text-center">
      <span aria-hidden className="mascot-float text-5xl">
        🌙
      </span>
      <p className="mt-4 text-lg font-bold text-white">아직 별자리 정보가 없어요</p>
      <p className="mt-2 text-sm leading-relaxed text-indigo-200/80">
        생년월일과 태어난 곳을 알려주면 달토리가 별자리를 찾아줄게요.
      </p>
      <Link
        href="/onboarding"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] px-5 py-3 font-bold text-[#2a2260] shadow-[0_8px_24px_rgba(255,198,224,0.25)] transition hover:scale-[1.02] active:scale-95"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        내 별자리 알아보기
      </Link>
    </div>
  );
}

interface PreviewNoticeProps {
  /** 결과가 입력과 무관한 예시인지 */
  mock: boolean;
  /** 해석 문구가 작가 검수 전 임시 문구인지 */
  draftContent: boolean;
}

/**
 * 아직 정식 결과가 아니라는 안내. 목업 결과이거나 해석 문구가 AI 초안이면 보여준다.
 * 실제 계산 + 작가 납품 문구가 되면 렌더링되지 않는다.
 */
export function PreviewNotice({ mock, draftContent }: PreviewNoticeProps) {
  if (!mock && !draftContent) return null;
  const message = mock
    ? '🧪 미리보기용 예시 결과예요. 실제 계산 기능이 준비되면 입력한 정보로 정확한 별자리를 보여드려요.'
    : '🧪 해석 문구는 검수 전 임시 문구예요. 별자리 계산은 입력한 정보로 한 실제 결과예요.';
  return (
    <p className="rounded-2xl border border-[#ffe9a8]/30 bg-[#ffe9a8]/10 px-4 py-3 text-xs leading-relaxed text-[#fff1c7]">
      {message}
    </p>
  );
}

export function BackToOnboardingLink() {
  return (
    <Link
      href="/onboarding"
      className="inline-flex items-center gap-1 text-sm text-indigo-200/80 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      정보 다시 입력하기
    </Link>
  );
}
