import { ASPECT_BODIES, findAspects } from '@/lib/astro/aspects';
import { computeElementBalance } from '@/lib/astro/elements';
import { computeNatalPositions, EphemerisError } from '@/lib/astro/engine';
import { BirthTimeError } from '@/lib/astro/time';
import { findBirthInputProblem } from '@/lib/birthGuards';
import type { BodyId, ChartApiResponse } from '@/types/astro';
import type { BirthInput } from '@/types/birth';

export interface ChartApiError {
  error: string;
}

/** POST /api/chart — BirthInput을 받아 천체 위치(NatalPositions), 4원소 비율, 애스펙트를 돌려준다. */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '요청 본문이 JSON 형식이 아니에요' } satisfies ChartApiError, { status: 400 });
  }

  const problem = findBirthInputProblem(body);
  if (problem) {
    return Response.json({ error: problem } satisfies ChartApiError, { status: 400 });
  }

  try {
    const positions = computeNatalPositions(body as BirthInput);
    const longitudes = Object.fromEntries(
      ASPECT_BODIES.map((body) => [body, positions.bodies[body].longitude]),
    ) as Record<BodyId, number>;
    const response: ChartApiResponse = {
      positions,
      elementBalance: computeElementBalance(positions),
      aspects: findAspects(longitudes),
    };
    return Response.json(response);
  } catch (error: unknown) {
    if (error instanceof BirthTimeError) {
      return Response.json({ error: error.message } satisfies ChartApiError, { status: 400 });
    }
    console.error('[api/chart]', error);
    const message =
      error instanceof EphemerisError ? '별 위치를 계산하지 못했어요. 잠시 후 다시 시도해 주세요.' : '서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
    return Response.json({ error: message } satisfies ChartApiError, { status: 500 });
  }
}
