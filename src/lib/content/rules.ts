/**
 * 무료 단계 해석 문구 규칙 (작가 의뢰서 초안 기준, CLAUDE.md 8번 · docs/content-brief-elements.md).
 * 글자 수는 공백·문장부호를 포함한 글자(코드 포인트) 수다. 서비스가 최종 확정한 값이 아니므로 바뀌면 여기만 고친다.
 */
export interface LengthRange {
  min: number;
  max: number;
}

export const CONTENT_RULES = {
  placement: {
    headline: { min: 8, max: 16 },
    description: { min: 70, max: 95 },
    keywordCount: 3,
    keyword: { min: 2, max: 7 },
    /** 본문 문장 수 (권장, 어기면 경고) */
    sentences: { min: 2, max: 3 },
  },
  element: {
    dominant: { min: 40, max: 60 },
    lacking: { min: 35, max: 55 },
    balanced: { min: 60, max: 90 },
  },
} as const;

/** 제목에 쓰지 않는 말 (별자리 이름은 따로 검사한다) */
export const HEADLINE_FORBIDDEN = ['당신'] as const;

/**
 * 원소 코멘트에 쓰지 않는 표현 (경고). 동점일 때나 적은 편 코멘트가 이어 붙을 때 어색해지는 표현이다.
 * '가장 편한'처럼 문제없는 쓰임도 있어 막지 않고 경고만 한다.
 */
export const ELEMENT_DISCOURAGED: Record<'dominant' | 'lacking' | 'balanced', readonly string[]> = {
  dominant: ['가장', '압도적', '무엇보다'],
  lacking: ['가장 적', '전혀 없', '부족'],
  balanced: [],
};

/** 출처 칸이 이것으로 시작하면 작가 납품물이 아니라 AI 예시 행이다(시트에 sun.leo, element.fire.dominant 두 줄이 있다). */
export const AI_SOURCE_PREFIX = 'ai';

export const textLength = (text: string): number => [...text].length;
