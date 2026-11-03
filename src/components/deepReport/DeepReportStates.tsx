'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { DEEP_CARD, DeepMockNotice, PurchaseActions } from '@/components/deepReport/DeepShared';
import { DEEP_BUNDLE_PRODUCT, DEEP_CHAPTER_ORDER, DEEP_CHAPTER_PRODUCTS } from '@/lib/deepReport/products';
import type { DeepProductId } from '@/types/deepReport';

/** 심화 리포트를 불러오는 동안 보여주는 Skeleton (표지 → 요약 카드 → 장) */
export function DeepReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="심화 리포트를 불러오는 중이에요" className="flex flex-col gap-5">
      <div className="h-56 animate-pulse rounded-3xl bg-white/10" />
      <div className="h-48 animate-pulse rounded-3xl bg-white/10" />
      <div className="h-96 animate-pulse rounded-3xl bg-white/10" />
    </div>
  );
}

export function DeepReportErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-3xl border border-[#ffb3c7]/40 bg-[#ffb3c7]/10 p-6 text-center">
      <p className="font-bold text-white">심화 리포트를 불러오지 못했어요</p>
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
          href="/report"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-sm text-indigo-100 transition hover:bg-white/10 active:scale-95"
        >
          정밀 차트로 가기
        </Link>
      </div>
    </div>
  );
}

const INCLUDED_IN_CHAPTER = ['핵심 요약 카드', '깊게 읽는 해설', '이번 주에 해 볼 것', '해설의 근거'] as const;

export function BackToChartLink() {
  return (
    <Link href="/report" className="mx-auto inline-flex items-center gap-1 text-sm text-indigo-200/80 transition hover:text-white">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      정밀 차트로 돌아가기
    </Link>
  );
}

interface DeepReportStoreProps {
  nickname: string;
  onDevGrant: (productId: DeepProductId) => void;
}

/** 산 장이 없을 때: 주제를 하나씩 또는 네 개 묶음으로 고른다. 사기 전이라 개인 해설은 보여주지 않는다. */
export function DeepReportStore({ nickname, onDevGrant }: DeepReportStoreProps) {
  return (
    <div className="flex flex-col gap-5">
      <DeepMockNotice />

      <header className="rounded-3xl bg-[linear-gradient(160deg,rgba(255,233,168,0.16),rgba(255,198,224,0.08)_45%,rgba(255,255,255,0.03))] p-6">
        <p className="text-xs font-bold tracking-[0.2em] text-[#ffe9a8]">DEEP REPORT</p>
        <h1 className="mt-3 text-2xl leading-snug font-bold text-white">{nickname}님의 하늘을 주제별로 깊게 읽어 드려요</h1>
        <p className="mt-3 text-sm leading-relaxed text-indigo-100/90">
          정밀 차트를 바탕으로 AI가 장마다 긴 해설을 써요. 궁금한 주제만 골라 열 수 있어요.
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {INCLUDED_IN_CHAPTER.map((item) => (
            <li key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-50">
              {item}
            </li>
          ))}
        </ul>
      </header>

      <section aria-labelledby="deep-bundle" className="rounded-3xl border border-[#ffe9a8]/40 bg-[#ffe9a8]/[0.07] p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            {DEEP_BUNDLE_PRODUCT.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="deep-bundle" className="text-base font-bold text-white">
              {DEEP_BUNDLE_PRODUCT.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-indigo-100/85">{DEEP_BUNDLE_PRODUCT.description}</p>
          </div>
        </div>
        <div className="mt-4">
          <PurchaseActions productId="bundle" onDevGrant={onDevGrant} />
        </div>
      </section>

      <section aria-labelledby="deep-chapters" className="flex flex-col gap-3">
        <h2 id="deep-chapters" className="px-1 text-sm font-bold text-indigo-100">
          주제 하나씩 고르기
        </h2>
        {DEEP_CHAPTER_ORDER.map((id, index) => {
          const product = DEEP_CHAPTER_PRODUCTS[id];
          return (
            <article key={id} className={DEEP_CARD}>
              <div className="flex items-start gap-3">
                <span className="w-7 shrink-0 text-lg font-bold text-[#ffe9a8]">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white">
                    {product.emoji} {product.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-indigo-200/80">{product.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <PurchaseActions productId={id} onDevGrant={onDevGrant} />
              </div>
            </article>
          );
        })}
      </section>

      <BackToChartLink />
    </div>
  );
}
