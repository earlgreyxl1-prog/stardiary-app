import { pickOwnedChapters } from '@/lib/deepReport/products';
import { MOCK_DEEP_REPORT } from '@/mocks/deepReport';
import type { BirthInput } from '@/types/birth';
import type { DeepChapterId, DeepReport } from '@/types/deepReport';

const MOCK_LATENCY_MS = 900;
/** 에러 UI를 확인하기 위한 목업 전용 입력값(무료 결과와 같은 닉네임) */
const MOCK_FAILURE_NICKNAME = '!error';

export class DeepReportError extends Error {
  constructor(message = '네트워크 연결을 확인한 뒤 다시 시도해 주세요. 계속 안 되면 정밀 차트로 돌아가 다시 들어와 주세요.') {
    super(message);
    this.name = 'DeepReportError';
  }
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('요청을 취소했어요.', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('요청을 취소했어요.', 'AbortError'));
      },
      { once: true },
    );
  });
}

/**
 * 산 장만 담긴 심화 리포트를 가져온다. 지금은 입력과 무관한 **목업**(mocks/deepReport.ts)이다.
 * AI 생성을 붙일 때는 서버 API가 구매 여부를 확인하고, 산 장만 생성·저장해 돌려준다. 이 함수의 시그니처는 그대로 둔다.
 */
export async function getDeepReport(
  input: BirthInput,
  owned: readonly DeepChapterId[],
  signal?: AbortSignal,
): Promise<DeepReport> {
  await wait(MOCK_LATENCY_MS, signal);
  if (input.nickname.trim() === MOCK_FAILURE_NICKNAME) throw new DeepReportError();
  return pickOwnedChapters(MOCK_DEEP_REPORT, owned);
}
