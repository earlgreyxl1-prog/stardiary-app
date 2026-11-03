import { BODY_BY_ID } from '@/lib/astro/bodies';
import { josa, type JosaPair } from '@/lib/text/korean';
import type { Aspect, BodyId, HouseNumber, ZodiacSignId } from '@/types/astro';
import type { PaidStageContent } from '@/types/content';

/**
 * 문장 틀 채우기. {a}·{b}는 이름 그대로, {a|과/와}처럼 쓰면 이름 + 받침에 맞는 조사.
 * 알 수 없는 자리표시는 그대로 남겨 두어(테스트가 잡는다) 문구 실수가 화면에서 조용히 사라지지 않게 한다.
 */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)(?:\|([^}]+))?\}/g, (whole, key: string, pair?: string) => {
    const value = values[key];
    if (value === undefined) return whole;
    return pair ? `${value}${josa(value, pair as JosaPair)}` : value;
  });
}

/** 천체 한 줄 해석: 별자리(와 하우스, 시간을 알 때)로 조합한다. */
export function bodyText(
  content: PaidStageContent,
  body: BodyId,
  sign: ZodiacSignId,
  house: HouseNumber | null,
): string {
  const theme = content.bodies[body].theme;
  const first = `${theme}${josa(theme, '이/가')} ${content.signs[sign].style} 드러나요.`;
  if (house === null) return first;
  return `${first} 특히 ${content.houses[house].area}에서 그 기운이 잘 느껴져요.`;
}

/** 애스펙트 한 줄 해석 */
export function aspectText(content: PaidStageContent, aspect: Pick<Aspect, 'a' | 'b' | 'type'>): string {
  return fillTemplate(content.aspects[aspect.type].template, {
    a: BODY_BY_ID[aspect.a].nameKo,
    b: BODY_BY_ID[aspect.b].nameKo,
  });
}
