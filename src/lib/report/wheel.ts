import { normalizeLongitude } from '@/lib/astro/zodiac';

/**
 * 네이탈 휠 차트 좌표 계산 (순수 함수).
 * 관례: 상승궁(ASC)을 왼쪽(9시 방향)에 두고 황경이 커질수록 시계 반대 방향으로 돈다.
 * 출생 시간을 몰라 ASC가 없으면 양자리 0°를 왼쪽에 둔다.
 */

/** 황경 → 화면 각도(수학 좌표, 도). 0°는 오른쪽, 90°는 위쪽. */
export function wheelAngle(longitude: number, ascendant: number | null): number {
  return normalizeLongitude(180 + longitude - (ascendant ?? 0));
}

/** 화면 각도·반지름 → SVG 좌표 (SVG는 y가 아래로 커진다) */
export function polar(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
}

/**
 * 천체 기호가 겹치지 않게 표시 위치(황경)를 벌린다. 실제 위치는 바꾸지 않고, 기호를 놓을 자리만 정한다.
 * 가까운 천체끼리 묶어 묶음의 가운데를 기준으로 minGap 간격으로 펼치고, 묶음끼리 다시 겹치면 합쳐서 반복한다.
 * 반환: 입력과 같은 순서의 표시 황경.
 */
export function spreadLongitudes(longitudes: readonly number[], minGap: number): number[] {
  if (longitudes.length === 0) return [];
  if (longitudes.length * minGap >= 360) {
    // 다 펼칠 자리가 없으면 고르게 나눈다.
    const step = 360 / longitudes.length;
    const order = longitudes.map((value, index) => ({ value: normalizeLongitude(value), index })).sort((a, b) => a.value - b.value);
    const result = new Array<number>(longitudes.length);
    order.forEach((item, rank) => {
      result[item.index] = normalizeLongitude(order[0].value + rank * step);
    });
    return result;
  }

  // 가장 넓은 빈틈에서 원을 잘라 일직선으로 펴고, 그 위에서 묶음 단위로 펼친다.
  const items = longitudes.map((value, index) => ({ value: normalizeLongitude(value), index })).sort((a, b) => a.value - b.value);
  let cut = 0;
  let widestGap = -1;
  for (let i = 0; i < items.length; i += 1) {
    const next = items[(i + 1) % items.length].value + (i + 1 === items.length ? 360 : 0);
    const gap = next - items[i].value;
    if (gap > widestGap) {
      widestGap = gap;
      cut = (i + 1) % items.length;
    }
  }
  const base = items[cut].value;
  const line = [...items.slice(cut), ...items.slice(0, cut)].map((item) => ({
    index: item.index,
    position: normalizeLongitude(item.value - base),
  }));

  interface Cluster {
    members: { index: number; position: number }[];
    start: number;
  }
  const clusterCenter = (cluster: Cluster) =>
    cluster.members.reduce((sum, member) => sum + member.position, 0) / cluster.members.length;
  let clusters: Cluster[] = line.map((member) => ({ members: [member], start: member.position }));

  let merged = true;
  while (merged) {
    merged = false;
    const next: Cluster[] = [];
    for (const cluster of clusters) {
      const previous = next[next.length - 1];
      if (previous && cluster.start < previous.start + previous.members.length * minGap) {
        const members = [...previous.members, ...cluster.members];
        const combined: Cluster = { members, start: 0 };
        combined.start = clusterCenter(combined) - ((members.length - 1) * minGap) / 2;
        next[next.length - 1] = combined;
        merged = true;
      } else {
        next.push(cluster);
      }
    }
    clusters = next;
  }

  const result = new Array<number>(longitudes.length);
  for (const cluster of clusters) {
    cluster.members.forEach((member, rank) => {
      result[member.index] = normalizeLongitude(base + cluster.start + rank * minGap);
    });
  }
  return result;
}
