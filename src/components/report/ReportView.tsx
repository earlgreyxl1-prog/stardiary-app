'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DeepReportTeaser } from '@/components/deepReport/DeepReportTeaser';
import { AspectSection, HouseSection, PlanetSection } from '@/components/report/ReportSections';
import { WheelChart } from '@/components/report/WheelChart';
import { ZODIAC_SIGNS } from '@/lib/astro/zodiac';
import type { NatalReport } from '@/lib/report/buildReport';
import { formatDegreeMinutes } from '@/lib/report/format';
import type { BirthInput } from '@/types/birth';

interface ReportViewProps {
  input: BirthInput;
  report: NatalReport;
}

function formatBirth(input: BirthInput): string {
  const date = `${input.year}년 ${input.month}월 ${input.day}일`;
  const time =
    input.timeUnknown || input.hour === null || input.minute === null
      ? '시간 모름'
      : `${input.hour}시 ${String(input.minute).padStart(2, '0')}분`;
  return `${date} · ${time} · ${input.city.nameKo}`;
}

export function ReportView({ input, report }: ReportViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <p className="text-xs font-medium tracking-wide text-[#ffe9a8]">무료 정밀 차트</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{input.nickname}님의 네이탈 차트</h1>
        <p className="mt-1 text-sm text-indigo-200/70">{formatBirth(input)}</p>
        {report.angles && (
          <p className="mt-1 text-xs text-indigo-200/60">
            상승궁 {ZODIAC_SIGNS[report.angles.ascendant.sign].nameKo} {formatDegreeMinutes(report.angles.ascendant.degree)} · 천정(MC){' '}
            {ZODIAC_SIGNS[report.angles.midheaven.sign].nameKo} {formatDegreeMinutes(report.angles.midheaven.degree)}
          </p>
        )}
      </header>

      {report.contentOrigin === 'ai-draft' && (
        <p className="rounded-2xl border border-[#ffe9a8]/30 bg-[#ffe9a8]/10 px-4 py-3 text-xs leading-relaxed text-[#fff1c7]">
          🧪 위치·각도는 입력한 정보로 계산한 실제 결과예요. 해석 문구는 검수 전 임시 문구예요.
        </p>
      )}
      {report.timeUnknown && (
        <p className="rounded-2xl bg-white/5 px-4 py-3 text-xs leading-relaxed text-indigo-200/80">
          출생 시간을 몰라 정오 기준으로 계산했어요. 상승궁·하우스는 시간을 알아야 볼 수 있어요.{' '}
          <Link href="/onboarding?step=time" className="font-medium text-indigo-100 underline decoration-white/30 underline-offset-2">
            출생 시간 입력하기
          </Link>
        </p>
      )}

      <WheelChart report={report} />
      <PlanetSection report={report} />
      <HouseSection report={report} />
      <AspectSection report={report} />

      <DeepReportTeaser />

      <div className="flex justify-center pt-2">
        <Link href="/result" className="inline-flex items-center gap-1 text-sm text-indigo-200/80 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          무료 결과로 돌아가기
        </Link>
      </div>
    </div>
  );
}
