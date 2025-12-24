/**
 * @file lib/health/lifecycle-calculator.ts
 * @description 사람의 생애주기 계산 로직
 * 
 * 생년월일을 기반으로 생애주기 단계를 판별합니다.
 * - 영유아기 (0-6세)
 * - 청소년기 (7-18세)
 * - 성인기 (19-64세)
 * - 노년기 (65세 이상)
 */

export type HumanLifecycleStage = 'infant' | 'adolescent' | 'adult' | 'elderly';

export interface HumanAge {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonths: number;
}

export interface HumanLifecycleInfo {
  stage: HumanLifecycleStage;
  stageLabel: string;
  age: HumanAge;
  nextStage?: {
    stage: HumanLifecycleStage;
    stageLabel: string;
    estimatedDate: Date;
  };
}

/**
 * 생년월일로부터 사람의 나이 계산
 * @param birthDate 생년월일 (YYYY-MM-DD 형식 또는 Date 객체)
 * @returns 나이 정보 (년, 개월, 일, 총 일수, 총 개월수)
 */
export function calculateHumanAge(birthDate: string | Date): HumanAge {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  // 날짜 정규화 (시간 제거)
  birth.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const totalDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  
  // 년, 개월, 일 계산
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  
  // 일 조정
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  // 개월 조정
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // 총 개월수 계산
  const totalMonths = years * 12 + months;
  
  return {
    years,
    months,
    days,
    totalDays,
    totalMonths,
  };
}

/**
 * 사람의 생애주기 단계 판별
 * @param birthDate 생년월일
 * @returns 생애주기 정보
 */
export function calculateHumanLifecycle(birthDate: string | Date): HumanLifecycleInfo {
  const age = calculateHumanAge(birthDate);
  const years = age.years;
  
  let stage: HumanLifecycleStage;
  let stageLabel: string;
  let nextStage: HumanLifecycleInfo['nextStage'] | undefined;
  
  if (years < 7) {
    stage = 'infant';
    stageLabel = '영유아기 (0-6세)';
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    nextStage = {
      stage: 'adolescent',
      stageLabel: '청소년기 (7-18세)',
      estimatedDate: new Date(birth.getFullYear() + 7, birth.getMonth(), birth.getDate()),
    };
  } else if (years < 19) {
    stage = 'adolescent';
    stageLabel = '청소년기 (7-18세)';
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    nextStage = {
      stage: 'adult',
      stageLabel: '성인기 (19-64세)',
      estimatedDate: new Date(birth.getFullYear() + 19, birth.getMonth(), birth.getDate()),
    };
  } else if (years < 65) {
    stage = 'adult';
    stageLabel = '성인기 (19-64세)';
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    nextStage = {
      stage: 'elderly',
      stageLabel: '노년기 (65세 이상)',
      estimatedDate: new Date(birth.getFullYear() + 65, birth.getMonth(), birth.getDate()),
    };
  } else {
    stage = 'elderly';
    stageLabel = '노년기 (65세 이상)';
  }
  
  return {
    stage,
    stageLabel,
    age,
    nextStage,
  };
}

/**
 * 생애주기 단계 한글명 반환
 */
export function getLifecycleStageLabel(stage: HumanLifecycleStage): string {
  const labels: Record<HumanLifecycleStage, string> = {
    infant: '영유아기',
    adolescent: '청소년기',
    adult: '성인기',
    elderly: '노년기',
  };
  return labels[stage] || stage;
}

/**
 * 나이를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatHumanAge(age: HumanAge): string {
  if (age.years > 0) {
    if (age.months > 0) {
      return `${age.years}세 ${age.months}개월`;
    }
    return `${age.years}세`;
  } else if (age.months > 0) {
    return `${age.months}개월`;
  } else {
    return `${age.days}일`;
  }
}

