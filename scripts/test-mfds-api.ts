/**
 * @file scripts/test-mfds-api.ts
 * @description 식약처 API 연결 테스트 스크립트
 * 
 * 사용 방법:
 *   pnpm tsx scripts/test-mfds-api.ts
 */

import "dotenv/config";
import { fetchFoodSafetyRecipes } from "@/lib/recipes/foodsafety-api";

async function main() {
  console.group("🔍 식약처 API 연결 테스트");
  
  try {
    // 1. 환경 변수 확인
    const apiKey = process.env.FOOD_SAFETY_RECIPE_API_KEY;
    console.log("API 키 존재 여부:", !!apiKey);
    console.log("API 키 길이:", apiKey?.length);
    console.log("API 키 (처음 10자리):", apiKey?.substring(0, 10) + "...");
    
    if (!apiKey) {
      console.error("❌ FOOD_SAFETY_RECIPE_API_KEY가 설정되지 않았습니다.");
      console.groupEnd();
      process.exit(1);
    }

    // 2. API 테스트 호출 (소량 데이터만)
    console.log("\n📡 식약처 API 호출 시도 (1~5번 레시피)...");
    const result = await fetchFoodSafetyRecipes({
      startIdx: 1,
      endIdx: 5,
      maxRetries: 3,
      retryDelay: 2000,
    });

    if (result.success && result.data && result.data.length > 0) {
      console.log("\n✅ 식약처 API 연결 성공!");
      console.log(`📊 조회된 레시피 수: ${result.data.length}개`);
      console.log(`📊 전체 레시피 수: ${result.totalCount || "알 수 없음"}개`);
      console.log("\n📝 샘플 레시피:");
      result.data.slice(0, 3).forEach((recipe, index) => {
        console.log(`  ${index + 1}. ${recipe.RCP_NM} (${recipe.RCP_SEQ})`);
        console.log(`     - 칼로리: ${recipe.INFO_ENG || "정보 없음"}`);
        console.log(`     - 요리 종류: ${recipe.RCP_PAT2 || "정보 없음"}`);
      });
      console.groupEnd();
      process.exit(0);
    } else {
      console.error("\n❌ 식약처 API 호출 실패");
      console.error("에러:", result.error);
      console.groupEnd();
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ 테스트 중 오류 발생:");
    console.error(error);
    console.groupEnd();
    process.exit(1);
  }
}

main().catch(console.error);

