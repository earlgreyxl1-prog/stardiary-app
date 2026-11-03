import {
  AI_SOURCE_PREFIX,
  CONTENT_RULES,
  ELEMENT_DISCOURAGED,
  HEADLINE_FORBIDDEN,
  textLength,
  type LengthRange,
} from '@/lib/content/rules';
import { ELEMENTS, ZODIAC_ORDER, ZODIAC_SIGNS } from '@/lib/astro/zodiac';
import type { BigThreeKey, ElementId, ZodiacSignId } from '@/types/astro';
import type { ContentOrigin, ElementCommentSet, FreeStageContent, PlacementText } from '@/types/content';

/**
 * 문구 편집 시트(CSV로 내보낸 것) → 무료 단계 해석 문구(FreeStageContent) 변환·검사.
 * 편집 시트: docs/content/free-stage-draft.xlsx (AI 가안을 사람이 고쳐 출처를 '검수'로 바꾼다).
 * 시트 키: sun.{sign} · moon.{sign} · rising.{sign} · element.{fire|earth|air|water}.{dominant|lacking} · element.balanced
 * ({sign}은 ZodiacSignId와 같다). 모두 45행.
 */

export interface ContentIssue {
  /** error는 변환을 막고, warning은 알려만 준다. */
  level: 'error' | 'warning';
  key: string;
  message: string;
}

export interface ConversionResult {
  /** error가 하나라도 있으면 null */
  content: FreeStageContent | null;
  issues: ContentIssue[];
}

const BIG_THREE: readonly BigThreeKey[] = ['sun', 'moon', 'rising'];
const ELEMENT_IDS: readonly ElementId[] = ELEMENTS.map((element) => element.id);

/** 시트에 있어야 하는 키 45개 (순서는 출력 파일 순서) */
export const CONTENT_KEYS: readonly string[] = [
  ...BIG_THREE.flatMap((kind) => ZODIAC_ORDER.map((sign) => `${kind}.${sign}`)),
  ...ELEMENT_IDS.map((id) => `element.${id}.dominant`),
  ...ELEMENT_IDS.map((id) => `element.${id}.lacking`),
  'element.balanced',
];

/** 시트 머리글 → 의미. 한글·영문 머리글을 모두 받는다(대소문자·공백 무시). */
const HEADER_ALIASES = {
  key: ['키', 'key', 'id'],
  headline: ['제목', 'headline', 'title'],
  description: ['해석', '본문', '설명', 'description'],
  keywords: ['키워드', 'keywords', '태그'],
  keyword1: ['키워드1', 'keyword1'],
  keyword2: ['키워드2', 'keyword2'],
  keyword3: ['키워드3', 'keyword3'],
  comment: ['코멘트', '문구', '원소코멘트', 'comment', 'text'],
  source: ['출처', 'source'],
} as const;
type HeaderField = keyof typeof HEADER_ALIASES;

const normalizeHeader = (header: string) => header.replace(/\s+/g, '').toLowerCase();

interface Columns {
  headerRow: number;
  index: Partial<Record<HeaderField, number>>;
}

function findColumns(table: string[][]): Columns | null {
  for (let row = 0; row < Math.min(table.length, 10); row += 1) {
    const index: Partial<Record<HeaderField, number>> = {};
    table[row].forEach((cell, column) => {
      const header = normalizeHeader(cell);
      for (const field of Object.keys(HEADER_ALIASES) as HeaderField[]) {
        if (index[field] === undefined && HEADER_ALIASES[field].some((alias) => normalizeHeader(alias) === header)) {
          index[field] = column;
        }
      }
    });
    if (index.key !== undefined) return { headerRow: row, index };
  }
  return null;
}

function checkLength(issues: ContentIssue[], key: string, label: string, text: string, range: LengthRange): void {
  const length = textLength(text);
  if (length < range.min || length > range.max) {
    issues.push({ level: 'error', key, message: `${label} ${length}자 — ${range.min}~${range.max}자여야 해요` });
  }
}

function countSentences(text: string): number {
  return text.split(/(?<=[.!?…])\s+/).filter((sentence) => sentence.trim() !== '').length;
}

/** 이미 만들어진 문구(검수본·AI 가안 모두)를 규칙으로 검사한다. */
export function validateFreeStageContent(content: FreeStageContent): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const rules = CONTENT_RULES.placement;

  for (const kind of BIG_THREE) {
    for (const sign of ZODIAC_ORDER) {
      const key = `${kind}.${sign}`;
      const text = content.placements[kind][sign];
      checkLength(issues, key, '제목', text.headline, rules.headline);
      checkLength(issues, key, '해석', text.description, rules.description);

      // 별자리 이름(사자자리)과 2자 이상 어간(사자, 물고기)을 막는다. '게'·'양' 같은 한 글자 어간은
      // '즐겁게'·'다양한'처럼 흔한 말에 걸리므로 검사하지 않는다.
      const signName = ZODIAC_SIGNS[sign].nameKo;
      const signStem = signName.replace(/자리$/, '');
      const forbidden = [signName, ...(textLength(signStem) >= 2 ? [signStem] : []), ...HEADLINE_FORBIDDEN];
      for (const word of forbidden) {
        if (text.headline.includes(word)) issues.push({ level: 'error', key, message: `제목에 '${word}'를 쓰지 않아요` });
      }

      // 시트에서 키워드가 모자라면 빈 칸('')으로 채워 오므로, 빈 칸을 뺀 개수로 센다.
      const keywords = text.keywords.filter((keyword) => keyword !== '');
      if (keywords.length !== rules.keywordCount) {
        issues.push({ level: 'error', key, message: `키워드가 ${keywords.length}개 — ${rules.keywordCount}개여야 해요` });
      }
      keywords.forEach((keyword, index) => checkLength(issues, key, `키워드${index + 1}`, keyword, rules.keyword));

      const sentences = countSentences(text.description);
      if (sentences < rules.sentences.min || sentences > rules.sentences.max) {
        issues.push({ level: 'warning', key, message: `해석이 ${sentences}문장 — ${rules.sentences.min}~${rules.sentences.max}문장을 권장해요` });
      }
    }
  }

  const checkElement = (key: string, text: string, kind: 'dominant' | 'lacking' | 'balanced') => {
    checkLength(issues, key, '코멘트', text, CONTENT_RULES.element[kind]);
    for (const phrase of ELEMENT_DISCOURAGED[kind]) {
      if (text.includes(phrase)) {
        issues.push({ level: 'warning', key, message: `'${phrase}' 표현은 동점·이어 붙이기에서 어색할 수 있어요` });
      }
    }
    if (/\d|%/.test(text)) issues.push({ level: 'warning', key, message: '숫자·퍼센트는 문장에 넣지 않아요(막대그래프가 보여줘요)' });
  };
  for (const id of ELEMENT_IDS) {
    checkElement(`element.${id}.dominant`, content.elements.dominant[id], 'dominant');
    checkElement(`element.${id}.lacking`, content.elements.lacking[id], 'lacking');
  }
  checkElement('element.balanced', content.elements.balanced, 'balanced');

  return issues;
}

/** CSV 표(머리글 포함)를 FreeStageContent로 바꾸고 검사한다. */
export function convertContentTable(table: string[][], origin: ContentOrigin = 'reviewed'): ConversionResult {
  const issues: ContentIssue[] = [];
  const columns = findColumns(table);
  // 엑셀에서 'CSV(쉼표로 분리)'로 저장하면 한글이 CP949로 저장되어 UTF-8로 읽을 때 깨진다(U+FFFD).
  if (table.some((row) => row.some((cell) => cell.includes('�')))) {
    return {
      content: null,
      issues: [
        {
          level: 'error',
          key: '-',
          message: "한글이 깨져 있어요. 엑셀에서 '다른 이름으로 저장 → CSV UTF-8(쉼표로 분리)(*.csv)'로 다시 저장해 주세요",
        },
      ],
    };
  }
  if (!columns) {
    const found = (table[0] ?? []).join(', ') || '(비어 있음)';
    return {
      content: null,
      issues: [{ level: 'error', key: '-', message: `'키' 머리글을 찾지 못했어요. 찾은 머리글: ${found}` }],
    };
  }

  const cell = (row: string[], field: HeaderField) => {
    const column = columns.index[field];
    return column === undefined ? '' : (row[column] ?? '').trim();
  };

  const rowsByKey = new Map<string, string[]>();
  for (const row of table.slice(columns.headerRow + 1)) {
    const key = cell(row, 'key');
    if (key === '') continue;
    if (!CONTENT_KEYS.includes(key)) {
      issues.push({ level: 'error', key, message: '알 수 없는 키예요' });
      continue;
    }
    if (rowsByKey.has(key)) {
      issues.push({ level: 'error', key, message: '같은 키가 두 번 있어요' });
      continue;
    }
    if (cell(row, 'source').toLowerCase().startsWith(AI_SOURCE_PREFIX)) {
      issues.push({ level: 'error', key, message: `출처가 '${cell(row, 'source')}' — 아직 검수하지 않은 AI 가안이에요. 문구를 확인·수정한 뒤 출처를 '검수'로 바꿔 주세요` });
    }
    rowsByKey.set(key, row);
  }
  for (const key of CONTENT_KEYS) {
    if (!rowsByKey.has(key)) issues.push({ level: 'error', key, message: '시트에 이 키가 없어요' });
  }

  // 키가 아예 없으면 '시트에 이 키가 없어요' 하나만 알리고, 빈 칸 오류는 겹쳐 내지 않는다.
  const required = (key: string, label: string, value: string): string => {
    if (value === '' && rowsByKey.has(key)) issues.push({ level: 'error', key, message: `${label} 칸이 비어 있어요` });
    return value;
  };

  const placementText = (key: string): PlacementText => {
    const row = rowsByKey.get(key) ?? [];
    const separate = [cell(row, 'keyword1'), cell(row, 'keyword2'), cell(row, 'keyword3')].filter((word) => word !== '');
    const keywords =
      separate.length > 0
        ? separate
        : cell(row, 'keywords')
            .split(/[,·/#\n]+/)
            .map((word) => word.trim())
            .filter((word) => word !== '');
    return {
      headline: required(key, '제목', cell(row, 'headline')),
      description: required(key, '해석', cell(row, 'description')),
      keywords: [keywords[0] ?? '', keywords[1] ?? '', keywords[2] ?? ''],
    };
  };
  // 원소 코멘트는 '코멘트' 칸이 기본이고, 없으면 '해석' 칸을 쓴다.
  const commentText = (key: string): string => {
    const row = rowsByKey.get(key) ?? [];
    return required(key, '코멘트', cell(row, 'comment') || cell(row, 'description'));
  };

  const placements = Object.fromEntries(
    BIG_THREE.map((kind) => [
      kind,
      Object.fromEntries(ZODIAC_ORDER.map((sign) => [sign, placementText(`${kind}.${sign}`)])) as Record<ZodiacSignId, PlacementText>,
    ]),
  ) as Record<BigThreeKey, Record<ZodiacSignId, PlacementText>>;
  const perElement = (variant: 'dominant' | 'lacking') =>
    Object.fromEntries(ELEMENT_IDS.map((id) => [id, commentText(`element.${id}.${variant}`)])) as Record<ElementId, string>;
  const elements: ElementCommentSet = {
    dominant: perElement('dominant'),
    lacking: perElement('lacking'),
    balanced: commentText('element.balanced'),
  };

  const content: FreeStageContent = { origin, placements, elements };
  // 빈 칸·누락 키가 있으면 길이 검사는 잡음만 늘리므로 구조가 온전할 때만 돌린다.
  const structural = issues.filter((issue) => issue.level === 'error').length;
  if (structural === 0) issues.push(...validateFreeStageContent(content));

  const hasError = issues.some((issue) => issue.level === 'error');
  return { content: hasError ? null : content, issues };
}

/** 변환된 문구를 src/content/freeStage.ts 형식의 소스로 만든다. */
export function renderFreeStageModule(content: FreeStageContent, sourceLabel: string): string {
  return `import type { FreeStageContent } from '@/types/content';

/**
 * 무료 단계 해석 문구 — 검수본. scripts/convert-content.ts가 만든 파일이다.
 * 직접 고치지 말고 편집 시트(docs/content/free-stage-draft.xlsx)를 고친 뒤 다시 변환한다.
 * 원본: ${sourceLabel}
 */
export const FREE_STAGE_CONTENT: FreeStageContent = ${JSON.stringify(content, null, 2)};
`;
}
