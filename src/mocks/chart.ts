import type { ChartSummary } from '@/types/astro';

/**
 * 결과 화면 UI 확인용 목업. 입력한 생년월일과 무관한 고정 값이다.
 * 실제 계산 엔진(CLAUDE.md 미결정 사항)이 정해지면 chartService에서 교체한다.
 */
export const CHART_SUMMARY_MOCK: ChartSummary = {
  source: 'mock',
  sun: {
    sign: 'pisces',
    degree: 23.4,
    headline: '꿈꾸는 공감 요정',
    description:
      '다른 사람의 마음을 내 일처럼 느끼는 따뜻한 사람이에요. 상상력이 풍부해서 평범한 하루에서도 이야기를 찾아내요. 가끔은 혼자만의 시간으로 마음을 충전해야 해요.',
    keywords: ['공감', '상상력', '다정함'],
  },
  moon: {
    sign: 'leo',
    degree: 8.1,
    headline: '칭찬이 필요한 마음속 사자',
    description:
      '속으로는 인정받고 싶은 마음이 커요. 좋아하는 사람에게는 아낌없이 표현하고, 진심 어린 칭찬 한마디에 하루 종일 기분이 좋아져요.',
    keywords: ['자존감', '표현력', '따뜻한 리더십'],
  },
  rising: {
    sign: 'virgo',
    degree: 14.7,
    headline: '차분하고 꼼꼼한 첫인상',
    description:
      '처음 만난 사람에게는 단정하고 믿음직한 사람으로 보여요. 작은 것까지 챙기는 모습 덕분에 "이 사람한테 맡기면 되겠다"는 인상을 줘요.',
    keywords: ['신뢰감', '섬세함', '정돈된'],
  },
  elements: {
    fire: 30,
    earth: 20,
    air: 10,
    water: 40,
  },
  dominantElement: 'water',
  elementComment:
    '물의 기운이 가장 강해요. 감정을 깊이 느끼고 분위기를 잘 읽어요. 바람의 기운이 적은 편이라, 생각을 말로 정리해 보면 마음이 한결 가벼워져요.',
};
