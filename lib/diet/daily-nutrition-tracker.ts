/**
 * @file lib/diet/daily-nutrition-tracker.ts
 * @description 일일 영양소 추적 모듈
 *
 * 주요 기능:
 * 1. 질병별 일일 영양소 제한량 계산
 * 2. 레시피 추가 가능 여부 확인
 * 3. 일일 영양소 누적 추적
 * 4. 잔여량 조회
 */

import type { RecipeDetailForDiet } from "@/types/recipe";
import type { UserHealthProfile } from "@/types/health";
import type { RecipeWarning } from "@/types/recipe";
import { estimateSugarContent } from "./recipe-classifier";

/**
 * 일일 영양소 추적기
 */
export class DailyNutritionTracker {
  private nutrition: {
    sugar: number; // 당 (g)
    sodium: number; // 나트륨 (mg)
    fat: number; // 지방 (g)
    potassium: number; // 칼륨 (mg)
    phosphorus: number; // 인 (mg)
    purine: number; // 퓨린 (mg)
  } = {
    sugar: 0,
    sodium: 0,
    fat: 0,
    potassium: 0,
    phosphorus: 0,
    purine: 0
  };
  
  private limits: {
    sugar?: number;
    sodium?: number;
    fat?: number;
    potassium?: number;
    phosphorus?: number;
    purine?: number;
  };
  
  constructor(healthProfile: UserHealthProfile) {
    this.limits = this.calculateLimits(healthProfile);
    console.group("[DailyNutritionTracker] 초기화");
    console.log("질병:", healthProfile.diseases);
    console.log("제한량:", this.limits);
    console.groupEnd();
  }
  
  /**
   * 질병별 일일 제한량 계산 (개선됨)
   * 
   * 출처:
   * - 당뇨병: 대한당뇨병학회, ADA 가이드라인 (일일 당 50g 이하)
   * - 고혈압: AHA 가이드라인 (일일 나트륨 2000mg 이하, 이상적으로 1500mg)
   * - 신장질환: KDOQI 가이드라인 (칼륨 2000mg, 인 800mg)
   * - 통풍: ACR 가이드라인 (퓨린 400mg)
   * - 심혈관질환: AHA 가이드라인 (나트륨 1500mg)
   */
  private calculateLimits(profile: UserHealthProfile) {
    const limits: {
      sugar?: number;
      sodium?: number;
      fat?: number;
      potassium?: number;
      phosphorus?: number;
      purine?: number;
    } = {};
    
    const diseases = profile.diseases || [];
    
    // 당뇨병: 일일 당 섭취량 제한 (50g) - 개선된 g 기반 제한
    if (diseases.includes('diabetes') || diseases.includes('diabetes_type2')) {
      limits.sugar = 50; // 당뇨 환자 일일 당(sugar) 섭취량 제한 (g)
      console.log('[당뇨병] 일일 당 섭취량 제한: 50g (식사당 약 15-20g)');
    }
    
    // 고혈압: 일일 나트륨 목표 (2000mg, 이상적으로 1500mg)
    if (diseases.includes('hypertension')) {
      limits.sodium = 2000; // 고혈압 환자 일일 나트륨 목표 (mg)
      console.log('[고혈압] 일일 나트륨 제한: 2000mg (식사당 약 600-700mg)');
    }
    
    // 고지혈증: 일일 지방 제한 (65g, 칼로리의 30%)
    if (diseases.includes('hyperlipidemia')) {
      limits.fat = 65; // 고지혈증 환자 일일 지방 제한 (g)
      console.log('[고지혈증] 일일 지방 제한: 65g (식사당 약 20g)');
    }
    
    // 신장 질환: 일일 칼륨/인 제한
    if (diseases.includes('ckd') || diseases.includes('kidney_disease')) {
      limits.potassium = 2000; // 신장 질환 환자 일일 칼륨 제한 (mg)
      limits.phosphorus = 800; // 신장 질환 환자 일일 인 제한 (mg)
      console.log('[신장질환] 일일 칼륨 제한: 2000mg, 인 제한: 800mg');
    }
    
    // 심혈관 질환: 일일 나트륨 강화 제한
    if (diseases.includes('cardiovascular_disease')) {
      limits.sodium = Math.min(limits.sodium || 2000, 1500); // 더 엄격한 제한
      console.log('[심혈관질환] 일일 나트륨 제한 강화: 1500mg');
    }
    
    // 통풍: 일일 퓨린 제한
    if (diseases.includes('gout')) {
      limits.purine = 400; // 통풍 환자 일일 퓨린 제한 (mg)
      console.log('[통풍] 일일 퓨린 제한: 400mg (식사당 약 100-150mg)');
    }
    
    return limits;
  }
  
  /**
   * 레시피 추가 가능 여부 확인
   */
  canAddRecipe(recipe: RecipeDetailForDiet): {
    canAdd: boolean;
    warnings?: RecipeWarning[];
    reasons?: string[];
  } {
    const warnings: RecipeWarning[] = [];
    const reasons: string[] = [];
    
    console.group(`[DailyNutritionTracker] 레시피 추가 가능 여부 확인: ${recipe.title}`);
    
    // 당 함량 체크
    if (this.limits.sugar !== undefined) {
      const recipeSugar = estimateSugarContent(recipe);
      const newTotal = this.nutrition.sugar + recipeSugar;
      
      console.log(`당 함량: 현재 ${this.nutrition.sugar.toFixed(1)}g + 레시피 ${recipeSugar.toFixed(1)}g = ${newTotal.toFixed(1)}g (제한: ${this.limits.sugar}g)`);
      
      if (newTotal > this.limits.sugar) {
        reasons.push(`일일 당 섭취량 초과 (${newTotal.toFixed(1)}g > ${this.limits.sugar}g)`);
        console.log(`❌ 당 섭취량 초과`);
        console.groupEnd();
        return { canAdd: false, reasons };
      }
      
      if (recipeSugar > 0) {
        const remaining = this.limits.sugar - this.nutrition.sugar;
        warnings.push({
          type: 'sugar',
          message: `설탕 또는 당을 조절하여 섭취하시기 바랍니다 (일일 잔여량: ${remaining.toFixed(1)}g)`,
          value: recipeSugar,
          unit: 'g',
          severity: recipeSugar > 10 ? 'high' : 'moderate'
        });
      }
    }
    
    // 나트륨 함량 체크
    if (this.limits.sodium !== undefined) {
      const recipeSodium = recipe.nutrition.sodium || 0;
      const newTotal = this.nutrition.sodium + recipeSodium;
      
      console.log(`나트륨 함량: 현재 ${this.nutrition.sodium.toFixed(1)}mg + 레시피 ${recipeSodium.toFixed(1)}mg = ${newTotal.toFixed(1)}mg (제한: ${this.limits.sodium}mg)`);
      
      if (newTotal > this.limits.sodium) {
        reasons.push(`일일 나트륨 섭취량 초과 (${newTotal.toFixed(1)}mg > ${this.limits.sodium}mg)`);
        console.log(`❌ 나트륨 섭취량 초과`);
        console.groupEnd();
        return { canAdd: false, reasons };
      }
      
      if (recipeSodium > 500) { // 500mg 이상이면 주의사항 추가
        const remaining = this.limits.sodium - this.nutrition.sodium;
        warnings.push({
          type: 'sodium',
          message: `나트륨을 조절하여 섭취하시기 바랍니다 (일일 잔여량: ${remaining.toFixed(0)}mg)`,
          value: recipeSodium,
          unit: 'mg',
          severity: recipeSodium > 700 ? 'high' : 'moderate'
        });
      }
    }
    
    // 지방 함량 체크
    if (this.limits.fat !== undefined) {
      const recipeFat = recipe.nutrition.fat || 0;
      const newTotal = this.nutrition.fat + recipeFat;
      
      if (newTotal > this.limits.fat) {
        reasons.push(`일일 지방 섭취량 초과 (${newTotal.toFixed(1)}g > ${this.limits.fat}g)`);
        console.log(`❌ 지방 섭취량 초과`);
        console.groupEnd();
        return { canAdd: false, reasons };
      }
      
      if (recipeFat > 15) { // 15g 이상이면 주의사항 추가
        const remaining = this.limits.fat - this.nutrition.fat;
        warnings.push({
          type: 'fat',
          message: `지방을 조절하여 섭취하시기 바랍니다 (일일 잔여량: ${remaining.toFixed(1)}g)`,
          value: recipeFat,
          unit: 'g',
          severity: recipeFat > 25 ? 'high' : 'moderate'
        });
      }
    }
    
    // 칼륨 함량 체크
    if (this.limits.potassium !== undefined) {
      const recipePotassium = recipe.nutrition.potassium || 0;
      const newTotal = this.nutrition.potassium + recipePotassium;
      
      if (newTotal > this.limits.potassium) {
        reasons.push(`일일 칼륨 섭취량 초과 (${newTotal.toFixed(1)}mg > ${this.limits.potassium}mg)`);
        console.log(`❌ 칼륨 섭취량 초과`);
        console.groupEnd();
        return { canAdd: false, reasons };
      }
      
      if (recipePotassium > 200) { // 200mg 이상이면 주의사항 추가
        const remaining = this.limits.potassium - this.nutrition.potassium;
        warnings.push({
          type: 'potassium',
          message: `칼륨을 조절하여 섭취하시기 바랍니다 (일일 잔여량: ${remaining.toFixed(0)}mg)`,
          value: recipePotassium,
          unit: 'mg',
          severity: recipePotassium > 300 ? 'high' : 'moderate'
        });
      }
    }
    
    // 인 함량 체크
    if (this.limits.phosphorus !== undefined) {
      const recipePhosphorus = recipe.nutrition.phosphorus || 0;
      const newTotal = this.nutrition.phosphorus + recipePhosphorus;
      
      if (newTotal > this.limits.phosphorus) {
        reasons.push(`일일 인 섭취량 초과 (${newTotal.toFixed(1)}mg > ${this.limits.phosphorus}mg)`);
        console.log(`❌ 인 섭취량 초과`);
        console.groupEnd();
        return { canAdd: false, reasons };
      }
      
      if (recipePhosphorus > 150) { // 150mg 이상이면 주의사항 추가
        const remaining = this.limits.phosphorus - this.nutrition.phosphorus;
        warnings.push({
          type: 'phosphorus',
          message: `인을 조절하여 섭취하시기 바랍니다 (일일 잔여량: ${remaining.toFixed(0)}mg)`,
          value: recipePhosphorus,
          unit: 'mg',
          severity: recipePhosphorus > 200 ? 'high' : 'moderate'
        });
      }
    }
    
    console.log(`✅ 레시피 추가 가능`);
    if (warnings.length > 0) {
      console.log(`⚠️ 주의사항 ${warnings.length}개`);
    }
    console.groupEnd();
    
    return {
      canAdd: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  /**
   * 레시피 추가
   */
  addRecipe(recipe: RecipeDetailForDiet) {
    const sugar = estimateSugarContent(recipe);
    this.nutrition.sugar += sugar;
    this.nutrition.sodium += recipe.nutrition.sodium || 0;
    this.nutrition.fat += recipe.nutrition.fat || 0;
    this.nutrition.potassium += recipe.nutrition.potassium || 0;
    this.nutrition.phosphorus += recipe.nutrition.phosphorus || 0;
    // 퓨린은 현재 영양 정보에 없으므로 추후 추가 가능
    
    console.log(`[DailyNutritionTracker] 레시피 추가: ${recipe.title}`);
    console.log(`현재 영양소:`, this.nutrition);
  }
  
  /**
   * 현재 영양소 상태 조회
   */
  getCurrentNutrition() {
    return { ...this.nutrition };
  }
  
  /**
   * 잔여량 조회
   */
  getRemaining() {
    const remaining: {
      sugar?: number;
      sodium?: number;
      fat?: number;
      potassium?: number;
      phosphorus?: number;
      purine?: number;
    } = {};
    
    if (this.limits.sugar !== undefined) {
      remaining.sugar = Math.max(0, this.limits.sugar - this.nutrition.sugar);
    }
    if (this.limits.sodium !== undefined) {
      remaining.sodium = Math.max(0, this.limits.sodium - this.nutrition.sodium);
    }
    if (this.limits.fat !== undefined) {
      remaining.fat = Math.max(0, this.limits.fat - this.nutrition.fat);
    }
    if (this.limits.potassium !== undefined) {
      remaining.potassium = Math.max(0, this.limits.potassium - this.nutrition.potassium);
    }
    if (this.limits.phosphorus !== undefined) {
      remaining.phosphorus = Math.max(0, this.limits.phosphorus - this.nutrition.phosphorus);
    }
    if (this.limits.purine !== undefined) {
      remaining.purine = Math.max(0, this.limits.purine - this.nutrition.purine);
    }
    
    return remaining;
  }
  
  /**
   * 제한량 조회
   */
  getLimits() {
    return { ...this.limits };
  }
  
  /**
   * 리셋 (새로운 날짜 시작 시)
   */
  reset() {
    this.nutrition = {
      sugar: 0,
      sodium: 0,
      fat: 0,
      potassium: 0,
      phosphorus: 0,
      purine: 0
    };
    console.log('[DailyNutritionTracker] 리셋 완료');
  }
}

