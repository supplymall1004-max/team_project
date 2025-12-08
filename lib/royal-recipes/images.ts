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
  
  // 제목 정리 (괄호 내용 정규화, 슬래시를 공백으로 변환)
  const titleClean = title
    .replace(/[()（）]/g, "") // 괄호 제거
    .replace(/\s*\/\s*/g, "") // 슬래시 제거 (예: "웅어회/구이" -> "웅어회구이")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
  
  // 파일명도 괄호 제거하여 비교
  const filenameCleanNoBrackets = filenameClean
    .replace(/[()（）]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  // 정확히 일치하는 경우
  if (filenameCleanNoBrackets === titleClean) {
    return true;
  }
  
  // 파일명이 제목을 포함하거나 제목이 파일명을 포함하는 경우
  if (filenameCleanNoBrackets.includes(titleClean) || titleClean.includes(filenameCleanNoBrackets)) {
    return true;
  }
  
  // 주요 키워드 추출 (2글자 이상)
  const titleKeywords = titleClean.split(/\s+/).filter(word => word.length >= 2);
  const filenameKeywords = filenameCleanNoBrackets.split(/\s+/).filter(word => word.length >= 2);
  
  // 첫 번째 주요 키워드가 일치하는지 확인 (예: "웅어", "맥적" 등)
  if (titleKeywords.length > 0 && filenameKeywords.length > 0) {
    const firstTitleKeyword = titleKeywords[0];
    const firstFilenameKeyword = filenameKeywords[0];
    
    if (firstTitleKeyword === firstFilenameKeyword || 
        filenameCleanNoBrackets.includes(firstTitleKeyword) ||
        titleClean.includes(firstFilenameKeyword)) {
      return true;
    }
  }
  
  // 전체 키워드 매칭 확인
  let matchCount = 0;
  for (const keyword of titleKeywords) {
    if (filenameCleanNoBrackets.includes(keyword)) {
      matchCount++;
    }
  }
  
  // 키워드의 절반 이상이 매칭되면 일치로 판단
  return matchCount >= Math.ceil(titleKeywords.length / 2);
}

/**
 * 레시피에 해당하는 궁중 사진 파일을 찾습니다.
 * public/images/royalrecipe 폴더에 있는 이미지를 직접 URL로 반환합니다.
 */
export function findPalaceImage(recipe: RoyalRecipe): string | null {
  const imageDir = IMAGE_DIRS[recipe.era].palace;
  const dirPath = path.join(process.cwd(), "public", "images", "royalrecipe", imageDir);
  
  if (!fs.existsSync(dirPath)) {
    console.warn(`[findPalaceImage] 디렉토리가 없습니다: ${dirPath}`);
    return null;
  }
  
  try {
    const files = fs.readdirSync(dirPath);
    const imageFiles = files.filter(
      (file) => file.toLowerCase().endsWith(".png") || file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".jpeg")
    );
    
    console.log(`[findPalaceImage] ${recipe.era} - ${recipe.title} (번호: ${recipe.number})`);
    console.log(`[findPalaceImage] 찾은 이미지 파일 수: ${imageFiles.length}`);
    
    // 번호로 먼저 매칭 시도
    const numberedFile = imageFiles.find((file) => {
      const match = file.match(/^(\d+)\./);
      return match && parseInt(match[1], 10) === recipe.number;
    });
    
    if (numberedFile) {
      // public/images/royalrecipe 폴더는 /images/royalrecipe/ URL로 접근 가능
      const imageUrl = `/images/royalrecipe/${encodeURIComponent(imageDir)}/${encodeURIComponent(numberedFile)}`;
      console.log(`[findPalaceImage] 번호로 매칭 성공: ${numberedFile} -> ${imageUrl}`);
      return imageUrl;
    }
    
    // 제목으로 매칭 시도
    const titleMatchedFile = imageFiles.find((file) =>
      isFileMatchingTitle(file, recipe.title)
    );
    
    if (titleMatchedFile) {
      // public/images/royalrecipe 폴더는 /images/royalrecipe/ URL로 접근 가능
      const imageUrl = `/images/royalrecipe/${encodeURIComponent(imageDir)}/${encodeURIComponent(titleMatchedFile)}`;
      console.log(`[findPalaceImage] 제목으로 매칭 성공: ${titleMatchedFile} -> ${imageUrl}`);
      return imageUrl;
    }
    
    console.warn(
      `[findPalaceImage] ${recipe.era} - ${recipe.title} (번호: ${recipe.number})에 해당하는 궁중 사진을 찾을 수 없습니다.`
    );
    console.log(`[findPalaceImage] 사용 가능한 파일 목록:`, imageFiles.slice(0, 5));
    return null;
  } catch (error) {
    console.error(`[findPalaceImage] 이미지 검색 실패:`, error);
    return null;
  }
}

/**
 * 레시피에 해당하는 현대 이미지 파일을 찾습니다.
 * public/images/royalrecipe 폴더에 있는 이미지를 직접 URL로 반환합니다.
 */
export function findModernImage(recipe: RoyalRecipe): string | null {
  const imageDir = IMAGE_DIRS[recipe.era].modern;
  
  if (!imageDir) {
    // 현대 이미지 폴더가 아직 없는 경우
    return null;
  }
  
  const dirPath = path.join(process.cwd(), "public", "images", "royalrecipe", imageDir);
  
  if (!fs.existsSync(dirPath)) {
    console.warn(`[findModernImage] 디렉토리가 없습니다: ${dirPath}`);
    return null;
  }
  
  try {
    const files = fs.readdirSync(dirPath);
    const imageFiles = files.filter(
      (file) => file.toLowerCase().endsWith(".png") || file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".jpeg")
    );
    
    console.log(`[findModernImage] ${recipe.era} - ${recipe.title}`);
    console.log(`[findModernImage] 찾은 현대 이미지 파일 수: ${imageFiles.length}`);
    
    // 제목으로 매칭 시도
    const titleMatchedFile = imageFiles.find((file) =>
      isFileMatchingTitle(file, recipe.title)
    );
    
    if (titleMatchedFile) {
      // public/images/royalrecipe 폴더는 /images/royalrecipe/ URL로 접근 가능
      const imageUrl = `/images/royalrecipe/${encodeURIComponent(imageDir)}/${encodeURIComponent(titleMatchedFile)}`;
      console.log(`[findModernImage] 제목으로 매칭 성공: ${titleMatchedFile} -> ${imageUrl}`);
      return imageUrl;
    }
    
    console.warn(
      `[findModernImage] ${recipe.era} - ${recipe.title}에 해당하는 현대 이미지를 찾을 수 없습니다.`
    );
    console.log(`[findModernImage] 사용 가능한 파일 목록:`, imageFiles.slice(0, 5));
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

