import type { PaidStageContent } from '@/types/content';

/**
 * 유료 리포트 문구 — **AI 가안 (2026-11-03, 사용자 검수 전)**.
 * 조각을 조합해 문장을 만든다(lib/report/reportText.ts).
 * - 천체 문장: "{천체 theme}이/가 {별자리 style} 드러나요. 특히 {하우스 area}에서 그 기운이 잘 느껴져요."
 * - 애스펙트 문장: aspects[type].template ({a}·{b}에 천체 이름, {a|과/와}는 조사까지)
 * 규칙: 해요체, 운명 단정·건강·금전·시험 결과 단언·다른 별자리 비하 금지(무료 단계와 같음).
 */
export const PAID_STAGE_CONTENT: PaidStageContent = {
  origin: 'ai-draft',
  bodies: {
    sun: { theme: '나다운 모습' },
    moon: { theme: '속마음' },
    mercury: { theme: '생각하고 말하는 방식' },
    venus: { theme: '좋아하고 아끼는 마음' },
    mars: { theme: '움직이고 도전하는 힘' },
    jupiter: { theme: '넓혀 가고 자라는 힘' },
    saturn: { theme: '책임감과 꾸준함' },
    uranus: { theme: '새로움을 찾는 마음' },
    neptune: { theme: '꿈과 상상' },
    pluto: { theme: '깊이 바뀌는 힘' },
  },
  signs: {
    aries: { style: '거침없고 솔직하게' },
    taurus: { style: '느긋하고 단단하게' },
    gemini: { style: '가볍고 재치 있게' },
    cancer: { style: '다정하고 세심하게' },
    leo: { style: '당당하고 따뜻하게' },
    virgo: { style: '꼼꼼하고 차분하게' },
    libra: { style: '부드럽고 균형 있게' },
    scorpio: { style: '깊고 진하게' },
    sagittarius: { style: '자유롭고 넓게' },
    capricorn: { style: '진지하고 착실하게' },
    aquarius: { style: '독특하고 자유롭게' },
    pisces: { style: '말랑하고 섬세하게' },
  },
  houses: {
    1: { area: '나 자신과 첫인상' },
    2: { area: '내가 가진 것과 가치' },
    3: { area: '배움과 가까운 대화' },
    4: { area: '집과 가족' },
    5: { area: '즐거움과 연애' },
    6: { area: '일상과 습관' },
    7: { area: '파트너와 일대일 관계' },
    8: { area: '깊은 유대와 나눔' },
    9: { area: '여행과 공부' },
    10: { area: '일과 사회적 역할' },
    11: { area: '친구와 모임' },
    12: { area: '혼자만의 시간과 쉼' },
  },
  aspects: {
    conjunction: {
      label: '합',
      tone: 'neutral',
      template: '{a|과/와} {b|이/가} 한데 붙어 두 힘이 함께 움직여요. 서로를 키워 주는 만큼 한쪽으로 쏠리기도 쉬워요.',
    },
    opposition: {
      label: '대립',
      tone: 'tense',
      template: '{a|과/와} {b|이/가} 마주 보고 있어요. 두 마음 사이에서 균형을 찾을수록 시야가 넓어져요.',
    },
    trine: {
      label: '삼각',
      tone: 'harmonious',
      template: '{a|과/와} {b|이/가} 자연스럽게 손발을 맞춰요. 애쓰지 않아도 편하게 꺼내 쓰는 재능이 되기 쉬워요.',
    },
    square: {
      label: '직각',
      tone: 'tense',
      template: '{a|과/와} {b|이/가} 서로 부딪히며 긴장을 만들어요. 그 마찰이 나를 움직이게 하는 힘이 되기도 해요.',
    },
    sextile: {
      label: '육각',
      tone: 'harmonious',
      template: '{a|과/와} {b|이/가} 살짝 손을 내밀어 도와요. 조금만 마음을 쓰면 좋은 기회로 이어지기 쉬워요.',
    },
  },
};
