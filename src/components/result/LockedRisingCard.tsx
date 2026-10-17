import Link from 'next/link';
import { Clock } from 'lucide-react';
import { BIG_THREE } from '@/lib/astro/zodiac';

/** 출생 시간을 모르면 상승궁을 계산할 수 없어서 대신 보여주는 카드 */
export function LockedRisingCard() {
  const meta = BIG_THREE.rising;

  return (
    <div className="flex h-72 flex-col rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-5">
      <p className="text-sm text-indigo-200/80">
        {meta.emoji} {meta.label}
      </p>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <Clock className="h-7 w-7 text-indigo-200/70" aria-hidden />
        </span>
        <p className="mt-4 font-bold text-white">시간을 알면 볼 수 있어요</p>
        <p className="mt-1 text-sm leading-relaxed text-indigo-200/70">
          상승궁은 태어난 시각에 따라 두 시간마다 바뀌어요.
          <br />
          출생 시간을 알게 되면 다시 입력해 주세요.
        </p>
        <Link
          href="/onboarding?step=time"
          className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95"
        >
          출생 시간 입력하러 가기
        </Link>
      </div>
    </div>
  );
}
