/**
 * @file __tests__/lib/health/diet-conflict-manager.test.ts
 * @description 식단 충돌 관리자 단위 테스트
 */

import {
  checkDietConflicts,
  checkFamilyMemberConflicts,
  checkAllFamilyConflicts,
  isDietTypeBlocked,
  hasDietTypeWarning,
} from "@/lib/health/diet-conflict-manager";
import type { UserHealthProfile } from "@/types/health";
import type { FamilyMember } from "@/types/family";

describe("DietConflictManager", () => {
  describe("checkDietConflicts", () => {
    it("질병이 없으면 충돌이 없어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 30,
        gender: "male",
        height_cm: 175,
        weight_kg: 70,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["fitness", "low_carb"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it("CKD 환자가 fitness 식단을 선택하면 절대 금지되어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 50,
        gender: "male",
        height_cm: 175,
        weight_kg: 70,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [{ code: "kidney_disease", custom_name: null }],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["fitness"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(true);
      expect(result.blockedOptions).toContain("fitness");
      expect(result.conflicts.some((c) => c.diseaseCode === "kidney_disease" && c.dietType === "fitness")).toBe(true);
    });

    it("통풍 환자가 diet 모드를 선택하면 절대 금지되어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 45,
        gender: "male",
        height_cm: 175,
        weight_kg: 80,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [{ code: "gout", custom_name: null }],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: [],
        premium_features: ["diet"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(true);
      expect(result.blockedOptions).toContain("diet_mode");
    });

    it("통풍 환자가 low_carb 식단을 선택하면 절대 금지되어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 45,
        gender: "male",
        height_cm: 175,
        weight_kg: 80,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [{ code: "gout", custom_name: null }],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["low_carb"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(true);
      expect(result.blockedOptions).toContain("low_carb");
    });

    it("통풍 환자가 fitness 식단을 선택하면 경고가 표시되어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 45,
        gender: "male",
        height_cm: 175,
        weight_kg: 80,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [{ code: "gout", custom_name: null }],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["fitness"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].dietType).toBe("fitness");
      expect(result.blockedOptions).not.toContain("fitness");
    });

    it("당뇨병 환자가 low_carb 식단을 선택하면 경고가 표시되어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 50,
        gender: "male",
        height_cm: 175,
        weight_kg: 75,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [{ code: "diabetes", custom_name: null }],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["low_carb"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].dietType).toBe("low_carb");
      expect(result.blockedOptions).not.toContain("low_carb");
    });

    it("어린이(18세 미만)가 diet 모드를 선택하면 절대 금지되어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 15,
        gender: "male",
        height_cm: 160,
        weight_kg: 50,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: [],
        premium_features: ["diet"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(true);
      expect(result.blockedOptions).toContain("diet_mode");
      expect(result.conflicts.some((c) => c.diseaseCode === "age_restriction")).toBe(true);
    });

    it("어린이(18세 미만)가 low_carb 식단을 선택하면 절대 금지되어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 16,
        gender: "female",
        height_cm: 155,
        weight_kg: 48,
        activity_level: "moderate",
        daily_calorie_goal: 1800,
        diseases: [],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["low_carb"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(true);
      expect(result.blockedOptions).toContain("low_carb");
    });

    it("성인(18세 이상)은 나이 기반 제한이 없어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 20,
        gender: "male",
        height_cm: 175,
        weight_kg: 70,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["low_carb", "fitness"],
        premium_features: ["diet"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      const ageBasedConflicts = result.conflicts.filter((c) => c.diseaseCode === "age_restriction");
      expect(ageBasedConflicts).toHaveLength(0);
    });

    it("여러 질병과 여러 식단이 충돌하는 경우 모두 감지되어야 함", () => {
      const profile: UserHealthProfile = {
        id: "test-id",
        user_id: "test-user-id",
        age: 50,
        gender: "male",
        height_cm: 175,
        weight_kg: 80,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [
          { code: "kidney_disease", custom_name: null },
          { code: "gout", custom_name: null },
        ],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["fitness", "low_carb"],
        premium_features: ["diet"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkDietConflicts(profile);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(1);
      expect(result.blockedOptions.length).toBeGreaterThan(0);
    });
  });

  describe("checkFamilyMemberConflicts", () => {
    it("가족 구성원의 충돌을 올바르게 감지해야 함", () => {
      const member: FamilyMember = {
        id: "member-id",
        user_id: "user-id",
        name: "테스트 구성원",
        birth_date: "2010-01-01", // 14세
        gender: "male",
        relationship: "child",
        diseases: ["kidney_disease"],
        allergies: [],
        dietary_preferences: ["fitness"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = checkFamilyMemberConflicts(member);
      expect(result.hasConflict).toBe(true);
      expect(result.blockedOptions).toContain("fitness");
    });
  });

  describe("checkAllFamilyConflicts", () => {
    it("전체 가족의 충돌을 모두 검사해야 함", () => {
      const userProfile: UserHealthProfile = {
        id: "user-id",
        user_id: "user-id",
        age: 40,
        gender: "male",
        height_cm: 175,
        weight_kg: 75,
        activity_level: "moderate",
        daily_calorie_goal: 2000,
        diseases: [{ code: "gout", custom_name: null }],
        allergies: [],
        preferred_ingredients: [],
        disliked_ingredients: [],
        dietary_preferences: ["low_carb"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const familyMembers: FamilyMember[] = [
        {
          id: "member-1",
          user_id: "user-id",
          name: "구성원 1",
          birth_date: "2005-01-01",
          gender: "male",
          relationship: "child",
          diseases: ["kidney_disease"],
          allergies: [],
          dietary_preferences: ["fitness"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const results = checkAllFamilyConflicts(userProfile, familyMembers);
      expect(results).toHaveLength(2); // 본인 + 구성원 1
      expect(results[0].memberName).toBe("본인");
      expect(results[1].memberName).toBe("구성원 1");
      expect(results[0].conflicts.hasConflict).toBe(true);
      expect(results[1].conflicts.hasConflict).toBe(true);
    });
  });

  describe("isDietTypeBlocked", () => {
    it("차단된 식단 타입을 올바르게 확인해야 함", () => {
      const result = {
        hasConflict: true,
        conflicts: [],
        blockedOptions: ["fitness", "low_carb"],
        warnings: [],
        cautions: [],
      };

      expect(isDietTypeBlocked(result, "fitness")).toBe(true);
      expect(isDietTypeBlocked(result, "low_carb")).toBe(true);
      expect(isDietTypeBlocked(result, "vegan")).toBe(false);
    });
  });

  describe("hasDietTypeWarning", () => {
    it("경고가 있는 식단 타입을 올바르게 확인해야 함", () => {
      const result = {
        hasConflict: true,
        conflicts: [],
        blockedOptions: [],
        warnings: [
          {
            diseaseCode: "gout",
            dietType: "fitness",
            severity: "warning" as const,
            reason: "테스트",
            medicalSource: "테스트",
          },
        ],
        cautions: [],
      };

      expect(hasDietTypeWarning(result, "fitness")).toBe(true);
      expect(hasDietTypeWarning(result, "low_carb")).toBe(false);
    });
  });
});

