import Link from 'next/link';
import { ChevronRight, Orbit } from 'lucide-react';

/** 무료 결과 화면 아래의 정밀 차트 안내 카드. 정밀 차트도 무료다. */
export function ReportTeaser() {
  return (
    <Link
      href="/report"
      className="group flex items-center gap-4 rounded-3xl border border-[#ffe9a8]/30 bg-[linear-gradient(135deg,rgba(255,233,168,0.12),rgba(255,198,224,0.08))] p-5 transition hover:border-[#ffe9a8]/60 active:scale-[0.99]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] text-[#2a2260]">
        <Orbit className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-white">
          정밀 차트 보기
          <span className="ml-1.5 rounded-full bg-white/15 px-2 py-0.5 align-middle text-[11px] font-medium text-[#ffe9a8]">무료</span>
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-indigo-200/80">
          네이탈 휠 차트 · 행성 10개의 자리 · 12하우스 · 행성끼리 맺은 각도
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-indigo-200/70 transition group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
