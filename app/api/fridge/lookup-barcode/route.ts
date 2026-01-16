/**
 * @file app/api/fridge/lookup-barcode/route.ts
 * @description 바코드 조회 API - 식품안전나라 API 연동
 */

import { NextRequest, NextResponse } from "next/server";

interface FoodSafetyApiResponse {
  C005?: {
    total_count?: string;
    row?: Array<{
      PRDLST_NM?: string;        // 제품명
      BSSH_NM?: string;           // 제조사
      PRDLST_DCNM?: string;       // 카테고리
      POG_DAYCNT?: string;        // 유통기한 (일)
      IMGURL1?: string;           // 이미지 URL
      BAR_CD?: string;            // 바코드
    }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json(
        { error: "바코드가 필요합니다" },
        { status: 400 }
      );
    }

    const apiKey = process.env.FOODSAFETY_API_KEY;
    
    if (!apiKey) {
      console.error("[BarcodeAPI] FOODSAFETY_API_KEY 환경 변수가 설정되지 않았습니다");
      return NextResponse.json(
        { error: "API 키 미설정" },
        { status: 500 }
      );
    }

    // 식품안전나라 API 호출
    const apiUrl = `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/C005/json/1/5/BAR_CD=${barcode}`;
    
    console.log("[BarcodeAPI] 바코드 조회 시작:", barcode);
    
    const response = await fetch(apiUrl);
    const data: FoodSafetyApiResponse = await response.json();

    // API 응답 확인
    if (data.C005?.row && data.C005.row.length > 0) {
      const product = data.C005.row[0];
      
      console.log("[BarcodeAPI] 제품 정보 찾음:", product.PRDLST_NM);
      
      return NextResponse.json({
        name: product.PRDLST_NM || "알 수 없는 제품",
        barcode: barcode,
        manufacturer: product.BSSH_NM,
        category: product.PRDLST_DCNM,
        shelfLifeDays: product.POG_DAYCNT ? parseInt(product.POG_DAYCNT) : 7,
        imageUrl: product.IMGURL1,
      });
    }

    // 제품 정보를 찾지 못한 경우
    console.log("[BarcodeAPI] 제품 정보를 찾을 수 없음:", barcode);
    
    return NextResponse.json(
      { 
        name: "바코드: " + barcode, 
        barcode: barcode, 
        shelfLifeDays: 7 
      },
      { status: 404 }
    );

  } catch (error) {
    console.error("[BarcodeAPI] 조회 실패:", error);
    return NextResponse.json(
      { error: "바코드 조회 실패" },
      { status: 500 }
    );
  }
}

