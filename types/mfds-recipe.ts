/**
 * @file types/mfds-recipe.ts
 * @description 식약처 레시피 관련 TypeScript 타입 정의
 */

/**
 * 영양 정보
 */
export interface MfdsNutritionInfo {
  /** 칼로리 (kcal) */
  calories: number | null;
  /** 나트륨 (mg) */
  sodium: number | null;
  /** 탄수화물 (g) */
  carbohydrates: number | null;
  /** 단백질 (g) */
  protein: number | null;
  /** 지방 (g) */
  fat: number | null;
  /** 식이섬유 (g) */
  fiber: number | null;
}

/**
 * 재료 정보
 */
export interface MfdsIngredient {
  /** 재료명 */
  name: string;
  /** 카테고리 (주재료, 양념장 등) */
  category?: string;
}

/**
 * 조리 단계
 */
export interface MfdsRecipeStep {
  /** 단계 번호 (1부터 시작) */
  step: number;
  /** 조리 설명 */
  description: string;
  /** 조리 단계 이미지 URL (원본 URL 우선, 없으면 로컬 경로) */
  imageUrl: string | null;
  /** 조리 단계 이미지 원본 URL */
  originalImageUrl: string | null;
  /** 조리 단계 이미지 로컬 경로 */
  localImagePath: string | null;
}

/**
 * 레시피 이미지 정보
 */
export interface MfdsRecipeImages {
  /** 대표 이미지 URL (원본 URL 우선) */
  mainImageUrl: string | null;
  /** 대표 이미지 원본 URL */
  mainImageOriginalUrl: string | null;
  /** 대표 이미지 로컬 경로 */
  mainImageLocalPath: string | null;
  /** 만드는 법 이미지 URL (원본 URL 우선) */
  mkImageUrl: string | null;
  /** 만드는 법 이미지 원본 URL */
  mkImageOriginalUrl: string | null;
  /** 만드는 법 이미지 로컬 경로 */
  mkImageLocalPath: string | null;
}

/**
 * 레시피 Frontmatter 정보
 */
export interface MfdsRecipeFrontmatter {
  /** 레시피 순번 */
  rcp_seq: string;
  /** 레시피명 */
  rcp_nm: string;
  /** 조리방법 */
  rcp_way2: string;
  /** 요리종류 */
  rcp_pat2: string;
}

/**
 * 식약처 레시피 전체 정보
 */
export interface MfdsRecipe {
  /** Frontmatter 정보 */
  frontmatter: MfdsRecipeFrontmatter;
  /** 레시피 제목 */
  title: string;
  /** 레시피 설명 */
  description: string;
  /** 재료 목록 */
  ingredients: MfdsIngredient[];
  /** 조리 단계 목록 */
  steps: MfdsRecipeStep[];
  /** 영양 정보 */
  nutrition: MfdsNutritionInfo;
  /** 이미지 정보 */
  images: MfdsRecipeImages;
  /** 원본 마크다운 내용 (참고사항 섹션 포함) */
  rawContent: string;
}

