/**
 * @file lib/storage/meal-photo-storage.ts
 * @description 식사 사진 저장소
 *
 * 식사 사진을 IndexedDB에 저장하고 조회하는 기능 제공
 * 모든 이미지는 사용자 기기의 로컬 스토리지에만 저장됩니다.
 */

import { getIndexedDBManager, STORES } from "./indexeddb-manager";

export interface MealPhoto {
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  imageData: string; // Base64 인코딩된 이미지 데이터 또는 Blob URL
  imageType: string; // 'image/jpeg', 'image/png' 등
  analyzed: boolean; // AI 분석 완료 여부
  analysisResult?: MealPhotoAnalysis; // AI 분석 결과
  createdAt: string;
  updatedAt: string;
}

export interface MealPhotoAnalysis {
  foods: Array<{
    name: string;
    confidence: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium?: number;
  }>;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium?: number;
  };
  analyzedAt: string;
}

/**
 * 이미지 파일을 Base64로 변환
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 식사 사진 저장
 */
export async function saveMealPhoto(
  userId: string,
  date: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
  imageFile: File
): Promise<string> {
  const manager = getIndexedDBManager();
  await manager.init();

  // 이미지를 Base64로 변환
  const imageData = await fileToBase64(imageFile);

  const mealPhoto: MealPhoto = {
    id: crypto.randomUUID(),
    userId,
    date,
    mealType,
    imageData,
    imageType: imageFile.type,
    analyzed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return manager.save(STORES.MEAL_PHOTOS, mealPhoto);
}

/**
 * 식사 사진 조회
 */
export async function getMealPhoto(
  photoId: string
): Promise<MealPhoto | null> {
  const manager = getIndexedDBManager();
  await manager.init();

  return manager.get<MealPhoto>(STORES.MEAL_PHOTOS, photoId);
}

/**
 * 날짜별 식사 사진 조회
 */
export async function getMealPhotosByDate(
  userId: string,
  date: string
): Promise<MealPhoto[]> {
  const manager = getIndexedDBManager();
  await manager.init();

  const allPhotos = await manager.getAll<MealPhoto>(STORES.MEAL_PHOTOS);
  return allPhotos.filter(
    (photo) => photo.userId === userId && photo.date === date
  );
}

/**
 * 날짜 범위로 식사 사진 조회
 */
export async function getMealPhotosByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<MealPhoto[]> {
  const manager = getIndexedDBManager();
  await manager.init();

  const allPhotos = await manager.getAll<MealPhoto>(STORES.MEAL_PHOTOS);
  return allPhotos.filter(
    (photo) =>
      photo.userId === userId &&
      photo.date >= startDate &&
      photo.date <= endDate
  );
}

/**
 * 식사 사진 분석 결과 업데이트
 */
export async function updateMealPhotoAnalysis(
  photoId: string,
  analysisResult: MealPhotoAnalysis
): Promise<void> {
  const manager = getIndexedDBManager();
  await manager.init();

  const photo = await manager.get<MealPhoto>(STORES.MEAL_PHOTOS, photoId);
  if (!photo) {
    throw new Error("식사 사진을 찾을 수 없습니다");
  }

  const updatedPhoto: MealPhoto = {
    ...photo,
    analyzed: true,
    analysisResult,
    updatedAt: new Date().toISOString(),
  };

  await manager.save(STORES.MEAL_PHOTOS, updatedPhoto);
}

/**
 * 식사 사진 삭제
 */
export async function deleteMealPhoto(photoId: string): Promise<void> {
  const manager = getIndexedDBManager();
  await manager.init();

  await manager.delete(STORES.MEAL_PHOTOS, photoId);
}

