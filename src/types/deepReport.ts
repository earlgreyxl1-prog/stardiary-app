import type { BodyId } from '@/types/astro';

/**
 * 심화 리포트 (유료). 계산된 차트와 해석 규칙 문서를 바탕으로 AI가 쓰는 긴 해설.
 * 주제(장)별로 따로 사고, 네 장 묶음으로도 산다(lib/deepReport/products.ts).
 * 지금은 목업만 있다(`source: 'mock'`). AI 생성을 붙일 때 같은 타입을 채운다.
 */
export type DeepReportSource = 'mock' | 'ai';

/** 주제별 장. 화면 순서는 DEEP_CHAPTER_ORDER를 따른다. */
export type DeepChapterId = 'self' | 'love' | 'work' | 'growth';

/** 판매 단위: 주제 하나 또는 네 주제 묶음 */
export type DeepProductId = DeepChapterId | 'bundle';

/** 해설의 근거가 된 차트 요소. 화면에서 '근거 보기'로 펼친다. */
export interface DeepEvidence {
  /** 예: '태양 사자자리 · 12하우스' */
  label: string;
  /** 그 요소를 이 장에서 어떻게 읽었는지 한 문장 */
  reading: string;
}

export interface DeepChapter {
  id: DeepChapterId;
  emoji: string;
  title: string;
  /** 장 제목 아래 한 줄 요약 */
  lead: string;
  /** 핵심 포인트 2~3개. 본문 앞 요약 카드에 보여준다. */
  points: string[];
  /** 본문 문단 */
  paragraphs: string[];
  /** 본문에서 가장 강조할 한 문장 (에디토리얼형 인용구) */
  quote: string;
  /** 일상에서 해 볼 수 있는 제안 하나 */
  tip: string;
  evidence: DeepEvidence[];
}

/** 차트에서 영향이 큰 천체. 계산 방식(미결정 10번)이 정해지기 전에는 목업만 쓴다. */
export interface DeepHighlight {
  body: BodyId;
  /** 0~100. 막대 길이로만 쓰고 숫자 자체를 강조하지 않는다. */
  score: number;
  title: string;
  reason: string;
}

export interface DeepReport {
  source: DeepReportSource;
  /** 리포트 첫머리의 한 줄 제목 */
  headline: string;
  /** 전체 요약 2~3문장 */
  summary: string;
  keywords: string[];
  highlights: DeepHighlight[];
  /** 산 장만 들어 있다. 사지 않은 장은 화면이 상품 정보(DEEP_CHAPTER_PRODUCTS)로 잠금 카드를 그린다. */
  chapters: DeepChapter[];
  /** 마무리 문단 */
  closing: string;
}
