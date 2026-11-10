/** 공개 저장소 주소. 서비스가 AGPL-3.0이라 이용자가 소스 코드를 받을 수 있게 모든 화면 아래에 링크를 둔다. */
export const SOURCE_REPOSITORY_URL = 'https://github.com/earlgreyxl1-prog/stardiary-app';

/** 모든 화면 맨 아래의 작은 안내: 개인 프로젝트, 소스 코드(AGPL-3.0), 행성 계산 엔진 */
export function SiteFooter() {
  const linkClass = 'underline decoration-white/30 underline-offset-2 transition hover:text-indigo-100';
  return (
    <footer className="mx-auto w-full max-w-md px-5 pb-8 text-center text-[11px] leading-relaxed text-indigo-200/50">
      개인 포트폴리오 프로젝트 ·{' '}
      <a href={SOURCE_REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
        소스 코드
      </a>{' '}
      (
      <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className={linkClass}>
        AGPL-3.0
      </a>
      ) · 행성 계산:{' '}
      <a href="https://www.astro.com/swisseph/" target="_blank" rel="noopener noreferrer" className={linkClass}>
        Swiss Ephemeris
      </a>
    </footer>
  );
}
