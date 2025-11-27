/**
 * @file lib/utils/health-labels.ts
 * @description 건강 라벨 유틸리티 - 질병/알레르기 한글명 변환
 */

import { DISEASE_LABELS, ALLERGY_LABELS } from "@/types/family";

/**
 * 질병 코드를 한글명으로 변환
 */
export function getHealthLabels(diseases?: string[]): string[] {
  if (!diseases || diseases.length === 0) return [];
  
  return diseases
    .map((disease) => DISEASE_LABELS[disease] || disease)
    .filter(Boolean);
}

/**
 * 알레르기 코드를 한글명으로 변환
 */
export function getAllergyLabels(allergies?: string[]): string[] {
  if (!allergies || allergies.length === 0) return [];
  
  return allergies
    .map((allergy) => ALLERGY_LABELS[allergy] || allergy)
    .filter(Boolean);
}

/**
 * 건강 상태 요약 텍스트 생성
 */
export function getHealthSummary(diseases?: string[], allergies?: string[]): string {
  const diseaseLabels = getHealthLabels(diseases);
  const allergyLabels = getAllergyLabels(allergies);
  
  const summary = [];
  
  if (diseaseLabels.length > 0) {
    summary.push(diseaseLabels.slice(0, 2).join(", "));
  }
  
  if (allergyLabels.length > 0) {
    summary.push(`알레르기: ${allergyLabels.slice(0, 1).join(", ")}`);
  }
  
  return summary.join(" | ") || "건강 정보 없음";
}

