import { describe, expect, it } from 'vitest';
import { hasFinalConsonant, joinWithAnd, josa, withJosa } from '@/lib/text/korean';

describe('조사', () => {
  it('받침 유무를 마지막 한글 글자로 판단한다', () => {
    expect(hasFinalConsonant('불')).toBe(true);
    expect(hasFinalConsonant('흙')).toBe(true);
    expect(hasFinalConsonant('바다')).toBe(false);
    expect(hasFinalConsonant('MC')).toBe(false);
    expect(hasFinalConsonant('')).toBe(false);
  });

  it('받침에 맞는 조사를 고른다', () => {
    expect(withJosa('불', '과/와')).toBe('불과');
    expect(withJosa('바다', '과/와')).toBe('바다와');
    expect(josa('물', '이에요/예요')).toBe('이에요');
    expect(josa('바다', '이에요/예요')).toBe('예요');
    expect(josa('바람', '이/가')).toBe('이');
  });
});

describe('joinWithAnd', () => {
  const item = (word: string) => ({ label: word, word });

  it('하나·둘·셋', () => {
    expect(joinWithAnd([item('불')])).toBe('불');
    expect(joinWithAnd([item('불'), item('흙')])).toBe('불과 흙');
    expect(joinWithAnd([item('흙'), item('바람'), item('물')])).toBe('흙, 바람과 물');
    expect(joinWithAnd([item('바다'), item('산')])).toBe('바다와 산');
  });

  it('보이는 모양(label)과 조사 기준(word)이 다를 수 있다', () => {
    expect(joinWithAnd([{ label: '🔥 불', word: '불' }, { label: '🌿 흙', word: '흙' }])).toBe('🔥 불과 🌿 흙');
  });

  it('비어 있으면 빈 문자열', () => {
    expect(joinWithAnd([])).toBe('');
  });
});
