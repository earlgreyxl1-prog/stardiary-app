import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

/** 리포트를 계산하는 동안 보여주는 Skeleton (실제 배치와 같은 크기) */
export function ReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="정밀 차트를 계산하는 중이에요" className="flex flex-col gap-4">
      <div className="mx-auto h-7 w-52 animate-pulse rounded-full bg-white/10" />
      <div className="mx-auto aspect-square w-full max-w-[340px] animate-pulse rounded-full bg-white/10" />
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-64 animate-pulse rounded-3xl bg-white/10" />
      ))}
    </div>
  );
}

export function ReportError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-3xl border border-[#ffb3c7]/40 bg-[#ffb3c7]/10 p-6 text-center">
      <p className="font-bold text-white">정밀 차트를 만들지 못했어요</p>
      <p className="mt-2 text-sm leading-relaxed text-[#ffd3df]">{message}</p>
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
