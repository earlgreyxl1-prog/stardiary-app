import { BookOpen, Lock } from 'lucide-react';
import { DEEP_CHAPTER_ORDER, DEEP_CHAPTER_PRODUCTS } from '@/lib/deepReport/products';

/**
 * 정밀 차트 맨 아래의 심화 리포트 안내 카드.
 * 2026-11-10 사용자 결정: 심화 리포트는 아직 준비 중이라 눌러도 이동하지 않는다(링크가 아닌 잠긴 카드).
 * 열 때는 이 카드를 `/report/deep` 링크로 되돌린다.
 */
export function DeepReportTeaser() {
  return (
    <div
      role="group"
      aria-disabled="true"
      aria-label="심화 리포트 보기, 아직 준비 중이에요"
      className="flex cursor-not-allowed items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 opacity-70"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-indigo-100">
        <BookOpen className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-bold text-white">
          심화 리포트 보기
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-indigo-100">
            아직 준비 중이에요
          </span>
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-indigo-200/70">
          {DEEP_CHAPTER_ORDER.map((id) => DEEP_CHAPTER_PRODUCTS[id].title).join(' · ')}
        </span>
      </span>
      <Lock className="h-5 w-5 shrink-0 text-indigo-200/60" aria-hidden />
    </div>
  );
}
