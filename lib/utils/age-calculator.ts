/**
 * @file lib/utils/age-calculator.ts
 * @description 나이 계산 유틸리티
 */

/**
 * 생년월일로부터 나이와 어린이 여부 계산
 * 
 * @param birthDate - 'YYYY-MM-DD' 형식의 생년월일
 * @returns 나이, 어린이 여부 (18세 미만)
 */
export function calculateAge(birthDate: string): {
  years: number;
  isChild: boolean;
} {
  const birth = new Date(birthDate);
  const today = new Date();
  
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // 생일이 아직 지나지 않았으면 나이에서 1 빼기
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  
  return {
    years,
    isChild: years < 18,
  };
}

