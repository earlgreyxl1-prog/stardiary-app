/**
 * GeoNames 출처 표기. 도시 데이터가 CC BY 4.0이라 데이터를 보여주는 곳에 출처·라이선스·가공 여부를 밝힌다.
 */
export function GeoNamesAttribution() {
  const linkClass = 'underline decoration-white/30 underline-offset-2 transition hover:text-indigo-100';
  return (
    <p className="mt-4 text-[11px] leading-relaxed text-indigo-200/50">
      도시 정보:{' '}
      <a href="https://www.geonames.org" target="_blank" rel="noopener noreferrer" className={linkClass}>
        GeoNames
      </a>{' '}
      ·{' '}
      <a
        href="https://creativecommons.org/licenses/by/4.0/deed.ko"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        CC BY 4.0
      </a>{' '}
      · 일부 가공해 사용해요
    </p>
  );
}
