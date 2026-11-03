'use client';

import { Lock, RotateCcw } from 'lucide-react';
import { BackToChartLink } from '@/components/deepReport/DeepReportStates';
import {
  ChapterSummaryCard,
  DEEP_CARD,
  DeepMockNotice,
  EvidenceToggle,
  HighlightBars,
  KeywordChips,
  PurchaseActions,
  TipBox,
} from '@/components/deepReport/DeepShared';
import { DEEP_DEV_UNLOCK_AVAILABLE } from '@/hooks/useDeepReportAccess';
import { DEEP_CHAPTER_ORDER, DEEP_CHAPTER_PRODUCTS } from '@/lib/deepReport/products';
import type { DeepChapter, DeepChapterId, DeepProductId, DeepReport } from '@/types/deepReport';

interface DeepReportViewProps {
  report: DeepReport;
  nickname: string;
  owned: DeepChapterId[];
  onDevGrant: (productId: DeepProductId) => void;
  onDevReset: () => void;
}

function chapterNumber(id: DeepChapterId): string {
  return String(DEEP_CHAPTER_ORDER.indexOf(id) + 1).padStart(2, '0');
}

function ChapterHeading({ id, title, emoji, lead, locked }: { id: DeepChapterId; title: string; emoji: string; lead: string; locked: boolean }) {
  return (
    <div className="flex items-end gap-3 border-b border-white/10 pb-3">
      <span
        className={`text-5xl leading-none font-bold ${
          locked ? 'text-white/20' : 'bg-[linear-gradient(135deg,#ffe9a8,#ffc6e0)] bg-clip-text text-transparent'
        }`}
      >
        {chapterNumber(id)}
      </span>
      <div className="min-w-0">
        <h2 id={`deep-${id}`} className="text-xl font-bold text-white">
          {emoji} {title}
        </h2>
        <p className="mt-0.5 text-sm text-indigo-200/80">{lead}</p>
      </div>
    </div>
  );
}

function OwnedChapter({ chapter }: { chapter: DeepChapter }) {
  return (
    <section id={`chapter-${chapter.id}`} aria-labelledby={`deep-${chapter.id}`} className="scroll-mt-6">
      <ChapterHeading id={chapter.id} title={chapter.title} emoji={chapter.emoji} lead={chapter.lead} locked={false} />

      <div className="mt-4">
        <ChapterSummaryCard points={chapter.points} />
      </div>

      <div className="mt-5 space-y-4 text-[15px] leading-[1.8] text-indigo-50/90">
        {chapter.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <blockquote className="my-6 border-l-2 border-[#ffe9a8] pl-4 text-lg leading-relaxed font-bold text-[#fff1c7]">
        {chapter.quote}
      </blockquote>

      <div className="space-y-3">
        <TipBox tip={chapter.tip} />
        <EvidenceToggle evidence={chapter.evidence} />
      </div>
    </section>
  );
}

function LockedChapter({ id, onDevGrant }: { id: DeepChapterId; onDevGrant: (productId: DeepProductId) => void }) {
  const product = DEEP_CHAPTER_PRODUCTS[id];
  return (
    <section id={`chapter-${id}`} aria-labelledby={`deep-${id}`} className="scroll-mt-6">
      <ChapterHeading id={id} title={product.title} emoji={product.emoji} lead={product.description} locked />
      <div className={`${DEEP_CARD} mt-4 text-center`}>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-indigo-100">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-3 text-sm leading-relaxed text-indigo-200/80">이 장은 아직 열지 않았어요. 이 주제만 따로 열 수 있어요.</p>
        <div className="mt-4">
          <PurchaseActions productId={id} onDevGrant={onDevGrant} />
        </div>
      </div>
    </section>
  );
}

/**
 * 심화 리포트 (2026-11-03 사용자 결정: '읽는 리포트' 형식 + 요약 카드).
 * 표지 → 한눈에 보기(장별 한 줄 요약·목차) → 힘센 별 → 장(번호·요약 카드·긴 글·인용구·제안·근거) → 맺음말.
 * 사지 않은 장은 같은 자리에 잠금 카드로 보여준다.
 */
export function DeepReportView({ report, nickname, owned, onDevGrant, onDevReset }: DeepReportViewProps) {
  const chapterById = new Map(report.chapters.map((chapter) => [chapter.id, chapter]));
  const ownsAll = DEEP_CHAPTER_ORDER.every((id) => owned.includes(id));

  return (
    <article className="flex flex-col gap-6">
      {report.source === 'mock' && <DeepMockNotice />}

      <header className="rounded-3xl bg-[linear-gradient(160deg,rgba(255,233,168,0.16),rgba(255,198,224,0.08)_45%,rgba(255,255,255,0.03))] p-6">
        <p className="text-xs font-bold tracking-[0.2em] text-[#ffe9a8]">DEEP REPORT</p>
        <p className="mt-3 text-sm text-indigo-200/80">{nickname}님의 하늘을 읽었어요</p>
        <h1 className="mt-1 text-2xl leading-snug font-bold text-white">{report.headline}</h1>
        <p className="mt-4 text-sm leading-relaxed text-indigo-100/90">{report.summary}</p>
        <div className="mt-5">
          <KeywordChips keywords={report.keywords} />
        </div>
      </header>

      <nav aria-labelledby="deep-overview" className={DEEP_CARD}>
        <div className="flex items-baseline justify-between">
          <h2 id="deep-overview" className="text-base font-bold text-white">
            한눈에 보기
          </h2>
          <span className="text-[11px] text-indigo-200/60">
            {owned.length}/{DEEP_CHAPTER_ORDER.length}장 열림
          </span>
        </div>
        <ol className="mt-3 divide-y divide-white/10">
          {DEEP_CHAPTER_ORDER.map((id) => {
            const chapter = chapterById.get(id);
            const product = DEEP_CHAPTER_PRODUCTS[id];
            return (
              <li key={id}>
                <a href={`#chapter-${id}`} className="group flex gap-3 py-3 transition">
                  <span className={`w-6 shrink-0 text-sm font-bold ${chapter ? 'text-[#ffe9a8]' : 'text-white/30'}`}>{chapterNumber(id)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-white underline-offset-4 group-hover:underline">
                      {product.emoji} {product.title}
                      {!chapter && <Lock className="h-3.5 w-3.5 text-indigo-200/60" aria-label="잠김" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-indigo-200/75">
                      {chapter ? chapter.lead : '아직 열지 않은 장이에요'}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      <section aria-labelledby="deep-highlights" className={DEEP_CARD}>
        <h2 id="deep-highlights" className="text-lg font-bold text-white">
          내 차트에서 힘이 센 별
        </h2>
        <p className="mt-1 text-xs text-indigo-200/70">점수 계산 방식은 정하는 중이에요. 지금은 예시 값이에요.</p>
        <div className="mt-4">
          <HighlightBars highlights={report.highlights} />
        </div>
      </section>

      {DEEP_CHAPTER_ORDER.map((id) => {
        const chapter = chapterById.get(id);
        return chapter ? <OwnedChapter key={id} chapter={chapter} /> : <LockedChapter key={id} id={id} onDevGrant={onDevGrant} />;
      })}

      {!ownsAll && (
        <section aria-labelledby="deep-bundle-upsell" className="rounded-3xl border border-[#ffe9a8]/40 bg-[#ffe9a8]/[0.07] p-5 text-center">
          <h2 id="deep-bundle-upsell" className="font-bold text-white">
            남은 장도 한 번에 열 수 있어요
          </h2>
          <p className="mt-1 text-sm text-indigo-100/85">네 주제를 모두 열면 처음부터 끝까지 이어서 읽을 수 있어요.</p>
          <div className="mt-4">
            <PurchaseActions productId="bundle" onDevGrant={onDevGrant} />
          </div>
        </section>
      )}

      <footer className={`${DEEP_CARD} text-center`}>
        <p className="text-2xl" aria-hidden>
          🌙
        </p>
        <p className="mt-2 text-sm leading-relaxed text-indigo-100/90">{report.closing}</p>
      </footer>

      <div className="flex flex-col items-center gap-3">
        <BackToChartLink />
        {DEEP_DEV_UNLOCK_AVAILABLE && (
          <button
            type="button"
            onClick={onDevReset}
            className="inline-flex items-center gap-1 text-xs text-indigo-200/50 transition hover:text-indigo-100"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            개발용: 구매 기록 지우기
          </button>
        )}
      </div>
    </article>
  );
}
