import type { BigThreeKey, ElementId, ZodiacSignId } from '@/types/astro';

/**
 * 문구 출처. 'ai-draft'는 사람이 검수하기 전 AI 가안이고, 'reviewed'는 사람이 고쳐 확정한 문구다.
 * (작가 협업이 무산되어 2026-10-19 'writer' → 'reviewed'로 바꿨다. 지금은 서비스 운영자가 직접 검수한다.)
 */
export type ContentOrigin = 'ai-draft' | 'reviewed';

/** 태양·달·상승궁 한 칸의 해석 문구. 키워드는 항상 3개다. */
export interface PlacementText {
  /** 카드 앞면 한 줄 제목 (8~16자) */
  headline: string;
  /** 카드 뒷면 본문 (70~95자, 2~3문장) */
  description: string;
  /** 카드 뒷면 #태그 (각 2~7자) */
  keywords: readonly [string, string, string];
}

/** 4원소 막대 아래 코멘트. 어떤 코멘트를 보여줄지는 호출하는 쪽이 정한다. */
export interface ElementCommentSet {
  /** 해당 원소가 강한 편일 때 (40~60자) */
  dominant: Record<ElementId, string>;
  /** 해당 원소가 상대적으로 적은 편일 때 (35~55자) */
  lacking: Record<ElementId, string>;
  /** 네 원소가 고르게 섞였을 때 (60~90자) */
  balanced: string;
}

/** 무료 단계 해석 문구 전체. 키는 `types/astro`의 `BigThreeKey`·`ZodiacSignId`·`ElementId`와 같다. */
export interface FreeStageContent {
  origin: ContentOrigin;
  placements: Record<BigThreeKey, Record<ZodiacSignId, PlacementText>>;
  elements: ElementCommentSet;
}
