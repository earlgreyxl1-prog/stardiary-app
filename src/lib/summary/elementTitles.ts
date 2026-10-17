import { ELEMENT_BY_ID } from '@/lib/astro/zodiac';
import { joinWithAnd, josa } from '@/lib/text/korean';
import type { ElementId, ElementSummaryView } from '@/types/astro';

/**
 * 원소 코멘트 위에 붙는 제목. 문구(코멘트)는 작가가 쓰고, 제목은 서비스가 이 템플릿으로 만든다.
 * 동점일 때 원소를 모두 이름 붙이므로 작가에게 동점용 문구를 따로 받지 않는다(docs/content-brief-elements.md).
 */
export interface ElementTitles {
  /** 균형형 또는 강한 편 제목 */
  main: string;
  /** 적은 편 제목. 적은 편이 없으면 null */
  lacking: string | null;
}

const labelled = (elements: readonly ElementId[]) =>
  elements.map((id) => ({ label: `${ELEMENT_BY_ID[id].emoji} ${ELEMENT_BY_ID[id].nameKo}`, word: ELEMENT_BY_ID[id].nameKo }));

const lastWord = (elements: readonly ElementId[]) => ELEMENT_BY_ID[elements[elements.length - 1]].nameKo;

export function elementTitles(view: ElementSummaryView): ElementTitles {
  if (view.kind === 'balanced') {
    return { main: '네 원소가 고르게 섞여 있어요', lacking: null };
  }

  const strong = view.strong.elements;
  const main =
    strong.length === 1
      ? `가장 강한 원소는 ${labelled(strong)[0].label}${josa(lastWord(strong), '이에요/예요')}`
      : `${joinWithAnd(labelled(strong))}${josa(lastWord(strong), '이/가')} 똑같이 강해요`;

  const lackingIds = view.lacking.map((comment) => comment.element);
  const lacking =
    lackingIds.length === 0 ? null : `${joinWithAnd(labelled(lackingIds))}${josa(lastWord(lackingIds), '이/가')} 적은 편이에요`;

  return { main, lacking };
}
