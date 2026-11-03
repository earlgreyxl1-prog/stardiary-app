import Link from 'next/link';
import { ArrowLeft, Lock, RefreshCw, Sparkles, Unlock } from 'lucide-react';
import { REPORT_DEV_UNLOCK_AVAILABLE } from '@/hooks/useReportAccess';

/** 리포트를 계산하는 동안 보여주는 Skeleton (실제 배치와 같은 크기) */
export function ReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="정밀 리포트를 계산하는 중이에요" className="flex flex-col gap-4">
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
      <p className="font-bold text-white">정밀 리포트를 만들지 못했어요</p>
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

const INCLUDED = [
  ['네이탈 휠 차트', '태어난 순간의 하늘을 한 장의 원으로'],
  ['행성 10개의 자리', '별자리·도수·역행과 한 줄 해석'],
  ['12하우스', '행성이 힘을 쓰는 삶의 영역'],
  ['행성끼리 맺은 각도', '조화와 긴장, 정확한 순서로'],
] as const;

interface ReportPaywallProps {
  nickname: string;
  onDevUnlock: () => void;
}

/** 잠금 화면. 결제가 아직 없어 운영에서는 '준비 중'만 보이고, 개발 환경에서만 잠금을 풀 수 있다. */
export function ReportPaywall({ nickname, onDevUnlock }: ReportPaywallProps) {
  return (
    <section aria-labelledby="paywall-title" className="rounded-3xl border border-[#ffe9a8]/30 bg-white/5 p-6 text-center backdrop-blur">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] text-[#2a2260]">
        <Lock className="h-6 w-6" aria-hidden />
      </span>
      <h1 id="paywall-title" className="mt-4 text-xl font-bold text-white">
        {nickname}님의 정밀 리포트
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-indigo-200/80">
        무료 결과보다 한 걸음 더 들어가, 태어난 순간의 하늘 전체를 보여드려요.
      </p>
      <ul className="mt-5 space-y-2 text-left">
        {INCLUDED.map(([title, description]) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-white/5 px-4 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ffe9a8]" aria-hidden />
            <span>
              <span className="block text-sm font-bold text-white">{title}</span>
              <span className="block text-xs text-indigo-200/70">{description}</span>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-2xl bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] px-5 py-3 font-bold text-[#2a2260] opacity-60"
      >
        정밀 리포트 열기
        <span className="mt-0.5 block text-xs font-medium">결제 기능을 준비하고 있어요</span>
      </button>
      {REPORT_DEV_UNLOCK_AVAILABLE && (
        <button
          type="button"
          onClick={onDevUnlock}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-white/25 px-4 py-2 text-xs text-indigo-100 transition hover:bg-white/10"
        >
          <Unlock className="h-3.5 w-3.5" aria-hidden />
          개발용 잠금 해제 (운영에서는 보이지 않아요)
        </button>
      )}
      <div className="mt-5">
        <Link href="/result" className="inline-flex items-center gap-1 text-sm text-indigo-200/80 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          무료 결과로 돌아가기
        </Link>
      </div>
    </section>
  );
}
