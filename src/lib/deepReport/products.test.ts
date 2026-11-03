import { describe, expect, it } from 'vitest';
import {
  DEEP_CHAPTER_ORDER,
  DEEP_CHAPTER_PRODUCTS,
  deepProduct,
  grantProduct,
  normalizeChapters,
  parseOwnedChapters,
  pickOwnedChapters,
} from '@/lib/deepReport/products';
import { MOCK_DEEP_REPORT } from '@/mocks/deepReport';

describe('심화 리포트 상품', () => {
  it('주제 상품은 자기 장 하나, 묶음은 네 장 모두를 연다', () => {
    for (const id of DEEP_CHAPTER_ORDER) expect(deepProduct(id).chapters).toEqual([id]);
    expect(deepProduct('bundle').chapters).toEqual(['self', 'love', 'work', 'growth']);
  });

  it('주제 상품과 목업 장의 제목·이모지가 같다', () => {
    for (const chapter of MOCK_DEEP_REPORT.chapters) {
      expect(DEEP_CHAPTER_PRODUCTS[chapter.id].title).toBe(chapter.title);
      expect(DEEP_CHAPTER_PRODUCTS[chapter.id].emoji).toBe(chapter.emoji);
    }
  });

  it('장 목록은 화면 순서로 정렬하고 중복을 없앤다', () => {
    expect(normalizeChapters(['growth', 'self', 'growth'])).toEqual(['self', 'growth']);
  });

  it('상품을 더하면 가진 장과 합쳐진다', () => {
    expect(grantProduct([], 'work')).toEqual(['work']);
    expect(grantProduct(['work'], 'self')).toEqual(['self', 'work']);
    expect(grantProduct(['love'], 'bundle')).toEqual(['self', 'love', 'work', 'growth']);
  });

  it('저장된 구매 기록은 장 목록으로 좁히고, 형식이 틀리면 빈 목록이다', () => {
    expect(parseOwnedChapters('["love","self"]')).toEqual(['self', 'love']);
    expect(parseOwnedChapters('["love","bundle","money",3]')).toEqual(['love']);
    expect(parseOwnedChapters('')).toEqual([]);
    expect(parseOwnedChapters('not json')).toEqual([]);
    expect(parseOwnedChapters('{"self":true}')).toEqual([]);
    expect(parseOwnedChapters(null)).toEqual([]);
  });

  it('리포트에서 산 장만 화면 순서로 남기고 나머지 내용은 그대로 둔다', () => {
    const picked = pickOwnedChapters(MOCK_DEEP_REPORT, ['growth', 'love']);
    expect(picked.chapters.map((chapter) => chapter.id)).toEqual(['love', 'growth']);
    expect(picked.headline).toBe(MOCK_DEEP_REPORT.headline);
    expect(pickOwnedChapters(MOCK_DEEP_REPORT, []).chapters).toEqual([]);
  });
});
