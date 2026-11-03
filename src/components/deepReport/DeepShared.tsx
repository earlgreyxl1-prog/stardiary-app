'use client';

import { useId, useState } from 'react';
import { Check, ChevronDown, FlaskConical, Unlock } from 'lucide-react';
import { DEEP_DEV_UNLOCK_AVAILABLE } from '@/hooks/useDeepReportAccess';
import { BODY_BY_ID, glyph } from '@/lib/astro/bodies';
import { deepProduct } from '@/lib/deepReport/products';
import type { DeepEvidence, DeepHighlight, DeepProductId } from '@/types/deepReport';

export const DEEP_CARD = 'rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(10,6,40,0.45)] backdrop-blur';

/** 목업 안내. 해설·점수가 입력한 정보로 만든 결과가 아님을 분명히 한다. */
export function DeepMockNotice() {
  return (
    <p className="flex gap-2 rounded-2xl border border-[#ffe9a8]/30 bg-[#ffe9a8]/10 px-4 py-3 text-xs leading-relaxed text-[#fff1c7]">
      <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        미리보기용 예시 리포트예요. 입력한 정보와 상관없이 예시 차트(1995년 8월 23일 서울)로 손으로 쓴 해설과 점수를 보여드려요.
      </span>
    </p>
  );
}

export function KeywordChips({ keywords }: { keywords: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {keywords.map((keyword) => (
        <li key={keyword} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-50">
          #{keyword}
        </li>
      ))}
    </ul>
  );
}

/** 영향이 큰 천체 TOP 3. 점수는 막대 길이로만 보여주고 숫자는 강조하지 않는다. */
export function HighlightBars({ highlights }: { highlights: DeepHighlight[] }) {
  return (
    <ol className="space-y-4">
      {highlights.map((highlight, index) => (
        <li key={highlight.body}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] text-lg text-[#2a2260]">
              {glyph(BODY_BY_ID[highlight.body].symbol)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">
                <span className="mr-1.5 text-[#ffe9a8]">{index + 1}</span>
                {highlight.title}
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#ffe9a8,#ffc6e0)]" style={{ width: `${highlight.score}%` }} />
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-indigo-100/85">{highlight.reason}</p>
        </li>
      ))}
    </ol>
  );
}

/** 장 본문 앞의 요약 카드: 핵심 포인트를 먼저 보여준다. */
export function ChapterSummaryCard({ points }: { points: string[] }) {
  return (
    <div className="rounded-2xl border border-[#ffe9a8]/20 bg-[#ffe9a8]/[0.06] px-4 py-3.5">
      <p className="text-[11px] font-bold tracking-wide text-[#ffe9a8]">핵심만 먼저</p>
      <ul className="mt-2 space-y-1.5">
        {points.map((point) => (
          <li key={point} className="flex gap-2 text-sm leading-relaxed text-indigo-50">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ffe9a8]" aria-hidden />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** '근거 보기': 해설이 어떤 차트 요소에서 나왔는지 펼쳐 보여준다. */
export function EvidenceToggle({ evidence }: { evidence: DeepEvidence[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-200/80 transition hover:text-white"
      >
        이 해설의 근거 보기
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul id={panelId} className="mt-2 space-y-1.5">
          {evidence.map((item) => (
            <li key={item.label} className="rounded-xl bg-white/5 px-3 py-2 text-xs leading-relaxed">
              <span className="font-bold text-[#ffe9a8]">{item.label}</span>
              <span className="text-indigo-100/80"> · {item.reading}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TipBox({ tip }: { tip: string }) {
  return (
    <div className="rounded-2xl border border-[#ffc6e0]/25 bg-[#ffc6e0]/10 px-4 py-3">
      <p className="text-[11px] font-bold tracking-wide text-[#ffc6e0]">이번 주에 해 볼 것</p>
      <p className="mt-1 text-sm leading-relaxed text-[#ffe4ef]">{tip}</p>
    </div>
  );
}

interface PurchaseActionsProps {
  productId: DeepProductId;
  onDevGrant: (productId: DeepProductId) => void;
}

/**
 * 구매 버튼. 결제가 아직 없어 운영에서는 '준비 중'으로 비활성이고,
 * 개발 환경에서만 이 탭에 구매 기록을 남기는 버튼이 함께 보인다.
 */
export function PurchaseActions({ productId, onDevGrant }: PurchaseActionsProps) {
  const product = deepProduct(productId);
  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        disabled
        className="w-full rounded-2xl bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] px-4 py-2.5 text-sm font-bold text-[#2a2260] opacity-60"
      >
        {product.title} 열기
        <span className="mt-0.5 block text-[11px] font-medium">결제 기능을 준비하고 있어요</span>
      </button>
      {DEEP_DEV_UNLOCK_AVAILABLE && (
        <button
          type="button"
          onClick={() => onDevGrant(productId)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/25 px-3 py-1.5 text-xs text-indigo-100 transition hover:bg-white/10"
        >
          <Unlock className="h-3.5 w-3.5" aria-hidden />
          개발용으로 열기 (운영에서는 보이지 않아요)
        </button>
      )}
    </div>
  );
}
