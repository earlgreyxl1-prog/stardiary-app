/**
 * 한국어 조사 붙이기. 마지막 글자의 받침 유무로 고른다(한글이 아니면 받침 없음으로 본다).
 * 예: withJosa('불', '과/와') → '불과', withJosa('바다', '과/와') → '바다와'
 */
export type JosaPair = '과/와' | '이/가' | '은/는' | '을/를' | '이에요/예요' | '아/야' | '이야/야';

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

export function hasFinalConsonant(word: string): boolean {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (Number.isNaN(code) || code < HANGUL_START || code > HANGUL_END) return false;
  return (code - HANGUL_START) % 28 !== 0;
}

export function josa(word: string, pair: JosaPair): string {
  const [withConsonant, withoutConsonant] = pair.split('/');
  return hasFinalConsonant(word) ? withConsonant : withoutConsonant;
}

export function withJosa(word: string, pair: JosaPair): string {
  return `${word}${josa(word, pair)}`;
}

/**
 * 낱말을 '와/과'로 잇는다. 셋 이상이면 앞은 쉼표로: ['흙', '바람', '물'] → '흙, 바람과 물'
 * label은 화면에 보일 모양(예: 이모지를 붙인 '🍃 바람'), 조사는 마지막 낱말(word) 기준이다.
 */
export function joinWithAnd(items: ReadonlyArray<{ label: string; word: string }>): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0].label;
  const head = items.slice(0, -2).map((item) => `${item.label}, `).join('');
  const [beforeLast, last] = items.slice(-2);
  return `${head}${beforeLast.label}${josa(beforeLast.word, '과/와')} ${last.label}`;
}
