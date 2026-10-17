import type { City } from '@/types/city';

/** 입력 중인 폼 상태. 숫자 필드도 입력 편의를 위해 문자열로 보관한다. */
export interface BirthFormValues {
  nickname: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  timeUnknown: boolean;
  city: City | null;
}

export type BirthFieldKey = 'nickname' | 'date' | 'time' | 'city';
export type BirthFormErrors = Partial<Record<BirthFieldKey, string>>;

/** 검증을 통과해 서비스 로직으로 넘기는 최종 출생 정보. 출생 시각은 현지 시각 기준이다. */
export interface BirthInput {
  nickname: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
  timeUnknown: boolean;
  city: City;
}

export type OnboardingStep = 0 | 1 | 2 | 3;
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export type SetBirthField = <K extends keyof BirthFormValues>(
  key: K,
  value: BirthFormValues[K],
) => void;

export interface BirthStepProps {
  values: BirthFormValues;
  errors: BirthFormErrors;
  setField: SetBirthField;
}
