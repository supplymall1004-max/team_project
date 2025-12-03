/**
 * @file lib/royal-recipes/images.ts
 * @description 궁중 레시피 이미지 파일 매칭 유틸리티
 */

import fs from "fs";
import path from "path";
import { RecipeEra, RoyalRecipe } from "./parser";

const IMAGE_DIRS: Record<RecipeEra, { palace: string; modern?: string }> = {
  sanguk: {
    palace: "삼국시대 궁중레시피 사진",
    modern: "삼국시대 레시피 현대 이미지",
  },
  goryeo: {
    palace: "고려시대 궁중레시피 사진",
    // modern: "고려시대 레시피 현대 이미지", // 나중에 추가 예정
  },
  joseon: {
    palace: "조선시대 궁중 레시피 사진",
    // modern: "조선시대 레시피 현대 이미지", // 나중에 추가 예정
  },
};

/**
 * 제목에서 키워드를 추출하여 파일명과 매칭합니다.
 */
function extractTitleKeywords(title: string): string[] {
  // 괄호 제거 및 공백 정리
  const cleaned = title
    .replace(/[()（）]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  // 주요 키워드 추출 (2글자 이상)
  const keywords: string[] = [];
  const words = cleaned.split(/\s+/);
  
  for (const word of words) {
    if (word.length >= 2) {
      keywords.push(word);
    }
  }
  
  return keywords;
}

/**
 * 파일명이 레시피 제목과 매칭되는지 확인합니다.
 */
function isFileMatchingTitle(filename: string, title: string): boolean {
  // 파일명에서 확장자와 번호 제거
  const filenameClean = filename
    .replace(/\.(png|jpg|jpeg)$/i, "")
    .replace(/^\d+\.\s*/, "")
    .toLowerCase()
    .trim();
  
  // 제목 정리 (괄호 내용 정규화)
  const titleClean = title
    .replace(/[()（）]/g, "")
    .replace(/\s*\/\s*/g, "")
    .toLowerCase()
    .trim();
  
  // 주요 키워드 추출 (2글자 이상)
  const titleKeywords = titleClean.split(/\s+/).filter(word => word.length >= 2);
  const filenameKeywords = filenameClean.split(/\s+/).filter(word => word.length >= 2);
  
  // 첫 번째 주요 키워드가 일치하는지 확인 (예: "웅어", "맥적" 등)
  if (titleKeywords.length > 0 && filenameKeywords.length > 0) {
    const firstTitleKeyword = titleKeywords[0];
    const firstFilenameKeyword = filenameKeywords[0];
    
    if (firstTitleKeyword === firstFilenameKeyword || 
        filenameClean.includes(firstTitleKeyword) ||
        titleClean.includes(firstFilenameKeyword)) {
      return true;
    }
  }
  
  // 전체 키워드 매칭 확인
  let matchCount = 0;
  for (const keyword of titleKeywords) {
    if (filenameClean.includes(keyword)) {
      matchCount++;
    }
  }
  
  // 키워드의 절반 이상이 매칭되면 일치로 판단
  return matchCount >= Math.ceil(titleKeywords.length / 2);
}

/**
 * 레시피에 해당하는 궁중 사진 파일을 찾습니다.
 */
export function findPalaceImage(recipe: RoyalRecipe): string | null {
  const imageDir = IMAGE_DIRS[recipe.era].palace;
  const dirPath = path.join(process.cwd(), "docs", "royalrecipe", imageDir);
  
  if (!fs.existsSync(dirPath)) {
    console.warn(`[findPalaceImage] 디렉토리가 없습니다: ${dirPath}`);
    return null;
  }
  
  try {
    const files = fs.readdirSync(dirPath);
    const imageFiles = files.filter(
      (file) => file.toLowerCase().endsWith(".png") || file.toLowerCase().endsWith(".jpg")
    );
    
    // 번호로 먼저 매칭 시도
    const numberedFile = imageFiles.find((file) => {
      const match = file.match(/^(\d+)\./);
      return match && parseInt(match[1], 10) === recipe.number;
    });
    
    if (numberedFile) {
      return `/api/royal-recipes/images/${imageDir}/${numberedFile}`;
    }
    
    // 제목으로 매칭 시도
    const titleMatchedFile = imageFiles.find((file) =>
      isFileMatchingTitle(file, recipe.title)
    );
    
    if (titleMatchedFile) {
      return `/api/royal-recipes/images/${imageDir}/${titleMatchedFile}`;
    }
    
    console.warn(
      `[findPalaceImage] ${recipe.era} - ${recipe.title}에 해당하는 궁중 사진을 찾을 수 없습니다.`
    );
    return null;
  } catch (error) {
    console.error(`[findPalaceImage] 이미지 검색 실패:`, error);
    return null;
  }
}

/**
 * 레시피에 해당하는 현대 이미지 파일을 찾습니다.
 */
export function findModernImage(recipe: RoyalRecipe): string | null {
  const imageDir = IMAGE_DIRS[recipe.era].modern;
  
  if (!imageDir) {
    // 현대 이미지 폴더가 아직 없는 경우
    return null;
  }
  
  const dirPath = path.join(process.cwd(), "docs", "royalrecipe", imageDir);
  
  if (!fs.existsSync(dirPath)) {
    return null;
  }
  
  try {
    const files = fs.readdirSync(dirPath);
    const imageFiles = files.filter(
      (file) => file.toLowerCase().endsWith(".png") || file.toLowerCase().endsWith(".jpg")
    );
    
    // 제목으로 매칭 시도
    const titleMatchedFile = imageFiles.find((file) =>
      isFileMatchingTitle(file, recipe.title)
    );
    
    if (titleMatchedFile) {
      return `/api/royal-recipes/images/${imageDir}/${titleMatchedFile}`;
    }
    
    return null;
  } catch (error) {
    console.error(`[findModernImage] 이미지 검색 실패:`, error);
    return null;
  }
}

/**
 * 레시피의 모든 이미지를 가져옵니다.
 */
export function getRecipeImages(recipe: RoyalRecipe): {
  palace: string | null;
  modern: string | null;
} {
  return {
    palace: findPalaceImage(recipe),
    modern: findModernImage(recipe),
  };
}

