/**
 * @file scripts/test-medication-overview-api.ts
 * @description 의약품개요정보 API 테스트 스크립트
 * 
 * 실행 방법: npx tsx scripts/test-medication-overview-api.ts
 */

import { searchMedicationOverviewByName } from "../lib/mfds/medication-overview-client";

async function testMedicationOverviewAPI() {
  console.group("🧪 의약품개요정보 API 테스트");
  
  // 환경 변수 확인
  const apiKey = process.env.MFDS_MEDICATION_OVERVIEW_API_KEY || process.env.MFDS_API_KEY;
  console.log("환경 변수 확인:", {
    hasMFDS_MEDICATION_OVERVIEW_API_KEY: !!process.env.MFDS_MEDICATION_OVERVIEW_API_KEY,
    hasMFDS_API_KEY: !!process.env.MFDS_API_KEY,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
  });

  if (!apiKey) {
    console.error("❌ API 키가 설정되지 않았습니다.");
    console.error("   .env.local 파일에 MFDS_API_KEY 또는 MFDS_MEDICATION_OVERVIEW_API_KEY를 설정해주세요.");
    console.groupEnd();
    process.exit(1);
  }

  try {
    // 테스트 검색어
    const testItemName = "타이레놀";
    console.log("\n📋 테스트 검색어:", testItemName);

    // API 호출
    console.log("\n🔄 API 호출 중...");
    const result = await searchMedicationOverviewByName(testItemName, 1, 5);

    console.log("\n✅ API 테스트 성공!");
    console.log("조회 결과:", {
      totalCount: result.totalCount,
      itemsCount: result.items.length,
      pageNo: result.pageNo,
      numOfRows: result.numOfRows,
    });

    if (result.items.length > 0) {
      console.log("\n📦 조회된 의약품 정보 (첫 번째 항목):");
      const firstItem = result.items[0];
      console.log({
        item_name: firstItem.item_name,
        entp_name: firstItem.entp_name,
        ingr_name: firstItem.ingr_name,
        ee_doc_data: firstItem.ee_doc_data?.substring(0, 100) + "...",
        nb_doc_data: firstItem.nb_doc_data?.substring(0, 100) + "...",
      });
    } else {
      console.log("\n⚠️ 조회된 항목이 없습니다.");
    }

    console.groupEnd();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ API 테스트 실패:");
    console.error("오류 메시지:", error instanceof Error ? error.message : String(error));
    console.error("오류 스택:", error instanceof Error ? error.stack : undefined);
    console.groupEnd();
    process.exit(1);
  }
}

// 스크립트 실행
testMedicationOverviewAPI();

