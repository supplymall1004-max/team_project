/**
 * @file lib/health/pet-lifecycle-calculator.ts
 * @description 반려동물 생애주기 계산 로직 (AVMA/AAHA 기준)
 * 
 * AVMA (American Veterinary Medical Association) 및
 * AAHA (American Animal Hospital Association) 기준으로
 * 반려동물의 생애주기 단계를 판별하고 나이를 계산합니다.
 * 
 * 생애주기 단계:
 * - 강아지: Puppy (0-6개월), Junior (6-12개월), Adult (1-7세), 
 *           Mature Adult (7-10세), Senior (10-12세), Geriatric (12세 이상)
 * - 고양이: Kitten (0-6개월), Junior (6-12개월), Adult (1-7세),
 *           Mature Adult (7-10세), Senior (10-15세), Geriatric (15세 이상)
 */

export type PetType = 'dog' | 'cat' | 'other';
export type PetLifecycleStage = 
  | 'puppy' | 'kitten' 
  | 'junior' 
  | 'adult' 
  | 'mature_adult' 
  | 'senior' 
  | 'geriatric';

export interface PetAge {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalMonths: number;
}

export interface PetLifecycleInfo {
  stage: PetLifecycleStage;
  stageLabel: string;
  age: PetAge;
  nextStage?: {
    stage: PetLifecycleStage;
    stageLabel: string;
    estimatedDate: Date;
  };
}

/**
 * 생년월일로부터 반려동물의 나이 계산
 * @param birthDate 생년월일 (YYYY-MM-DD 형식 또는 Date 객체)
 * @returns 나이 정보 (년, 개월, 일, 총 일수, 총 개월수)
 */
export function calculatePetAge(birthDate: string | Date): PetAge {
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
  
  // 총 개월수 계산 (대략적)
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
 * AVMA/AAHA 기준으로 반려동물의 생애주기 단계 판별
 * @param petType 반려동물 종류 ('dog' | 'cat' | 'other')
 * @param birthDate 생년월일
 * @returns 생애주기 정보
 */
export function calculatePetLifecycle(
  petType: PetType,
  birthDate: string | Date
): PetLifecycleInfo {
  const age = calculatePetAge(birthDate);
  const totalMonths = age.totalMonths;
  
  let stage: PetLifecycleStage;
  let stageLabel: string;
  let nextStage: PetLifecycleInfo['nextStage'] | undefined;
  
  if (petType === 'dog') {
    // 강아지 생애주기 단계
    if (totalMonths < 6) {
      stage = 'puppy';
      stageLabel = '강아지 (Puppy)';
      nextStage = {
        stage: 'junior',
        stageLabel: '청소년기 (Junior)',
        estimatedDate: new Date(new Date(birthDate).setMonth(new Date(birthDate).getMonth() + 6)),
      };
    } else if (totalMonths < 12) {
      stage = 'junior';
      stageLabel = '청소년기 (Junior)';
      nextStage = {
        stage: 'adult',
        stageLabel: '성견 (Adult)',
        estimatedDate: new Date(new Date(birthDate).setFullYear(new Date(birthDate).getFullYear() + 1)),
      };
    } else if (age.years < 7) {
      stage = 'adult';
      stageLabel = '성견 (Adult)';
      const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      nextStage = {
        stage: 'mature_adult',
        stageLabel: '성숙한 성견 (Mature Adult)',
        estimatedDate: new Date(birth.getFullYear() + 7, birth.getMonth(), birth.getDate()),
      };
    } else if (age.years < 10) {
      stage = 'mature_adult';
      stageLabel = '성숙한 성견 (Mature Adult)';
      const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      nextStage = {
        stage: 'senior',
        stageLabel: '노령견 (Senior)',
        estimatedDate: new Date(birth.getFullYear() + 10, birth.getMonth(), birth.getDate()),
      };
    } else if (age.years < 12) {
      stage = 'senior';
      stageLabel = '노령견 (Senior)';
      const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      nextStage = {
        stage: 'geriatric',
        stageLabel: '고령견 (Geriatric)',
        estimatedDate: new Date(birth.getFullYear() + 12, birth.getMonth(), birth.getDate()),
      };
    } else {
      stage = 'geriatric';
      stageLabel = '고령견 (Geriatric)';
    }
  } else if (petType === 'cat') {
    // 고양이 생애주기 단계
    if (totalMonths < 6) {
      stage = 'kitten';
      stageLabel = '새끼 고양이 (Kitten)';
      nextStage = {
        stage: 'junior',
        stageLabel: '청소년기 (Junior)',
        estimatedDate: new Date(new Date(birthDate).setMonth(new Date(birthDate).getMonth() + 6)),
      };
    } else if (totalMonths < 12) {
      stage = 'junior';
      stageLabel = '청소년기 (Junior)';
      nextStage = {
        stage: 'adult',
        stageLabel: '성묘 (Adult)',
        estimatedDate: new Date(new Date(birthDate).setFullYear(new Date(birthDate).getFullYear() + 1)),
      };
    } else if (age.years < 7) {
      stage = 'adult';
      stageLabel = '성묘 (Adult)';
      const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      nextStage = {
        stage: 'mature_adult',
        stageLabel: '성숙한 성묘 (Mature Adult)',
        estimatedDate: new Date(birth.getFullYear() + 7, birth.getMonth(), birth.getDate()),
      };
    } else if (age.years < 10) {
      stage = 'mature_adult';
      stageLabel = '성숙한 성묘 (Mature Adult)';
      const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      nextStage = {
        stage: 'senior',
        stageLabel: '노묘 (Senior)',
        estimatedDate: new Date(birth.getFullYear() + 10, birth.getMonth(), birth.getDate()),
      };
    } else if (age.years < 15) {
      stage = 'senior';
      stageLabel = '노묘 (Senior)';
      const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      nextStage = {
        stage: 'geriatric',
        stageLabel: '고령묘 (Geriatric)',
        estimatedDate: new Date(birth.getFullYear() + 15, birth.getMonth(), birth.getDate()),
      };
    } else {
      stage = 'geriatric';
      stageLabel = '고령묘 (Geriatric)';
    }
  } else {
    // 기타 반려동물 (기본값)
    if (totalMonths < 6) {
      stage = 'puppy';
      stageLabel = '유년기';
    } else if (totalMonths < 12) {
      stage = 'junior';
      stageLabel = '청소년기';
    } else if (age.years < 7) {
      stage = 'adult';
      stageLabel = '성체';
    } else {
      stage = 'senior';
      stageLabel = '노령';
    }
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
export function getLifecycleStageLabel(
  stage: PetLifecycleStage,
  petType: PetType
): string {
  const labels: Record<PetType, Record<PetLifecycleStage, string>> = {
    dog: {
      puppy: '강아지',
      kitten: '강아지', // 강아지는 kitten 사용 안 함
      junior: '청소년기',
      adult: '성견',
      mature_adult: '성숙한 성견',
      senior: '노령견',
      geriatric: '고령견',
    },
    cat: {
      puppy: '새끼 고양이', // 고양이는 puppy 사용 안 함
      kitten: '새끼 고양이',
      junior: '청소년기',
      adult: '성묘',
      mature_adult: '성숙한 성묘',
      senior: '노묘',
      geriatric: '고령묘',
    },
    other: {
      puppy: '유년기',
      kitten: '유년기',
      junior: '청소년기',
      adult: '성체',
      mature_adult: '성숙한 성체',
      senior: '노령',
      geriatric: '고령',
    },
  };
  
  return labels[petType]?.[stage] || stage;
}

/**
 * 나이를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatPetAge(age: PetAge): string {
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

