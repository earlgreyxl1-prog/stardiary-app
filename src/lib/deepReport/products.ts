import type { DeepChapter, DeepChapterId, DeepProductId, DeepReport } from '@/types/deepReport';

/**
 * 심화 리포트 상품 (2026-11-03 사용자 결정: 정밀 차트는 무료, 심화 리포트는 주제별 낱개 + 네 주제 묶음).
 * 가격·결제 수단은 아직 정하지 않았다. 정하면 여기에 가격을 더하고, 구매 확인은 서버에서 한다.
 * 설명 문구는 사기 전에 보여주는 것이라 개인 차트와 무관한 일반 소개다.
 */
export const DEEP_CHAPTER_ORDER: readonly DeepChapterId[] = ['self', 'love', 'work', 'growth'];

export interface DeepProduct {
  id: DeepProductId;
  emoji: string;
  title: string;
  description: string;
  /** 사면 열리는 장 */
  chapters: readonly DeepChapterId[];
}

export const DEEP_CHAPTER_PRODUCTS: Record<DeepChapterId, DeepProduct> = {
  self: {
    id: 'self',
    emoji: '🌞',
    title: '나라는 사람',
    description: '겉으로 보이는 나와 속마음, 에너지를 채우는 방식을 깊게 읽어요.',
    chapters: ['self'],
  },
  love: {
    id: 'love',
    emoji: '💗',
    title: '사랑과 관계',
    description: '마음을 표현하는 방식, 편안한 관계의 모양, 관계에서 지치는 지점을 짚어요.',
    chapters: ['love'],
  },
  work: {
    id: 'work',
    emoji: '🧭',
    title: '일과 방향',
    description: '잘 맞는 일의 결, 강점이 드러나는 역할, 일하는 리듬을 살펴요.',
    chapters: ['work'],
  },
  growth: {
    id: 'growth',
    emoji: '🌱',
    title: '성장 포인트',
    description: '마음이 흔들리는 패턴과, 그 힘을 성장으로 바꾸는 법을 담아요.',
    chapters: ['growth'],
  },
};

export const DEEP_BUNDLE_PRODUCT: DeepProduct = {
  id: 'bundle',
  emoji: '✨',
  title: '네 주제 모두',
  description: '네 장을 한 번에 열어요. 나라는 사람부터 성장 포인트까지 이어서 읽을 수 있어요.',
  chapters: DEEP_CHAPTER_ORDER,
};

export function deepProduct(id: DeepProductId): DeepProduct {
  return id === 'bundle' ? DEEP_BUNDLE_PRODUCT : DEEP_CHAPTER_PRODUCTS[id];
}

export function isDeepChapterId(value: unknown): value is DeepChapterId {
  return typeof value === 'string' && (DEEP_CHAPTER_ORDER as readonly string[]).includes(value);
}

/** 장 목록을 화면 순서로 정렬하고 중복을 없앤다. */
export function normalizeChapters(chapters: Iterable<DeepChapterId>): DeepChapterId[] {
  const owned = new Set(chapters);
  return DEEP_CHAPTER_ORDER.filter((id) => owned.has(id));
}

/** 이미 가진 장에 상품을 더한 결과 */
export function grantProduct(owned: readonly DeepChapterId[], productId: DeepProductId): DeepChapterId[] {
  return normalizeChapters([...owned, ...deepProduct(productId).chapters]);
}

/** 저장된 구매 기록(외부 입력)을 장 목록으로 좁힌다. 모르는 값은 버린다. */
export function parseOwnedChapters(raw: unknown): DeepChapterId[] {
  if (typeof raw !== 'string' || raw === '') return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return normalizeChapters(parsed.filter(isDeepChapterId));
}

/** 리포트에서 산 장만 남긴다. 장 순서는 DEEP_CHAPTER_ORDER를 따른다. */
export function pickOwnedChapters(report: DeepReport, owned: readonly DeepChapterId[]): DeepReport {
  const byId = new Map<DeepChapterId, DeepChapter>(report.chapters.map((chapter) => [chapter.id, chapter]));
  const chapters = normalizeChapters(owned)
    .map((id) => byId.get(id))
    .filter((chapter): chapter is DeepChapter => chapter !== undefined);
  return { ...report, chapters };
}
