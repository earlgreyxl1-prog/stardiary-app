import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import { DEEP_CHAPTER_ORDER, DEEP_CHAPTER_PRODUCTS } from '@/lib/deepReport/products';

/** 정밀 차트 맨 아래의 심화 리포트 안내 카드 */
export function DeepReportTeaser() {
  return (
    <Link
      href="/report/deep"
      className="group flex items-center gap-4 rounded-3xl border border-[#ffe9a8]/30 bg-[linear-gradient(135deg,rgba(255,233,168,0.12),rgba(255,198,224,0.08))] p-5 transition hover:border-[#ffe9a8]/60 active:scale-[0.99]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] text-[#2a2260]">
        <BookOpen className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-white">심화 리포트 보기</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-indigo-200/80">
          {DEEP_CHAPTER_ORDER.map((id) => DEEP_CHAPTER_PRODUCTS[id].title).join(' · ')} — 주제별로 골라 열어요
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-indigo-200/70 transition group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
