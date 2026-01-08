/**
 * @file lib/recipes/recipe-fetcher/web-scraper.ts
 * @description 웹 스크래퍼 - 레시피 블로그/사이트 크롤링
 *
 * 주요 기능:
 * 1. 네이버 검색 API를 통한 레시피 검색
 * 2. 레시피 블로그/사이트 크롤링
 * 3. 원본 HTML/데이터 추출
 *
 * @dependencies
 * - 환경 변수: NAVER_SEARCH_CLIENT_ID, NAVER_SEARCH_CLIENT_SECRET
 */

import type { StandardizedRecipe } from "./index";

/**
 * 웹 스크래핑 옵션
 */
export interface ScrapeOptions {
  keywords: string[];
  maxResults?: number;
  site?: string; // 특정 사이트 필터 (예: "10000recipe.com")
}

/**
 * 원본 레시피 데이터 (파싱 전)
 */
export interface RawRecipeData {
  title: string;
  url: string;
  description?: string;
  content?: string; // HTML 또는 텍스트
  source: string;
  metadata?: Record<string, any>;
}

/**
 * 웹에서 레시피 스크래핑
 * 
 * @param options 스크래핑 옵션
 * @returns 원본 레시피 데이터 목록
 */
export async function scrapeRecipes(
  options: ScrapeOptions
): Promise<RawRecipeData[]> {
  console.group("🌐 웹 스크래핑 시작");
  console.log("키워드:", options.keywords);
  console.log("최대 결과:", options.maxResults || 50);

  const results: RawRecipeData[] = [];

  try {
    // 네이버 검색 API 사용
    const naverResults = await searchNaverRecipes({
      keywords: options.keywords,
      maxResults: options.maxResults || 50,
    });

    results.push(...naverResults);
    console.log(`✅ 네이버 검색: ${naverResults.length}개 결과`);

    // TODO: 다른 소스 추가 (10000recipe.com, 만개의레시피 등)

    console.log(`✅ 총 ${results.length}개 레시피 스크래핑 완료`);
    console.groupEnd();

    return results;
  } catch (error) {
    console.error("❌ 웹 스크래핑 실패:", error);
    console.groupEnd();
    return results;
  }
}

/**
 * 네이버 검색 API를 통한 레시피 검색
 */
async function searchNaverRecipes(options: {
  keywords: string[];
  maxResults: number;
}): Promise<RawRecipeData[]> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("⚠️ 네이버 검색 API 키가 설정되지 않았습니다");
    return [];
  }

  const results: RawRecipeData[] = [];

  try {
    // 각 키워드별로 검색
    for (const keyword of options.keywords) {
      const searchQuery = `${keyword} 레시피`;
      const url = `https://openapi.naver.com/v1/search/blog?query=${encodeURIComponent(searchQuery)}&display=10&sort=sim`;

      const response = await fetch(url, {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ 네이버 검색 API 오류 (${keyword}): ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const items = data.items || [];

      for (const item of items) {
        results.push({
          title: item.title.replace(/<[^>]*>/g, ""), // HTML 태그 제거
          url: item.link,
          description: item.description.replace(/<[^>]*>/g, ""),
          source: "naver_blog",
          metadata: {
            bloggername: item.bloggername,
            postdate: item.postdate,
          },
        });

        if (results.length >= options.maxResults) {
          break;
        }
      }

      if (results.length >= options.maxResults) {
        break;
      }
    }

    return results.slice(0, options.maxResults);
  } catch (error) {
    console.error("❌ 네이버 검색 API 실패:", error);
    return results;
  }
}

