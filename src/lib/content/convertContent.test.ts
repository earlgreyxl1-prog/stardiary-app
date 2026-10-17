import { describe, expect, it } from 'vitest';
import { FREE_STAGE_CONTENT } from '@/content/freeStage';
import { CONTENT_KEYS, convertContentTable, renderFreeStageModule, validateFreeStageContent } from '@/lib/content/convertContent';
import { parseCsv } from '@/lib/content/csv';
import type { FreeStageContent } from '@/types/content';

/** AI 초안을 작가 시트 모양의 표로 펼친다 (변환 결과가 원본과 같아야 한다). */
function sheetFrom(content: FreeStageContent, source = '작가'): string[][] {
  const rows = [['키', '제목', '해석', '키워드', '코멘트', '출처']];
  for (const key of CONTENT_KEYS) {
    const [group, part, variant] = key.split('.');
    if (group === 'element') {
      const text =
        part === 'balanced'
          ? content.elements.balanced
          : content.elements[variant as 'dominant' | 'lacking'][part as 'fire' | 'earth' | 'air' | 'water'];
      rows.push([key, '', '', '', text, source]);
    } else {
      const text = content.placements[group as 'sun' | 'moon' | 'rising'][part as 'aries'];
      rows.push([key, text.headline, text.description, text.keywords.join(', '), '', source]);
    }
  }
  return rows;
}

const errorsOf = (table: string[][]) =>
  convertContentTable(table).issues.filter((issue) => issue.level === 'error');

describe('parseCsv', () => {
  it('따옴표 안의 쉼표·줄바꿈·이중 따옴표, BOM, CRLF를 처리한다', () => {
    const csv = '﻿키,제목\r\n"sun.aries","먼저, ""달려가는""\n불꽃"\r\n\r\nmoon.aries,짧은 제목';
    expect(parseCsv(csv)).toEqual([
      ['키', '제목'],
      ['sun.aries', '먼저, "달려가는"\n불꽃'],
      ['moon.aries', '짧은 제목'],
    ]);
  });

  it('닫히지 않은 따옴표는 오류', () => {
    expect(() => parseCsv('키,제목\nsun.aries,"열린 따옴표')).toThrow('닫히지 않은 따옴표');
  });
});

describe('convertContentTable', () => {
  it('키는 45개', () => {
    expect(CONTENT_KEYS).toHaveLength(45);
  });

  it('정상 시트는 원본과 같은 문구로 돌아오고 origin은 writer', () => {
    const result = convertContentTable(sheetFrom(FREE_STAGE_CONTENT));
    expect(result.issues.filter((issue) => issue.level === 'error')).toEqual([]);
    expect(result.content).toEqual({ ...FREE_STAGE_CONTENT, origin: 'writer' });
  });

  it('영문 머리글·키워드 칸 3개도 받는다', () => {
    const table = sheetFrom(FREE_STAGE_CONTENT).map((row, index) =>
      index === 0
        ? ['key', 'headline', 'description', 'keyword1', 'keyword2', 'keyword3', 'comment', 'source']
        : [row[0], row[1], row[2], ...(row[3] ? row[3].split(', ') : ['', '', '']), row[4], row[5]],
    );
    expect(convertContentTable(table).content).toEqual({ ...FREE_STAGE_CONTENT, origin: 'writer' });
  });

  it("출처가 'AI'로 시작하는 행이 있으면 거부한다", () => {
    const table = sheetFrom(FREE_STAGE_CONTENT);
    table[1][5] = 'AI 예시';
    const result = convertContentTable(table);
    expect(result.content).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ level: 'error', key: 'sun.aries' }));
  });

  it('빠진 키·알 수 없는 키·중복 키', () => {
    const table = sheetFrom(FREE_STAGE_CONTENT).filter((row) => row[0] !== 'moon.leo');
    table.push(['sun.ophiuchus', '뱀주인 제목입니다', '', '', '', '작가']);
    table.push([...table[1]]);
    const errors = errorsOf(table).map((issue) => `${issue.key}: ${issue.message}`);
    expect(errors).toEqual(
      expect.arrayContaining(['moon.leo: 시트에 이 키가 없어요', 'sun.ophiuchus: 알 수 없는 키예요', 'sun.aries: 같은 키가 두 번 있어요']),
    );
  });

  it('글자 수·키워드 개수·제목 금지어를 검사한다', () => {
    const table = sheetFrom(FREE_STAGE_CONTENT);
    const row = (key: string) => table.find((cells) => cells[0] === key) as string[];
    row('sun.aries')[1] = '짧음';
    row('sun.leo')[1] = '빛나는 사자 같은 주인공';
    row('moon.aries')[3] = '용기, 추진력';
    row('element.fire.dominant')[4] = '너무 짧아요';
    const messages = errorsOf(table).map((issue) => `${issue.key}: ${issue.message}`);
    expect(messages).toEqual(
      expect.arrayContaining([
        'sun.aries: 제목 2자 — 8~16자여야 해요',
        "sun.leo: 제목에 '사자'를 쓰지 않아요",
        'moon.aries: 키워드가 2개 — 3개여야 해요',
        'element.fire.dominant: 코멘트 6자 — 40~60자여야 해요',
      ]),
    );
  });

  it('한 글자 어간(게자리 → 게)은 제목 검사에 쓰지 않는다', () => {
    const table = sheetFrom(FREE_STAGE_CONTENT);
    (table.find((cells) => cells[0] === 'sun.cancer') as string[])[1] = '즐겁게 품어 주는 마음';
    expect(errorsOf(table).filter((issue) => issue.key === 'sun.cancer')).toEqual([]);
  });

  it("'키' 머리글이 없으면 찾은 머리글을 알려준다", () => {
    const result = convertContentTable([['구분', '내용'], ['a', 'b']]);
    expect(result.content).toBeNull();
    expect(result.issues[0].message).toContain('찾은 머리글: 구분, 내용');
  });
});

describe('validateFreeStageContent', () => {
  it('지금 쓰는 문구(AI 초안)는 규칙 오류가 없다', () => {
    expect(validateFreeStageContent(FREE_STAGE_CONTENT).filter((issue) => issue.level === 'error')).toEqual([]);
  });

  it("원소 코멘트의 '가장' 같은 표현은 경고만 한다", () => {
    const content: FreeStageContent = {
      ...FREE_STAGE_CONTENT,
      elements: {
        ...FREE_STAGE_CONTENT.elements,
        dominant: { ...FREE_STAGE_CONTENT.elements.dominant, fire: '불의 기운이 가장 강해서 무엇이든 먼저 시작하고 주변까지 환하게 밝혀 주는 사람이에요.' },
      },
    };
    const issues = validateFreeStageContent(content).filter((issue) => issue.key === 'element.fire.dominant');
    expect(issues.every((issue) => issue.level === 'warning')).toBe(true);
    expect(issues.map((issue) => issue.message)).toEqual([expect.stringContaining("'가장'")]);
  });
});

describe('renderFreeStageModule', () => {
  it('타입이 붙은 모듈 소스를 만든다', () => {
    const source = renderFreeStageModule({ ...FREE_STAGE_CONTENT, origin: 'writer' }, 'sheet.csv');
    expect(source).toContain("import type { FreeStageContent } from '@/types/content';");
    expect(source).toContain('export const FREE_STAGE_CONTENT: FreeStageContent = {');
    expect(source).toContain('"origin": "writer"');
    expect(source).toContain('원본: sheet.csv');
  });
});
