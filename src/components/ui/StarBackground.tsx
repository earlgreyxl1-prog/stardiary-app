interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

/** 시드 기반 난수로 별 위치를 고정해서 SSR/CSR 간 hydration 불일치를 막는다. */
function createStars(count: number): Star[] {
  let seed = 20261016;
  const next = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, (_, id) => ({
    id,
    top: Math.round(next() * 10000) / 100,
    left: Math.round(next() * 10000) / 100,
    size: Math.round((1 + next() * 2) * 10) / 10,
    delay: Math.round(next() * 40) / 10,
    duration: Math.round((2 + next() * 3) * 10) / 10,
  }));
}

const STARS: readonly Star[] = createStars(56);

export function StarBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[linear-gradient(180deg,#14112e_0%,#231b52_55%,#3a2866_100%)]"
    >
      {STARS.map((star) => (
        <span
          key={star.id}
          className="star-twinkle absolute rounded-full bg-[#fff6d6]"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
