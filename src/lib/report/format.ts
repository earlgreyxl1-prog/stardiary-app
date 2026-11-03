/** 도수를 "29°12′"처럼 도·분으로 표시한다 (분은 내림, 60분이 되지 않게). */
export function formatDegreeMinutes(degree: number): string {
  const totalMinutes = Math.floor(degree * 60 + 1e-9);
  return `${Math.floor(totalMinutes / 60)}°${String(totalMinutes % 60).padStart(2, '0')}′`;
}
