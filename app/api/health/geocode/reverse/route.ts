/**
 * @file route.ts
 * @description 역지오코딩 API 엔드포인트 (좌표 -> 주소)
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/health/geocode/reverse
 *
 * 역지오코딩 API (좌표 -> 주소)
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/geocode/reverse");

    const body = await request.json();
    const { coordinates } = body;

    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      console.error("좌표가 필요합니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "좌표가 필요합니다." },
        { status: 400 }
      );
    }

    // API 키 가져오기
    let clientId = process.env.NAVER_SEARCH_CLIENT_ID;
    let clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      clientId = process.env.NAVER_MAP_CLIENT_ID;
      clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;
    }

    if (!clientId || !clientSecret) {
      clientId = process.env.NAVER_CLIENT_ID;
      clientSecret = process.env.NAVER_CLIENT_SECRET;
    }

    if (!clientId || !clientSecret) {
      console.error("지오코딩 API 키가 설정되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json(
        { error: "지오코딩 API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    try {
      const geocodeUrl = new URL("https://naveropenapi.apigw.ntruss.com/map-geocoder/v2/geocode");
      geocodeUrl.searchParams.append("query", `${coordinates.lng},${coordinates.lat}`);

      console.log("역지오코딩 API 호출:", geocodeUrl.toString());

      const geocodeResponse = await fetch(geocodeUrl.toString(), {
        method: "GET",
        headers: {
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY": clientSecret,
        },
      });

      if (!geocodeResponse.ok) {
        const errorText = await geocodeResponse.text();
        console.error("역지오코딩 API 실패:", geocodeResponse.status, errorText.substring(0, 200));
        console.groupEnd();
        return NextResponse.json(
          { error: "역지오코딩에 실패했습니다." },
          { status: geocodeResponse.status }
        );
      }

      const geocodeData = await geocodeResponse.json();

      if (geocodeData.addresses && geocodeData.addresses.length > 0) {
        const address = geocodeData.addresses[0];
        const roadAddress = address.roadAddress || "";
        const jibunAddress = address.jibunAddress || "";

        // 주소에서 시도, 시군구 추출
        const sidoMatch = roadAddress.match(/^([가-힣]+(?:시|도|광역시|특별시))/);
        const sigunguMatch = roadAddress.match(/^[가-힣]+(?:시|도|광역시|특별시)\s+([가-힣]+(?:구|시|군))/);
        const dongMatch = roadAddress.match(/^[가-힣]+(?:시|도|광역시|특별시)\s+[가-힣]+(?:구|시|군)\s+([가-힣]+(?:동|읍|면))/);

        const sido = sidoMatch ? sidoMatch[1] : "";
        const sigungu = sigunguMatch ? sigunguMatch[1] : "";
        const dong = dongMatch ? dongMatch[1] : "";

        console.log("역지오코딩 성공:", { sido, sigungu, dong, fullAddress: roadAddress || jibunAddress });
        console.groupEnd();

        return NextResponse.json({
          sido,
          sigungu,
          dong,
          fullAddress: roadAddress || jibunAddress,
        });
      }

      console.log("역지오코딩 결과 없음");
      console.groupEnd();

      return NextResponse.json({
        sido: "",
        sigungu: "",
        dong: "",
        fullAddress: "",
      });
    } catch (error) {
      console.error("역지오코딩 오류:", error);
      console.groupEnd();
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "역지오코딩에 실패했습니다.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("역지오코딩 API 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "역지오코딩 API에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}