/**
 * @file health-tab-activator.ts
 * @description 사용자 건강 정보를 기반으로 활성화할 건강 정보 탭을 결정하는 로직
 *
 * 주요 기능:
 * 1. 질병 코드를 탭 타입으로 매핑
 * 2. 알레르기 정보 기반 탭 활성화
 * 3. 성별/나이 기반 탭 활성화
 */

import type { UserHealthProfile } from '@/types/health';
import type { HealthTabType, HealthTabConfig } from '@/types/health-tabs';
import { HEALTH_TAB_CONFIGS } from '@/types/health-tabs';

/**
 * 사용자 건강 정보를 기반으로 활성화할 탭 목록을 반환
 */
export function getActiveHealthTabs(
  healthProfile: UserHealthProfile | null
): HealthTabType[] {
  if (!healthProfile) {
    return [];
  }

  const activeTabs: HealthTabType[] = [];
  const tabTypes = Object.keys(HEALTH_TAB_CONFIGS) as HealthTabType[];

  for (const tabType of tabTypes) {
    const config = HEALTH_TAB_CONFIGS[tabType];

    // 질병 기반 탭 활성화
    if (config.diseaseCodes && healthProfile.diseases.length > 0) {
      const hasMatchingDisease = healthProfile.diseases.some((disease) =>
        config.diseaseCodes!.includes(disease.code)
      );
      if (hasMatchingDisease) {
        activeTabs.push(tabType);
        continue;
      }
    }

    // 알레르기 기반 탭 활성화
    if (config.type === 'allergy' && healthProfile.allergies.length > 0) {
      activeTabs.push(tabType);
      continue;
    }

    // 성별 기반 탭 활성화
    if (config.requiresGender && healthProfile.gender === config.requiresGender) {
      // 다이어트 탭은 성별만으로 활성화
      if (config.type === 'diet_male' || config.type === 'diet_female') {
        activeTabs.push(tabType);
        continue;
      }
      // 임산부 탭은 성별이 여성이고 임신 상태가 있을 때만 활성화 (추후 확장)
      // if (config.type === 'maternity' && healthProfile.pregnancy_status) {
      //   activeTabs.push(tabType);
      //   continue;
      // }
    }

    // 나이 기반 탭 활성화
    if (config.requiresAge && healthProfile.age !== null) {
      const { min, max } = config.requiresAge;
      const age = healthProfile.age;
      if (
        (min === undefined || age >= min) &&
        (max === undefined || age <= max)
      ) {
        activeTabs.push(tabType);
        continue;
      }
    }
  }

  // 중복 제거 및 정렬
  return [...new Set(activeTabs)].sort();
}

/**
 * 질병 코드를 탭 타입으로 매핑
 */
export function mapDiseaseCodeToTabType(diseaseCode: string): HealthTabType | null {
  for (const [tabType, config] of Object.entries(HEALTH_TAB_CONFIGS)) {
    if (config.diseaseCodes?.includes(diseaseCode)) {
      return tabType as HealthTabType;
    }
  }
  return null;
}

/**
 * 알레르기 코드를 탭 타입으로 매핑
 */
export function mapAllergyCodeToTabType(allergyCode: string): HealthTabType | null {
  // 알레르기는 모두 'allergy' 탭으로 통합
  return 'allergy';
}
