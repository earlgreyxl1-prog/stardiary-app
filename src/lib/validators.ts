import type {
  BirthFieldKey,
  BirthFormErrors,
  BirthFormValues,
  BirthInput,
  OnboardingStep,
} from '@/types/birth';
import type { City } from '@/types/city';

const MIN_YEAR = 1900;
const MAX_NICKNAME_LENGTH = 10;

export const STEP_FIELD: Record<OnboardingStep, BirthFieldKey> = {
  0: 'nickname',
  1: 'date',
  2: 'time',
  3: 'city',
};

const ALL_STEPS: readonly OnboardingStep[] = [0, 1, 2, 3];

export function validateNickname(nickname: string): string | undefined {
  const trimmed = nickname.trim();
  if (trimmed.length === 0) return '불러드릴 이름을 알려주세요';
  if (trimmed.length > MAX_NICKNAME_LENGTH) return `${MAX_NICKNAME_LENGTH}글자 이하로 지어주세요`;
  return undefined;
}

export function validateDate(
  year: string,
  month: string,
  day: string,
  now: Date = new Date(),
): string | undefined {
  if (year === '' || month === '' || day === '') return '연도, 월, 일을 모두 입력해 주세요';

  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (year.length !== 4 || y < MIN_YEAR) return `${MIN_YEAR}년 이후의 4자리 연도를 입력해 주세요`;
  if (m < 1 || m > 12) return '월은 1부터 12 사이로 입력해 주세요';

  const date = new Date(y, m - 1, d);
  const isRealDate = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  if (!isRealDate) return `${y}년 ${m}월에는 ${d}일이 없어요`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date.getTime() > today.getTime()) return '아직 태어나지 않은 날짜예요';

  return undefined;
}

export function validateTime(timeUnknown: boolean, hour: string, minute: string): string | undefined {
  if (timeUnknown) return undefined;
  if (hour === '' || minute === '') return '시와 분을 입력하거나 "시간을 몰라요"를 선택해 주세요';

  const h = Number(hour);
  const mi = Number(minute);
  if (h < 0 || h > 23) return '시는 0부터 23 사이로 입력해 주세요';
  if (mi < 0 || mi > 59) return '분은 0부터 59 사이로 입력해 주세요';
  return undefined;
}

export function validateCity(city: City | null): string | undefined {
  return city === null ? '태어난 도시를 골라 주세요' : undefined;
}

export function validateStep(
  step: OnboardingStep,
  values: BirthFormValues,
  now: Date = new Date(),
): BirthFormErrors {
  switch (step) {
    case 0: {
      const message = validateNickname(values.nickname);
      return message ? { nickname: message } : {};
    }
    case 1: {
      const message = validateDate(values.year, values.month, values.day, now);
      return message ? { date: message } : {};
    }
    case 2: {
      const message = validateTime(values.timeUnknown, values.hour, values.minute);
      return message ? { time: message } : {};
    }
    case 3: {
      const message = validateCity(values.city);
      return message ? { city: message } : {};
    }
  }
}

export interface InvalidStepResult {
  step: OnboardingStep;
  errors: BirthFormErrors;
}

/** 첫 번째로 검증에 실패한 단계를 찾는다. 모두 통과하면 null. */
export function findFirstInvalidStep(values: BirthFormValues): InvalidStepResult | null {
  for (const step of ALL_STEPS) {
    const errors = validateStep(step, values);
    if (Object.keys(errors).length > 0) return { step, errors };
  }
  return null;
}

/** URL의 ?step=time 같은 값으로 시작 단계를 고른다. 해당하는 단계가 없으면 null. */
export function stepFromParam(field: string | null): OnboardingStep | null {
  if (field === null) return null;
  return ALL_STEPS.find((step) => STEP_FIELD[step] === field) ?? null;
}

/** 저장된 BirthInput을 다시 고칠 수 있도록 폼 값으로 되돌린다. toBirthInput의 역변환. */
export function toFormValues(input: BirthInput): BirthFormValues {
  return {
    nickname: input.nickname,
    year: String(input.year),
    month: String(input.month),
    day: String(input.day),
    hour: input.hour === null ? '' : String(input.hour),
    minute: input.minute === null ? '' : String(input.minute).padStart(2, '0'),
    timeUnknown: input.timeUnknown,
    city: input.city,
  };
}

/** 검증을 통과한 폼 값을 서비스 로직용 BirthInput으로 변환한다. */
export function toBirthInput(values: BirthFormValues): BirthInput | null {
  if (values.city === null) return null;
  const unknown = values.timeUnknown;
  return {
    nickname: values.nickname.trim(),
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: unknown ? null : Number(values.hour),
    minute: unknown ? null : Number(values.minute),
    timeUnknown: unknown,
    city: values.city,
  };
}
